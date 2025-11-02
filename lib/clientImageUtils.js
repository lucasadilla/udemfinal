const SIX_MEGABYTES = 6 * 1024 * 1024;
const FOUR_MEGABYTES = 4 * 1024 * 1024;
const DEFAULT_MAX_WIDTH = 1200;
const DEFAULT_QUALITY = 0.7;

export const IMAGE_ERRORS = {
  TOO_LARGE: 'IMAGE_TOO_LARGE',
  CONTEXT: 'CANVAS_CONTEXT_ERROR',
  COMPRESSION: 'COMPRESSION_ERROR',
};

export const MAX_FORM_FILE_SIZE = SIX_MEGABYTES;
export const MAX_FORM_BASE64_SIZE = FOUR_MEGABYTES;

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

export async function createCoverImageDataUrl(file, {
  maxFileSize = MAX_FORM_FILE_SIZE,
  maxBase64Size = MAX_FORM_BASE64_SIZE,
  maxWidth = DEFAULT_MAX_WIDTH,
  quality = DEFAULT_QUALITY,
} = {}) {
  const dataUrl = file.size > maxFileSize
    ? await compressImageFile(file, { maxWidth, quality })
    : await readFileAsDataURL(file);

  if (estimateBase64Size(dataUrl) > maxBase64Size) {
    const error = new Error(IMAGE_ERRORS.TOO_LARGE);
    error.code = IMAGE_ERRORS.TOO_LARGE;
    throw error;
  }

  return dataUrl;
}

