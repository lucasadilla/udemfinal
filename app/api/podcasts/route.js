import fs from 'node:fs';
import path from 'node:path';
import { Readable } from 'node:stream';
import Busboy from 'next/dist/compiled/busboy';
import { NextResponse } from 'next/server';
import {
  addPodcast,
  deletePodcastById,
  getPodcastBySlug,
  getPodcasts,
} from '../../../lib/podcastDatabase';

const baseUploadsDirectory = path.join(process.cwd(), 'public', 'uploads', 'podcasts');
const videoUploadsDirectory = path.join(baseUploadsDirectory, 'videos');
const imageUploadsDirectory = path.join(baseUploadsDirectory, 'images');

export const runtime = 'nodejs';

function ensureUploadsDirectory(directory) {
  if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory, { recursive: true });
  }
}

function isReadOnlyFileSystemError(error) {
  return error?.code === 'EACCES' || error?.code === 'EROFS' || error?.code === 'EPERM';
}

function sanitizeBaseName(name, fallback) {
  const base = (name || fallback || 'file').toLowerCase();
  const sanitized = base
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
  return sanitized || fallback || 'file';
}

function buildFileName(originalName, mimeType, fallbackBaseName) {
  const originalExt = (originalName && path.extname(originalName)) || '';
  const baseName = sanitizeBaseName(
    originalName ? path.basename(originalName, originalExt) : '',
    fallbackBaseName,
  );
  const fallbackExt =
    originalExt || (mimeType && mimeType.includes('/') ? `.${mimeType.split('/')[1].split(/[+;]/)[0]}` : '');
  const safeExt = fallbackExt || '';
  return `${Date.now()}-${baseName}${safeExt}`;
}

function toPublicPath(absolutePath) {
  const relativeDirectory = path.relative(path.join(process.cwd(), 'public'), absolutePath);
  return path.posix.join('/', relativeDirectory.split(path.sep).join('/'));
}

class HttpError extends Error {
  constructor(status, message, meta = {}) {
    super(message);
    this.status = status;
    this.meta = meta;
  }
}

