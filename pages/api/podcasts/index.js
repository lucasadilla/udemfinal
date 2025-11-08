import fs from 'node:fs';
import path from 'node:path';
import { pipeline } from 'node:stream/promises';
import Busboy from 'next/dist/compiled/busboy/index.js';
import {
  addPodcast,
  deletePodcastById,
  getPodcastBySlug,
  getPodcasts,
} from '../../../lib/podcastDatabase';

const baseUploadsDirectory = path.join(process.cwd(), 'public', 'uploads', 'podcasts');
const videoUploadsDirectory = path.join(baseUploadsDirectory, 'videos');
const imageUploadsDirectory = path.join(baseUploadsDirectory, 'images');

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

  try {
    await pipeline(stream, writeStream);

    if (truncatedRef?.value) {
      if (fs.existsSync(targetPath)) {
        fs.unlinkSync(targetPath);
      }
      throw new HttpError(413, 'Le fichier dépasse la taille maximale autorisée.', { field: fieldName });
    }
    return toPublicPath(targetPath);
  } catch (error) {
    if (fs.existsSync(targetPath)) {
      fs.unlinkSync(targetPath);
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

const DEFAULT_MAX_UPLOAD_SIZE_BYTES = 4 * 1024 * 1024 * 1024; // 4 GB

function resolveMaxUploadBytes() {
  const candidates = [process.env.PODCAST_MAX_UPLOAD_BYTES, process.env.NEXT_PUBLIC_PODCAST_MAX_UPLOAD_BYTES];

  for (const candidate of candidates) {
    const parsed = Number(candidate);
    if (Number.isFinite(parsed) && parsed > 0) {
      return parsed;
    }
  }

  return DEFAULT_MAX_UPLOAD_SIZE_BYTES;
}

const MAX_UPLOAD_SIZE_BYTES = resolveMaxUploadBytes();

function formatBytes(bytes) {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return 'inconnue';
  }

  const units = ['octets', 'Ko', 'Mo', 'Go', 'To'];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }

  const precision = size >= 10 || unitIndex === 0 ? 0 : 1;
  return `${size.toFixed(precision)} ${units[unitIndex]}`;
}

function formatSizeLimitForConfig(bytes) {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return '4096mb';
  }

  const MEGABYTE = 1024 * 1024;
  const sizeInMb = Math.max(1, Math.ceil(bytes / MEGABYTE));
  return `${sizeInMb}mb`;
}

function ensureMultipartRequest(headers) {
  const contentType = typeof headers.get === 'function' ? headers.get('content-type') : headers['content-type'];
  const normalized = (contentType || '').toLowerCase();
  if (!normalized.includes('multipart/form-data')) {
    throw new HttpError(400, 'Le téléchargement doit être envoyé en multipart/form-data.');
  }
}

async function handlePost(req, res) {
  let storedMediaPath = null;
  let storedImagePath = null;

  const cleanupUploadedFiles = () => {
    if (storedMediaPath) {
      deleteMediaFileIfExists(storedMediaPath);
      storedMediaPath = null;
    }
    if (storedImagePath) {
      deleteMediaFileIfExists(storedImagePath);
      storedImagePath = null;
    }
  };

  try {
    ensureMultipartRequest(req.headers);

    const busboy = Busboy({
      headers: req.headers,
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
      ).then((storedPath) => {
        if (fieldName === 'video') {
          storedMediaPath = storedPath;
        } else {
          storedImagePath = storedPath;
        }
      });

      filePromises.push(
        promise.catch((error) => {
          cleanupUploadedFiles();
          throw error;
        }),
      );
    });

    req.pipe(busboy);

    await parsingPromise;
    await Promise.all(filePromises);

    const title = getFieldValue(collectedFields.title).trim();
    const date = getFieldValue(collectedFields.date).trim();
    const bio = getFieldValue(collectedFields.bio).trim();

    if (!title || !date || !storedMediaPath || !storedImagePath) {
      cleanupUploadedFiles();
      res.status(400).json({
        error: 'Les champs title, date, video (audio ou vidéo) et image sont requis pour créer un balado.',
      });
      return;
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

    res.status(201).json(podcast);
  } catch (error) {
    cleanupUploadedFiles();

    if (error instanceof HttpError) {
      const { status, meta } = error;
      if (status === 413) {
        const fieldLabel = meta?.field === 'image' ? 'image' : 'audio ou vidéo';
        res.status(status).json({
          error: `Le fichier ${fieldLabel} dépasse la taille maximale autorisée de ${formatBytes(
            MAX_UPLOAD_SIZE_BYTES,
          )}.`,
        });
        return;
      }

      res.status(status).json({ error: error.message });
      return;
    }

    console.error('Échec du traitement de la requête POST /api/podcasts :', error);
    res.status(500).json({ error: 'Échec du traitement de la requête de balado.' });
  }
}

async function handleGet(res) {
  try {
    const podcasts = await getPodcasts();
    res.status(200).json(podcasts);
  } catch (error) {
    console.error('Échec du traitement de la requête GET /api/podcasts :', error);
    res.status(500).json({ error: 'Échec du traitement de la requête de balado.' });
  }
}

async function handleDelete(req, res) {
  try {
    const { id } = req.query;

    if (!id) {
      res.status(400).json({ error: 'Un identifiant de balado est requis.' });
      return;
    }

    const deletedPodcast = await deletePodcastById(id);

    if (!deletedPodcast) {
      res.status(404).json({ error: 'Balado introuvable.' });
      return;
    }

    deleteMediaFileIfExists(deletedPodcast.video);
    deleteMediaFileIfExists(deletedPodcast.image);

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Échec du traitement de la requête DELETE /api/podcasts :', error);
    res.status(500).json({ error: 'Échec du traitement de la requête de balado.' });
  }
}

export default async function handler(req, res) {
  if (req.method === 'POST') {
    await handlePost(req, res);
    return;
  }

  if (req.method === 'GET') {
    await handleGet(res);
    return;
  }

  if (req.method === 'DELETE') {
    await handleDelete(req, res);
    return;
  }

  res.setHeader('Allow', 'GET,POST,DELETE');
  res.status(405).json({ error: 'Méthode non autorisée.' });
}

export const config = {
  api: {
    bodyParser: false,
    sizeLimit: formatSizeLimitForConfig(MAX_UPLOAD_SIZE_BYTES),
  },
};
