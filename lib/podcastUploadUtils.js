import fs from 'node:fs';
import path from 'node:path';

const baseUploadsDirectory = path.join(process.cwd(), 'public', 'uploads', 'podcasts');
const videoUploadsDirectory = path.join(baseUploadsDirectory, 'videos');
const imageUploadsDirectory = path.join(baseUploadsDirectory, 'images');
const tempUploadsDirectory = path.join(baseUploadsDirectory, 'tmp');

const DEFAULT_MAX_UPLOAD_SIZE_BYTES = 4 * 1024 * 1024 * 1024; // 4 GB
const parsedUploadLimit = Number(process.env.PODCAST_MAX_UPLOAD_BYTES);
export const MAX_UPLOAD_SIZE_BYTES =
  Number.isFinite(parsedUploadLimit) && parsedUploadLimit > 0 ? parsedUploadLimit : DEFAULT_MAX_UPLOAD_SIZE_BYTES;

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

export function deleteMediaFileIfExists(filePath) {
  if (
    !filePath ||
    typeof filePath !== 'string' ||
    filePath.startsWith('data:') ||
    filePath.startsWith('http://') ||
    filePath.startsWith('https://')
  ) {
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

export function formatBytes(bytes) {
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

export { baseUploadsDirectory, videoUploadsDirectory, imageUploadsDirectory, tempUploadsDirectory };
