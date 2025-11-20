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
import { formattedUploadLimit, isFileSizeTooLarge } from '../../../lib/podcastUploadLimits.js';
import { addPodcast, deletePodcastById, getPodcastBySlug, getPodcasts } from '../../../lib/podcastDatabase';
import { getPodcastMediaBucket, isGridFsUnavailable } from '../../../lib/podcastMediaStorage.js';
import fs from 'node:fs';
import path from 'node:path';

export const runtime = 'nodejs';
export const maxBodySize = '1024mb';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1024mb',
    },
  },
};

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

  if (isFileSizeTooLarge(fileSize)) {
    throw new HttpError(
      413,
      formattedUploadLimit
        ? `Le fichier sélectionné dépasse la taille maximale autorisée (${formattedUploadLimit}).`
        : 'Le fichier sélectionné dépasse la taille maximale autorisée.',
    );
  }

  const fileName = buildFileName(file.name, file.type, type === 'image' ? 'image' : 'media');
  let bucket = null;

  try {
    bucket = await getPodcastMediaBucket();
  } catch (error) {
    if (!isGridFsUnavailable(error)) {
      throw error;
    }
    bucket = null;
  }

  if (bucket) {
    try {
      const readableStream = Readable.fromWeb(file.stream());
      const uploadStream = bucket.openUploadStream(fileName, {
        contentType: file.type || (type === 'image' ? 'image/*' : 'application/octet-stream'),
        metadata: { mediaType: type },
      });

      await pipeline(readableStream, uploadStream);

      const fileId = uploadStream.id?.toString?.() ?? String(uploadStream.id);
      return { url: `/api/podcasts/media/${fileId}`, fileId };
    } catch (error) {
      if (!isGridFsUnavailable(error)) {
        throw error;
      }
      console.warn(
        "GridFS indisponible lors du téléversement; utilisation du système de fichiers local en repli.",
        error,
      );
    }
  }

  const targetDirectory = type === 'image' ? imageUploadsDirectory : videoUploadsDirectory;
  const ensureResult = ensureUploadsDirectory(targetDirectory);
  if (ensureResult?.readOnly) {
    throw new HttpError(500, 'Le serveur ne peut pas enregistrer de fichiers pour le moment.');
  }

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

  return { url: toPublicPath(destination), fileId: null };
}

export async function POST(request) {
  const cleanupTargets = [];

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

    let storedMedia = { url: '', fileId: null };
    let storedImage = { url: '', fileId: null };

    if (mediaMode === 'upload') {
      if (!isFile(mediaFile)) {
        throw new HttpError(400, 'Un fichier audio ou vidéo doit être fourni.');
      }
      storedMedia = await persistUploadedFile(mediaFile, 'video');
      cleanupTargets.push(storedMedia);
    } else {
      storedMedia = { url: mediaUrl, fileId: null };
    }

    if (imageMode === 'upload') {
      if (!isFile(imageFile)) {
        throw new HttpError(400, "Une image de couverture doit être fournie.");
      }
      storedImage = await persistUploadedFile(imageFile, 'image');
      cleanupTargets.push(storedImage);
    } else {
      storedImage = { url: imageUrl, fileId: null };
    }

    const slug = await generateUniqueSlug(title);
    const podcast = await addPodcast({
      title,
      date,
      video: storedMedia.url,
      image: storedImage.url,
      videoFileId: storedMedia.fileId,
      imageFileId: storedImage.fileId,
      slug,
      bio,
      createdAt: new Date().toISOString(),
      mediaSource: mediaMode === 'upload' ? 'upload' : 'external',
      imageSource: imageMode === 'upload' ? 'upload' : 'external',
    });

    cleanupTargets.length = 0;

    return NextResponse.json(podcast, { status: 201 });
  } catch (error) {
    await Promise.all(cleanupTargets.map((target) => deleteMediaFileIfExists(target)));

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
    const sanitized = podcasts.map(({ videoFileId, imageFileId, ...rest }) => rest);
    return NextResponse.json(sanitized, {
      status: 200,
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=900',
      },
    });
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

    await Promise.all([
      deleteMediaFileIfExists({ url: deletedPodcast.video, fileId: deletedPodcast.videoFileId }),
      deleteMediaFileIfExists({ url: deletedPodcast.image, fileId: deletedPodcast.imageFileId }),
    ]);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Échec du traitement de la requête DELETE /api/podcasts :', error);
    return NextResponse.json({ error: 'Échec du traitement de la requête de balado.' }, { status: 500 });
  }
}
