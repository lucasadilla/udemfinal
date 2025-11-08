import fs from 'node:fs';
import path from 'node:path';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { NextResponse } from 'next/server';
import {
  buildFileName,
  deleteMediaFileIfExists,
  ensureUploadsDirectory,
  imageUploadsDirectory,
  isReadOnlyFileSystemError,
  toPublicPath,
  videoUploadsDirectory,
} from '../../../lib/podcastUploadUtils.js';
import { addPodcast, deletePodcastById, getPodcastBySlug, getPodcasts } from '../../../lib/podcastDatabase';

export const runtime = 'nodejs';

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function isValidHttpUrl(value) {
  if (typeof value !== 'string' || !value.trim()) {
    return false;
  }

  try {
    const parsed = new URL(value);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch (error) {
    return false;
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

function isFile(value) {
  return (
    value &&
    typeof value === 'object' &&
    typeof value.arrayBuffer === 'function' &&
    typeof value.name === 'string' &&
    Number.isFinite(Number(value.size))
  );
}

async function persistUploadedFile(file, type) {
  if (!isFile(file)) {
    throw new HttpError(400, 'Le fichier téléversé est invalide.');
  }

  const fileSize = Number(file.size);
  if (fileSize <= 0) {
    throw new HttpError(400, 'Le fichier téléversé est vide.');
  }

  const targetDirectory = type === 'image' ? imageUploadsDirectory : videoUploadsDirectory;
  const ensureResult = ensureUploadsDirectory(targetDirectory);
  if (ensureResult?.readOnly) {
    throw new HttpError(500, 'Le serveur ne peut pas enregistrer de fichiers pour le moment.');
  }

  const fileName = buildFileName(file.name, file.type, type === 'image' ? 'image' : 'media');
  const destination = path.join(targetDirectory, fileName);
  const readableStream = Readable.fromWeb(file.stream());
  const writeStream = fs.createWriteStream(destination);

  try {
    await pipeline(readableStream, writeStream);
  } catch (error) {
    if (isReadOnlyFileSystemError(error)) {
      throw new HttpError(500, 'Le serveur ne peut pas enregistrer de fichiers pour le moment.');
    }
    throw error;
  }

  return toPublicPath(destination);
}

export async function POST(request) {
  const cleanupPaths = [];

  try {
    const contentType = request.headers.get('content-type') || '';
    if (!contentType.toLowerCase().includes('multipart/form-data')) {
      throw new HttpError(415, 'Le corps de la requête doit être envoyé en formulaire multipart.');
    }

    const formData = await request.formData();

    const title = (formData.get('title') || '').toString().trim();
    const date = (formData.get('date') || '').toString().trim();
    const bio = (formData.get('bio') || '').toString().trim();
    const mediaMode = (formData.get('mediaMode') || 'upload').toString();
    const imageMode = (formData.get('imageMode') || 'upload').toString();

    if (!title || !date) {
      throw new HttpError(400, 'Les champs title et date sont requis pour créer un balado.');
    }

    if (mediaMode !== 'upload' && mediaMode !== 'link') {
      throw new HttpError(400, "Le champ mediaMode doit être 'upload' ou 'link'.");
    }

    if (imageMode !== 'upload' && imageMode !== 'link') {
      throw new HttpError(400, "Le champ imageMode doit être 'upload' ou 'link'.");
    }

    const rawMediaUrl = (formData.get('mediaUrl') || '').toString().trim();
    const rawImageUrl = (formData.get('imageUrl') || '').toString().trim();

    let mediaUrl = '';
    let imageUrl = '';

    if (mediaMode === 'link') {
      if (!isValidHttpUrl(rawMediaUrl)) {
        throw new HttpError(400, "Le lien média fourni n'est pas valide.");
      }
      mediaUrl = rawMediaUrl;
    }

    if (imageMode === 'link') {
      if (!isValidHttpUrl(rawImageUrl)) {
        throw new HttpError(400, "Le lien d'image fourni n'est pas valide.");
      }
      imageUrl = rawImageUrl;
    }

    const mediaFile = formData.get('media');
    const imageFile = formData.get('image');

    let storedMediaPath = '';
    let storedImagePath = '';

    if (mediaMode === 'upload') {
      if (!isFile(mediaFile)) {
        throw new HttpError(400, 'Un fichier audio ou vidéo doit être fourni.');
      }
      storedMediaPath = await persistUploadedFile(mediaFile, 'video');
      cleanupPaths.push(storedMediaPath);
    } else {
      storedMediaPath = mediaUrl;
    }

    if (imageMode === 'upload') {
      if (!isFile(imageFile)) {
        throw new HttpError(400, "Une image de couverture doit être fournie.");
      }
      storedImagePath = await persistUploadedFile(imageFile, 'image');
      cleanupPaths.push(storedImagePath);
    } else {
      storedImagePath = imageUrl;
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
      mediaSource: mediaMode === 'upload' ? 'upload' : 'external',
      imageSource: imageMode === 'upload' ? 'upload' : 'external',
    });

    return NextResponse.json(podcast, { status: 201 });
  } catch (error) {
    cleanupPaths.forEach((filePath) => deleteMediaFileIfExists(filePath));

    if (error instanceof HttpError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    console.error('Échec du traitement de la requête POST /api/podcasts :', error);
    return NextResponse.json({ error: 'Échec du traitement de la requête de balado.' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const podcasts = await getPodcasts();
    return NextResponse.json(podcasts, { status: 200 });
  } catch (error) {
    console.error('Échec du traitement de la requête GET /api/podcasts :', error);
    return NextResponse.json({ error: 'Échec du traitement de la requête de balado.' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Un identifiant de balado est requis.' }, { status: 400 });
    }

    const deletedPodcast = await deletePodcastById(id);

    if (!deletedPodcast) {
      return NextResponse.json({ error: 'Balado introuvable.' }, { status: 404 });
    }

    deleteMediaFileIfExists(deletedPodcast.video);
    deleteMediaFileIfExists(deletedPodcast.image);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Échec du traitement de la requête DELETE /api/podcasts :', error);
    return NextResponse.json({ error: 'Échec du traitement de la requête de balado.' }, { status: 500 });
  }
}
