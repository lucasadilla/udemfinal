import fs from 'node:fs/promises';
import path from 'node:path';
import { NextResponse } from 'next/server';
import {
  buildFileName,
  ensureUploadsDirectory,
  isReadOnlyFileSystemError,
  toPublicPath,
} from '../../../lib/podcastUploadUtils.js';

const userImageUploadsDirectory = path.join(process.cwd(), 'public', 'uploads', 'users');

export const runtime = 'nodejs';

function createHttpError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function isFileLike(value) {
  return (
    value &&
    typeof value === 'object' &&
    typeof value.arrayBuffer === 'function' &&
    typeof value.name === 'string' &&
    Number.isFinite(Number(value.size))
  );
}

export async function POST(request) {
  try {
    const contentType = request.headers.get('content-type') || '';
    if (!contentType.toLowerCase().includes('multipart/form-data')) {
      throw createHttpError(415, 'Le corps de la requête doit être envoyé en formulaire multipart.');
    }

    const formData = await request.formData();
    const uploadedFile = formData.get('file');

    if (!isFileLike(uploadedFile)) {
      throw createHttpError(400, 'Aucun fichier valide fourni.');
    }

    const fileSize = Number(uploadedFile.size);
    if (!Number.isFinite(fileSize) || fileSize <= 0) {
      throw createHttpError(400, 'Le fichier téléversé est vide.');
    }

    const ensureResult = ensureUploadsDirectory(userImageUploadsDirectory);
    if (ensureResult?.readOnly) {
      throw createHttpError(500, 'Le serveur ne peut pas enregistrer la photo de profil pour le moment.');
    }

    const fileName = buildFileName(uploadedFile.name, uploadedFile.type, 'user-image');
    const destination = path.join(userImageUploadsDirectory, fileName);

    const arrayBuffer = await uploadedFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    try {
      await fs.writeFile(destination, buffer);
    } catch (error) {
      if (isReadOnlyFileSystemError(error)) {
        throw createHttpError(500, 'Le serveur ne peut pas enregistrer la photo de profil pour le moment.');
      }
      throw error;
    }

    const publicUrl = toPublicPath(destination);
    return NextResponse.json({ url: publicUrl }, { status: 200 });
  } catch (error) {
    const status = error?.status && Number.isInteger(error.status) ? error.status : 500;
    const message =
      typeof error?.message === 'string' && error.message
        ? error.message
        : 'Une erreur est survenue lors du téléversement de la photo de profil.';

    if (status >= 500) {
      console.error('Erreur lors du téléversement de la photo de profil :', error);
    }

    return NextResponse.json({ error: message }, { status });
  }
}
