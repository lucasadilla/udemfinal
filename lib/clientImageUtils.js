const SIX_MEGABYTES = 6 * 1024 * 1024;
const THREE_MEGABYTES = 3 * 1024 * 1024;
const DEFAULT_MAX_WIDTH = 1200;
const DEFAULT_QUALITY = 0.7;

export const IMAGE_ERRORS = {
  TOO_LARGE: 'IMAGE_TOO_LARGE',
  CONTEXT: 'CANVAS_CONTEXT_ERROR',
  COMPRESSION: 'COMPRESSION_ERROR',
};

export const MAX_FORM_FILE_SIZE = SIX_MEGABYTES;
export const MAX_FORM_BASE64_SIZE = THREE_MEGABYTES;

export async function dataUrlToFile(
  dataUrl,
  { name = 'image.jpg', type = 'image/jpeg', lastModified } = {},
) {
  if (typeof dataUrl !== 'string' || !dataUrl.startsWith('data:')) {
    throw new Error('Invalid data URL provided');
  }

  const response = await fetch(dataUrl);
  const blob = await response.blob();

  const fileName = name || 'image.jpg';
  const fileType = type || blob.type || 'image/jpeg';

  try {
    return new File([blob], fileName, { type: fileType, lastModified });
  } catch (error) {
    // The File constructor is not supported in some older browsers (e.g., Safari 14).
    // Fallback to a Blob with a custom name property to keep FormData compatibility.
    const fallback = blob.slice(0, blob.size, fileType);
    fallback.name = fileName;
    fallback.lastModified = lastModified ?? Date.now();
    return fallback;
  }
}

export const readFileAsDataURL = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });

const canvasToDataUrl = (canvas, mimeType, quality) =>
  new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error(IMAGE_ERRORS.COMPRESSION));
          return;
        }
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(blob);
      },
      mimeType,
      quality,
    );
  });

export const compressImageFile = (
  file,
  { maxWidth = DEFAULT_MAX_WIDTH, quality = DEFAULT_QUALITY, mimeType = 'image/jpeg' } = {},
) =>
  new Promise((resolve, reject) => {
    const image = new Image();
    const objectUrl = URL.createObjectURL(file);

    image.onload = async () => {
      try {
        let { width, height } = image;

        if (width > maxWidth) {
          const ratio = maxWidth / width;
          width = maxWidth;
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const context = canvas.getContext('2d');

        if (!context) {
          reject(new Error(IMAGE_ERRORS.CONTEXT));
          return;
        }

        context.drawImage(image, 0, 0, width, height);
        const dataUrl = await canvasToDataUrl(canvas, mimeType, quality);
        resolve(dataUrl);
      } catch (error) {
        reject(error);
      } finally {
        URL.revokeObjectURL(objectUrl);
      }
    };

    image.onerror = (err) => {
      URL.revokeObjectURL(objectUrl);
      reject(err);
    };

    image.src = objectUrl;
  });

export const estimateBase64Size = (dataUrl = '') => {
  const base64 = dataUrl.split(',')[1] || '';
  return Math.ceil((base64.length * 3) / 4);
};

export async function createCoverImageDataUrl(
  file,
  {
    maxFileSize = MAX_FORM_FILE_SIZE,
    maxBase64Size = MAX_FORM_BASE64_SIZE,
    maxWidth = DEFAULT_MAX_WIDTH,
    quality = DEFAULT_QUALITY,
  } = {},
) {
  const attemptCompression = async (currentWidth, currentQuality) =>
    compressImageFile(file, { maxWidth: currentWidth, quality: currentQuality });

  let currentWidth = maxWidth;
  let currentQuality = quality;

  let dataUrl =
    file.size > maxFileSize
      ? await attemptCompression(currentWidth, currentQuality)
      : await readFileAsDataURL(file);

  let estimatedSize = estimateBase64Size(dataUrl);

  // If the payload is still too large, progressively reduce quality and width
  // to stay under the ~4 MB API request cap imposed by the hosting platform.
  // This avoids a 413 response when the JSON payload is sent to the server.
  const MAX_ATTEMPTS = 4;
  let attempt = 0;
  while (estimatedSize > maxBase64Size && attempt < MAX_ATTEMPTS) {
    attempt += 1;
    currentQuality = Math.max(0.4, currentQuality - 0.1);
    currentWidth = Math.round(currentWidth * 0.85);
    dataUrl = await attemptCompression(currentWidth, currentQuality);
    estimatedSize = estimateBase64Size(dataUrl);
  }

  if (estimatedSize > maxBase64Size) {
    const error = new Error(IMAGE_ERRORS.TOO_LARGE);
    error.code = IMAGE_ERRORS.TOO_LARGE;
    throw error;
  }

  return dataUrl;
}