async function streamToBuffer(stream) {
  const chunks = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

async function persistUploadedStream(stream, info, directory, fallbackBaseName, truncatedRef, fieldName) {
  if (!stream) {
    throw new HttpError(400, 'Aucun fichier transmis.');
  }

  const fileName = buildFileName(info?.filename, info?.mimeType, fallbackBaseName);
  const targetPath = path.join(directory, fileName);
  ensureUploadsDirectory(directory);

  let writeStream;
  try {
    writeStream = fs.createWriteStream(targetPath);
  } catch (error) {
    if (isReadOnlyFileSystemError(error)) {
      const buffer = await streamToBuffer(stream);
      return `data:${info?.mimeType || 'application/octet-stream'};base64,${buffer.toString('base64')}`;
    }
    throw error;
  }

  const chunks = [];

  try {
    await new Promise((resolve, reject) => {
      stream.on('data', (chunk) => {
        chunks.push(Buffer.from(chunk));
      });
      stream.on('error', (error) => {
        reject(error);
      });
      writeStream.on('error', (error) => {
        reject(error);
      });
      writeStream.on('finish', resolve);
      stream.pipe(writeStream);
    });

    if (truncatedRef?.value) {
      if (fs.existsSync(targetPath)) {
        fs.unlinkSync(targetPath);
      }
      throw new HttpError(413, 'Le fichier dépasse la taille maximale autorisée.', { field: fieldName });
    }

    chunks.length = 0;
    return toPublicPath(targetPath);
  } catch (error) {
    if (fs.existsSync(targetPath)) {
      fs.unlinkSync(targetPath);
    }

    if (isReadOnlyFileSystemError(error)) {
      const buffer = Buffer.concat(chunks);
      return `data:${info?.mimeType || 'application/octet-stream'};base64,${buffer.toString('base64')}`;
    }

    throw error;
  }
}

function deleteMediaFileIfExists(filePath) {
  if (!filePath || typeof filePath !== 'string' || filePath.startsWith('data:')) {
    return;
  }

  const sanitizedPath = filePath.startsWith('/') ? filePath.slice(1) : filePath;
  const absolutePath = path.join(process.cwd(), 'public', sanitizedPath);

  try {
    const stats = fs.statSync(absolutePath);
    if (stats.isFile()) {
      fs.unlinkSync(absolutePath);
    }
  } catch (error) {
    // Ignore missing files.
  }
}

async function generateUniqueSlug(title) {
  const baseSlug = title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');

  const initialSlug = baseSlug || Date.now().toString();

  for (let suffix = 0; ; suffix += 1) {
    const slugCandidate = suffix === 0 ? initialSlug : `${initialSlug}-${suffix}`;
    // eslint-disable-next-line no-await-in-loop
    const existing = await getPodcastBySlug(slugCandidate);
    if (!existing) {
      return slugCandidate;
    }
  }
}

function getFieldValue(value) {
  if (Array.isArray(value)) {
    return value[0];
  }
  if (typeof value === 'undefined' || value === null) {
    return '';
  }
  return value;
}

const MAX_UPLOAD_SIZE_BYTES = 256 * 1024 * 1024;

function ensureMultipartRequest(headers) {
  const contentType = headers.get('content-type') || '';
  if (!contentType.toLowerCase().includes('multipart/form-data')) {
    throw new HttpError(400, 'Le téléchargement doit être envoyé en multipart/form-data.');
  }
}

export async function POST(request) {
  let storedMediaPath = null;
  let storedImagePath = null;

  try {
    ensureMultipartRequest(request.headers);

    const headers = Object.fromEntries(request.headers);
    const busboy = Busboy({
      headers,
      limits: {
        fields: 20,
        files: 2,
        fileSize: MAX_UPLOAD_SIZE_BYTES,
      },
    });

    const collectedFields = {};

    const filePromises = [];

    const parsingPromise = new Promise((resolve, reject) => {
      busboy.on('finish', resolve);
      busboy.on('error', reject);
    });

    busboy.on('field', (fieldName, value) => {
      if (typeof collectedFields[fieldName] === 'undefined') {
        collectedFields[fieldName] = value;
      }
    });

    busboy.on('file', (fieldName, fileStream, info) => {
      if (fieldName !== 'video' && fieldName !== 'image') {
        fileStream.resume();
        return;
      }

      const truncatedRef = { value: false };
      fileStream.on('limit', () => {
        truncatedRef.value = true;
      });

      const destinationDirectory = fieldName === 'video' ? videoUploadsDirectory : imageUploadsDirectory;
      const fallbackBaseName = fieldName === 'video' ? 'balado-media' : 'balado-couverture';

      const promise = persistUploadedStream(
        fileStream,
        info,
        destinationDirectory,
        fallbackBaseName,
        truncatedRef,
        fieldName,
      )
        .then((storedPath) => {
          if (fieldName === 'video') {
            storedMediaPath = storedPath;
          } else {
            storedImagePath = storedPath;
          }
        });

      filePromises.push(
        promise.catch((error) => {
          if (fieldName === 'video' && storedMediaPath) {
            deleteMediaFileIfExists(storedMediaPath);
            storedMediaPath = null;
          }
          if (fieldName === 'image' && storedImagePath) {
            deleteMediaFileIfExists(storedImagePath);
            storedImagePath = null;
          }
          throw error;
        }),
      );
    });

    const nodeStream = request.body ? Readable.fromWeb(request.body) : null;
    if (!nodeStream) {
      throw new HttpError(400, 'Requête invalide.');
    }

    nodeStream.pipe(busboy);

    await parsingPromise;
    await Promise.all(filePromises);

    const title = getFieldValue(collectedFields.title).trim();
    const date = getFieldValue(collectedFields.date).trim();
    const bio = getFieldValue(collectedFields.bio).trim();

    if (!title || !date || !storedMediaPath || !storedImagePath) {
      deleteMediaFileIfExists(storedMediaPath);
      deleteMediaFileIfExists(storedImagePath);
      return NextResponse.json(
        {
          error:
            'Les champs title, date, video (audio ou vidéo) et image sont requis pour créer un balado.',
        },
        { status: 400 },
      );
    }

    const slug = await generateUniqueSlug(title);
    const podcast = await addPodcast({
      title,
      date,
      video: storedMediaPath,
      image: storedImagePath,
      slug,
      bio,
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json(podcast, { status: 201 });
  } catch (error) {
    deleteMediaFileIfExists(storedMediaPath);
    deleteMediaFileIfExists(storedImagePath);

    if (error instanceof HttpError) {
      const { status, meta } = error;
      if (status === 413) {
        const fieldLabel = meta?.field === 'image' ? 'image' : 'audio ou vidéo';
        return NextResponse.json(
          { error: `Le fichier ${fieldLabel} dépasse la taille maximale autorisée de 256 Mo.` },
          { status },
        );
      }
      return NextResponse.json({ error: error.message }, { status });
    }

    console.error('Échec du traitement de la requête POST /api/podcasts :', error);
    return NextResponse.json({ error: 'Échec du traitement de la requête de balado.' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const podcasts = await getPodcasts();
    return NextResponse.json(podcasts, { status: 200 });
  } catch (error) {
    console.error('Échec du traitement de la requête GET /api/podcasts :', error);
    return NextResponse.json({ error: 'Échec du traitement de la requête de balado.' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Un identifiant de balado est requis.' }, { status: 400 });
    }

    const deletedPodcast = await deletePodcastById(id);

    if (!deletedPodcast) {
      return NextResponse.json({ error: 'Balado introuvable.' }, { status: 404 });
    }

    deleteMediaFileIfExists(deletedPodcast.video);
    deleteMediaFileIfExists(deletedPodcast.image);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Échec du traitement de la requête DELETE /api/podcasts :', error);
    return NextResponse.json({ error: 'Échec du traitement de la requête de balado.' }, { status: 500 });
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
};
