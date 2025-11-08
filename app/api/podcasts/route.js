import fs from 'node:fs';
import path from 'node:path';
import { NextResponse } from 'next/server';
import {
  MAX_UPLOAD_SIZE_BYTES,
  deleteMediaFileIfExists,
  formatBytes,
  imageUploadsDirectory,
  videoUploadsDirectory,
} from '../../../lib/podcastUploadUtils';
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

function resolveUploadedPath(value, type) {
  const trimmed = typeof value === 'string' ? value.trim() : '';
  if (!trimmed) {
    return null;
  }

  if (trimmed.startsWith('data:') || trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return { publicPath: trimmed, cleanup: false };
  }

  if (!trimmed.startsWith('/')) {
    throw new HttpError(400, 'Chemin de fichier téléversé invalide.');
  }

  const uploadsRoot = type === 'image' ? imageUploadsDirectory : videoUploadsDirectory;
  const absoluteRoot = path.resolve(uploadsRoot);
  const absolutePath = path.resolve(path.join(process.cwd(), 'public', trimmed.slice(1)));

  if (!absolutePath.startsWith(absoluteRoot)) {
    throw new HttpError(400, 'Chemin de fichier téléversé invalide.');
  }

  if (!fs.existsSync(absolutePath)) {
    throw new HttpError(400, 'Le fichier téléversé est introuvable ou expiré.');
  }

  return { publicPath: trimmed, cleanup: true };
}

function validatePayload({ title, date, uploadedMediaPath, mediaUrl, uploadedImagePath, imageUrl }) {
  if (!title || !date) {
    throw new HttpError(400, 'Les champs title et date sont requis pour créer un balado.');
  }

  if (!uploadedMediaPath && !mediaUrl) {
    throw new HttpError(400, 'Une source média (téléversement ou lien externe) est requise.');
  }

  if (!uploadedImagePath && !imageUrl) {
    throw new HttpError(400, "Une image de couverture (téléversement ou lien externe) est requise.");
  }
}

export async function POST(request) {
  const cleanupPaths = [];

  try {
    const contentType = request.headers.get('content-type') || '';
    if (!contentType.toLowerCase().includes('application/json')) {
      throw new HttpError(415, 'Le corps de la requête doit être encodé en JSON.');
    }

    const payload = await request.json();
    const title = (payload.title || '').trim();
    const date = (payload.date || '').trim();
    const bio = (payload.bio || '').trim();
    const rawMediaUrl = (payload.mediaUrl || '').trim();
    const rawImageUrl = (payload.imageUrl || '').trim();
    const uploadedMediaInput = (payload.uploadedMediaPath || '').trim();
    const uploadedImageInput = (payload.uploadedImagePath || '').trim();

    const mediaUrl = isValidHttpUrl(rawMediaUrl) ? rawMediaUrl : '';
    if (rawMediaUrl && !mediaUrl) {
      throw new HttpError(400, "Le lien média fourni n'est pas valide.");
    }

    const imageUrl = isValidHttpUrl(rawImageUrl) ? rawImageUrl : '';
    if (rawImageUrl && !imageUrl) {
      throw new HttpError(400, "Le lien d'image fourni n'est pas valide.");
    }

    const resolvedMedia = uploadedMediaInput ? resolveUploadedPath(uploadedMediaInput, 'video') : null;
    const resolvedImage = uploadedImageInput ? resolveUploadedPath(uploadedImageInput, 'image') : null;

    if (resolvedMedia?.cleanup) {
      cleanupPaths.push(resolvedMedia.publicPath);
    }
    if (resolvedImage?.cleanup) {
      cleanupPaths.push(resolvedImage.publicPath);
    }

    validatePayload({
      title,
      date,
      uploadedMediaPath: resolvedMedia?.publicPath,
      mediaUrl,
      uploadedImagePath: resolvedImage?.publicPath,
      imageUrl,
    });

    const slug = await generateUniqueSlug(title);
    const podcast = await addPodcast({
      title,
      date,
      video: resolvedMedia?.publicPath || mediaUrl,
      image: resolvedImage?.publicPath || imageUrl,
      mediaSource: resolvedMedia?.publicPath ? 'upload' : 'external',
      imageSource: resolvedImage?.publicPath ? 'upload' : 'external',
      slug,
      bio,
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json(podcast, { status: 201 });
  } catch (error) {
    cleanupPaths.forEach((filePath) => deleteMediaFileIfExists(filePath));

    if (error instanceof HttpError) {
      if (error.status === 413) {
        return NextResponse.json(
          {
            error: `Le fichier dépasse la taille maximale autorisée de ${formatBytes(MAX_UPLOAD_SIZE_BYTES)}.`,
          },
          { status: error.status },
        );
      }
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

export const config = {
  api: {
    bodyParser: false,
    sizeLimit: '4096mb',
  },
};
