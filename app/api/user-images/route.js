import fs from 'node:fs';
import path from 'node:path';
import { pipeline } from 'node:stream/promises';
import { Readable } from 'node:stream';
import { NextResponse } from 'next/server';
import {
  ensureUploadsDirectory,
  isReadOnlyFileSystemError,
  buildFileName,
  toPublicPath,
} from '@/lib/podcastUploadUtils';

const userUploadsDirectory = path.join(process.cwd(), 'public', 'uploads', 'users');

function isFile(value) {
  return (
    value &&
    typeof value === 'object' &&
    typeof value.arrayBuffer === 'function' &&
    typeof value.name === 'string' &&
    Number.isFinite(Number(value.size))
  );
}

function jsonError(status, message) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(request) {
  try {
    const contentType = request.headers.get('content-type') || '';
    if (!contentType.toLowerCase().includes('multipart/form-data')) {
      return jsonError(415, 'Le corps de la requête doit être envoyé en formulaire multipart.');
    }

    const formData = await request.formData();
    const file = formData.get('file');

    if (!isFile(file)) {
      return jsonError(400, 'Aucun fichier valide fourni pour le téléversement.');
    }

    const ensureResult = ensureUploadsDirectory(userUploadsDirectory);
    if (ensureResult?.readOnly) {
      return jsonError(500, 'Le serveur ne peut pas enregistrer de fichiers pour le moment.');
    }

    const fileName = buildFileName(file.name, file.type, 'user-image');
    const destination = path.join(userUploadsDirectory, fileName);

    const readableStream = Readable.fromWeb(file.stream());
    const writeStream = fs.createWriteStream(destination);

    try {
      await pipeline(readableStream, writeStream);
    } catch (error) {
      if (isReadOnlyFileSystemError(error)) {
        return jsonError(500, 'Le serveur ne peut pas enregistrer de fichiers pour le moment.');
      }
      throw error;
    }

    const publicUrl = toPublicPath(destination);
    return NextResponse.json({ url: publicUrl });
  } catch (error) {
    console.error('Erreur lors du téléversement de la photo de profil :', error);
    return jsonError(500, "Échec du téléversement de la photo de profil.");
  }
}

export const runtime = 'nodejs';
