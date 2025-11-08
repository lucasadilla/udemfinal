const DEFAULT_UPLOAD_LIMIT_BYTES = 50 * 1024 * 1024; // 50 MiB
const SIZE_UNITS = ['octets', 'Ko', 'Mo', 'Go', 'To'];

function parseUploadLimit(rawValue) {
  if (!rawValue && rawValue !== 0) {
    return null;
  }

  const value = typeof rawValue === 'number' ? rawValue : Number(rawValue);
  if (Number.isFinite(value) && value > 0) {
    return Math.floor(value);
  }

  if (typeof rawValue !== 'string') {
    return null;
  }

  const trimmed = rawValue.trim();
  if (!trimmed) {
    return null;
  }

  const match = trimmed.match(/^(\d+(?:\.\d+)?)\s*(kb|mb|gb|tb)$/i);
  if (!match) {
    return null;
  }

  const size = Number(match[1]);
  if (!Number.isFinite(size) || size <= 0) {
    return null;
  }

  const unit = match[2].toLowerCase();
  const multiplier = {
    kb: 1024,
    mb: 1024 ** 2,
    gb: 1024 ** 3,
    tb: 1024 ** 4,
  }[unit];

  return Math.round(size * multiplier);
}

function resolveUploadLimit() {
  const env = typeof process !== 'undefined' && process?.env ? process.env : {};
  const candidates = [
    env.NEXT_PUBLIC_PODCAST_UPLOAD_LIMIT_BYTES,
    env.NEXT_PUBLIC_PODCAST_UPLOAD_LIMIT,
    env.PODCAST_UPLOAD_LIMIT_BYTES,
    env.PODCAST_UPLOAD_LIMIT,
  ];

  for (const candidate of candidates) {
    const parsed = parseUploadLimit(candidate);
    if (Number.isFinite(parsed) && parsed > 0) {
      return parsed;
    }
  }

  return DEFAULT_UPLOAD_LIMIT_BYTES;
}

export const PODCAST_UPLOAD_LIMIT_BYTES = resolveUploadLimit();

export function formatBytes(bytes) {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return '';
  }

  const exponent = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    SIZE_UNITS.length - 1,
  );

  const value = bytes / 1024 ** exponent;
  const formatter = new Intl.NumberFormat('fr-CA', {
    maximumFractionDigits: value >= 10 || exponent === 0 ? 0 : 1,
    minimumFractionDigits: 0,
  });

  return `${formatter.format(value)} ${SIZE_UNITS[exponent]}`;
}

export const formattedUploadLimit = formatBytes(PODCAST_UPLOAD_LIMIT_BYTES);

export function isFileSizeTooLarge(size) {
  if (!Number.isFinite(size)) {
    return false;
  }
  return size > PODCAST_UPLOAD_LIMIT_BYTES;
}

export function isFileTooLarge(file) {
  if (!file || typeof file !== 'object') {
    return false;
  }

  const size = Number(file.size);
  return isFileSizeTooLarge(size);
}
