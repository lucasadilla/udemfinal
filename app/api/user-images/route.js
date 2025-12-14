import fs from 'node:fs';
import path from 'node:path';
import { NextResponse } from 'next/server';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import {
  buildFileName,
  ensureUploadsDirectory,
  isReadOnlyFileSystemError,
  toPublicPath,
} from '../../../lib/podcastUploadUtils.js';
import { isGridFsUnavailable } from '../../../lib/podcastMediaStorage.js';
import { getUserImageBucket } from '../../../lib/userImageStorage.js';

const userImageUploadsDirectory = path.join(process.cwd(), 'public', 'uploads', 'users');

export const runtime = 'nodejs';
export const maxDuration = 300; // 5 minutes for large file uploads

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
    // Allow any file size - no limits for user images
    if (!Number.isFinite(fileSize) || fileSize <= 0) {
      throw createHttpError(400, 'Le fichier téléversé est vide.');
    }
    
    // Log file size for debugging (but don't reject)
    if (fileSize > 50 * 1024 * 1024) {
      console.log(`[User Image Upload] Large file detected: ${(fileSize / (1024 * 1024)).toFixed(2)} MB`);
    }

    const fileName = buildFileName(uploadedFile.name, uploadedFile.type, 'user-image');
    let bucket = null;

    try {
      bucket = await getUserImageBucket();
    } catch (error) {
      if (!isGridFsUnavailable(error)) {
        throw error;
      }
      bucket = null;
    }

    if (bucket) {
      try {
        const readableStream = Readable.fromWeb(uploadedFile.stream());
        const uploadStream = bucket.openUploadStream(fileName, {
          contentType: uploadedFile.type || 'application/octet-stream',
          metadata: { mediaType: 'user-image' },
        });

        await pipeline(readableStream, uploadStream);

        const fileId = uploadStream.id?.toString?.() ?? String(uploadStream.id);
        return NextResponse.json({ url: `/api/user-images/${fileId}` }, { status: 200 });
      } catch (error) {
        if (!isGridFsUnavailable(error)) {
          throw error;
        }
        console.warn(
          "GridFS indisponible lors du téléversement d'une photo de profil; utilisation du système de fichiers local.",
          error,
        );
      }
    }

    const ensureResult = ensureUploadsDirectory(userImageUploadsDirectory);
    if (ensureResult?.readOnly) {
      throw createHttpError(500, 'Le serveur ne peut pas enregistrer la photo de profil pour le moment.');
    }

    const destination = path.join(userImageUploadsDirectory, fileName);
    const readableStream = Readable.fromWeb(uploadedFile.stream());
    const writeStream = fs.createWriteStream(destination);

    try {
      await pipeline(readableStream, writeStream);
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
