const DEFAULT_MAX_UPLOAD_SIZE_BYTES = 4 * 1024 * 1024 * 1024; // 4 GB

function resolveMaxUploadBytes() {
  const candidates = [
    process.env.PODCAST_MAX_UPLOAD_BYTES,
    process.env.NEXT_PUBLIC_PODCAST_MAX_UPLOAD_BYTES,
  ];

  for (const value of candidates) {
    const parsed = Number(value);
    if (Number.isFinite(parsed) && parsed > 0) {
      return parsed;
    }
  }

  return DEFAULT_MAX_UPLOAD_SIZE_BYTES;
}

function formatSizeLimit(bytes) {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return '4096mb';
  }

  const MEGABYTE = 1024 * 1024;
  const sizeInMb = Math.max(1, Math.ceil(bytes / MEGABYTE));
  return `${sizeInMb}mb`;
}

const nextConfig = {
  api: {
    bodyParser: {
      sizeLimit: formatSizeLimit(resolveMaxUploadBytes()),
    },
  },
};

module.exports = nextConfig;
