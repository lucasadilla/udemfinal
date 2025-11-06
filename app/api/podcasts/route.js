import fs from 'node:fs';
import path from 'node:path';
import { pipeline } from 'node:stream/promises';
import { Readable } from 'node:stream';
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
export const config = {
  api: {
    bodyParser: false,
    sizeLimit: '256mb',
  },
};

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

async function persistUploadedFile(file, directory, fallbackBaseName) {
  if (!file) {
    throw new Error('Aucun fichier transmis.');
  }

  const fileName = buildFileName(file.name, file.type, fallbackBaseName);
  const targetPath = path.join(directory, fileName);
  ensureUploadsDirectory(directory);

  let writeStream;
  try {
    writeStream = fs.createWriteStream(targetPath);
  } catch (error) {
    if (isReadOnlyFileSystemError(error)) {
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      return `data:${file.type || 'application/octet-stream'};base64,${buffer.toString('base64')}`;
    }
    throw error;
  }

  try {
    const readable = Readable.fromWeb(file.stream());
    await pipeline(readable, writeStream);
    return toPublicPath(targetPath);
  } catch (error) {
    if (fs.existsSync(targetPath)) {
      fs.unlinkSync(targetPath);
    }

    if (isReadOnlyFileSystemError(error)) {
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      return `data:${file.type || 'application/octet-stream'};base64,${buffer.toString('base64')}`;
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

export async function POST(request) {
  try {
    const formData = await request.formData();
    const title = getFieldValue(formData.get('title')).trim();
    const date = getFieldValue(formData.get('date')).trim();
    const bio = getFieldValue(formData.get('bio')).trim();
    const mediaFile = formData.get('video');
    const imageFile = formData.get('image');

    const isValidFile = (value) => value && typeof value === 'object' && typeof value.arrayBuffer === 'function';

    if (!title || !date || !isValidFile(mediaFile) || !isValidFile(imageFile)) {
      return NextResponse.json(
        {
          error:
            'Les champs title, date, video (audio ou vidéo) et image sont requis pour créer un balado.',
        },
        { status: 400 },
      );
    }

    let storedMediaPath;
    let storedImagePath;

    try {
      storedMediaPath = await persistUploadedFile(mediaFile, videoUploadsDirectory, 'balado-media');
      storedImagePath = await persistUploadedFile(imageFile, imageUploadsDirectory, 'balado-couverture');
    } catch (error) {
      deleteMediaFileIfExists(storedMediaPath);
      console.error("Impossible d’enregistrer les fichiers téléversés :", error);
      return NextResponse.json({ error: "Impossible d’enregistrer les fichiers téléversés." }, { status: 500 });
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
    bodyParser: {
      // Les fichiers audio et vidéo peuvent être volumineux; on augmente la limite de taille d’upload.
      sizeLimit: '256mb',
    },
  },
};
