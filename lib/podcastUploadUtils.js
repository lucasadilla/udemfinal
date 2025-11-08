import fs from 'node:fs';
import fsPromises from 'node:fs/promises';
import path from 'node:path';
import { ObjectId } from 'mongodb';
import { getPodcastMediaBucket, isGridFsUnavailable } from './podcastMediaStorage.js';

const baseUploadsDirectory = path.join(process.cwd(), 'public', 'uploads', 'podcasts');
const videoUploadsDirectory = path.join(baseUploadsDirectory, 'videos');
const imageUploadsDirectory = path.join(baseUploadsDirectory, 'images');

export function ensureUploadsDirectory(directory) {
  if (fs.existsSync(directory)) {
    return { created: false, readOnly: false };
  }

  try {
    fs.mkdirSync(directory, { recursive: true });
    return { created: true, readOnly: false };
  } catch (error) {
    if (isReadOnlyFileSystemError(error)) {
      return { created: false, readOnly: true };
    }

    throw error;
  }
}

export function isReadOnlyFileSystemError(error) {
  return error?.code === 'EACCES' || error?.code === 'EROFS' || error?.code === 'EPERM';
}

export function sanitizeBaseName(name, fallback) {
  const base = (name || fallback || 'file').toLowerCase();
  const sanitized = base
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
  return sanitized || fallback || 'file';
}

export function buildFileName(originalName, mimeType, fallbackBaseName) {
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

export function toPublicPath(absolutePath) {
  const relativeDirectory = path.relative(path.join(process.cwd(), 'public'), absolutePath);
  return path.posix.join('/', relativeDirectory.split(path.sep).join('/'));
}

function isExternalUrl(url) {
  return (
    typeof url !== 'string' ||
    url.startsWith('data:') ||
    url.startsWith('http://') ||
    url.startsWith('https://')
  );
}

function extractGridFsIdFromUrl(url) {
  if (typeof url !== 'string' || !url) {
    return null;
  }

  try {
    const parsed = new URL(url, 'http://localhost');
    if (parsed.pathname.startsWith('/api/podcasts/media/')) {
      return parsed.pathname.split('/').filter(Boolean).pop() || null;
    }
  } catch (error) {
    if (url.startsWith('/api/podcasts/media/')) {
      return url.split('/').filter(Boolean).pop() || null;
    }
  }

  return null;
}

export async function deleteMediaFileIfExists(target) {
  if (!target) {
    return;
  }

  const normalized =
    typeof target === 'object' && target !== null
      ? { url: target.url ?? target.path ?? target.filePath, fileId: target.fileId ?? null }
      : { url: target, fileId: null };

  let { fileId } = normalized;
  const { url } = normalized;

  if (!fileId) {
    fileId = extractGridFsIdFromUrl(url);
  }

  if (fileId) {
    try {
      const bucket = await getPodcastMediaBucket();
      const objectId = typeof fileId === 'string' ? new ObjectId(fileId) : fileId;
      await bucket.delete(objectId);
    } catch (error) {
      if (error?.code === 'FileNotFound') {
        // Already deleted; ignore.
      } else if (isGridFsUnavailable(error)) {
        // GridFS not available in this environment; nothing to delete.
      } else {
        console.error('Erreur lors de la suppression du fichier GridFS :', error);
      }
    }
  }

  if (isExternalUrl(url)) {
    return;
  }

  const sanitizedPath = url.startsWith('/') ? url.slice(1) : url;
  const absolutePath = path.join(process.cwd(), 'public', sanitizedPath);

  try {
    const stats = await fsPromises.stat(absolutePath);
    if (stats.isFile()) {
      await fsPromises.unlink(absolutePath);
    }
  } catch (error) {
    // Ignore missing files or filesystem errors.
  }
}

export { baseUploadsDirectory, videoUploadsDirectory, imageUploadsDirectory };
