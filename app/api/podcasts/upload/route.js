import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { NextResponse } from 'next/server';
import {
  MAX_UPLOAD_SIZE_BYTES,
  buildFileName,
  deleteMediaFileIfExists,
  ensureUploadsDirectory,
  formatBytes,
  imageUploadsDirectory,
  isReadOnlyFileSystemError,
  tempUploadsDirectory,
  toPublicPath,
  videoUploadsDirectory,
} from '../../../../lib/podcastUploadUtils.js';

export const runtime = 'nodejs';

const inlineUploadSessions = new Map();

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function assertValidUploadType(value) {
  if (value !== 'video' && value !== 'image') {
    throw new HttpError(400, "Le type de fichier téléversé doit être 'video' ou 'image'.");
  }
}

function getSessionDirectory(uploadId) {
  return path.join(tempUploadsDirectory, uploadId);
}

function getMetadataPath(uploadId) {
  return path.join(getSessionDirectory(uploadId), 'meta.json');
}

function readMetadata(uploadId) {
  if (inlineUploadSessions.has(uploadId)) {
    return inlineUploadSessions.get(uploadId);
  }

  const metaPath = getMetadataPath(uploadId);
  if (!fs.existsSync(metaPath)) {
    throw new HttpError(404, "Session de téléversement introuvable ou expirée.");
  }
  const raw = fs.readFileSync(metaPath, 'utf8');
  return JSON.parse(raw);
}

function writeMetadata(uploadId, metadata) {
  if (metadata?.storage === 'inline') {
    inlineUploadSessions.set(uploadId, metadata);
    return;
  }

  const metaPath = getMetadataPath(uploadId);
  fs.writeFileSync(metaPath, JSON.stringify(metadata));
}

function cleanupSession(uploadId) {
  inlineUploadSessions.delete(uploadId);
  const sessionDir = getSessionDirectory(uploadId);
  if (fs.existsSync(sessionDir)) {
    fs.rmSync(sessionDir, { recursive: true, force: true });
  }
}

function ensureTemporaryStorage() {
  return ensureUploadsDirectory(tempUploadsDirectory);
}

function getDestinationDirectory(type) {
  return type === 'image' ? imageUploadsDirectory : videoUploadsDirectory;
}

async function handleInit(request) {
  const body = await request.json();
  const fileName = typeof body.fileName === 'string' ? body.fileName : '';
  const mimeType = typeof body.mimeType === 'string' ? body.mimeType : '';
  const type = typeof body.type === 'string' ? body.type : '';
  const size = Number(body.size) || 0;

  assertValidUploadType(type);

  if (!fileName) {
    throw new HttpError(400, 'Le nom du fichier téléversé est requis.');
  }

  if (!Number.isFinite(size) || size <= 0) {
    throw new HttpError(400, 'La taille du fichier téléversé est invalide.');
  }

  if (size > MAX_UPLOAD_SIZE_BYTES) {
    throw new HttpError(413, `Le fichier ne peut pas dépasser ${formatBytes(MAX_UPLOAD_SIZE_BYTES)}.`);
  }

  const uploadId = crypto.randomUUID();
  const metadata = {
    fileName,
    mimeType,
    size,
    type,
    receivedBytes: 0,
    chunkCount: 0,
    createdAt: new Date().toISOString(),
    storage: 'filesystem',
  };

  const createInlineSession = () => {
    const inlineMetadata = {
      ...metadata,
      storage: 'inline',
      inlineBuffer: Buffer.alloc(0),
    };
    writeMetadata(uploadId, inlineMetadata);
    return NextResponse.json({ uploadId, storage: 'inline' });
  };

  const tempStorageResult = ensureTemporaryStorage();
  if (tempStorageResult?.readOnly) {
    return createInlineSession();
  }

  const sessionDir = getSessionDirectory(uploadId);
  const sessionDirectoryResult = ensureUploadsDirectory(sessionDir);
  if (sessionDirectoryResult?.readOnly) {
    return createInlineSession();
  }

  writeMetadata(uploadId, metadata);

  return NextResponse.json({ uploadId, storage: 'filesystem' });
}

async function handleChunk(request) {
  const headers = request.headers;
  const uploadId = headers.get('x-upload-id');
  const actionType = headers.get('x-upload-type');
  const chunkIndex = Number(headers.get('x-chunk-index'));
  const chunkCount = Number(headers.get('x-chunk-count'));

  if (!uploadId) {
    throw new HttpError(400, 'Identifiant de téléversement manquant.');
  }

  assertValidUploadType(actionType);

  if (!Number.isInteger(chunkIndex) || chunkIndex < 0) {
    throw new HttpError(400, 'Index de fragment invalide.');
  }

  if (!Number.isInteger(chunkCount) || chunkCount <= 0) {
    throw new HttpError(400, 'Nombre total de fragments invalide.');
  }

  if (chunkIndex >= chunkCount) {
    throw new HttpError(400, 'Index de fragment hors limites.');
  }

  const metadata = readMetadata(uploadId);

  if (metadata.type !== actionType) {
    throw new HttpError(400, 'Le type de fichier téléversé ne correspond pas à la session initiale.');
  }

  const arrayBuffer = await request.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  if (!buffer.length) {
    throw new HttpError(400, 'Fragment vide reçu.');
  }

  const nextReceivedBytes = metadata.receivedBytes + buffer.length;
  if (nextReceivedBytes > MAX_UPLOAD_SIZE_BYTES) {
    cleanupSession(uploadId);
    throw new HttpError(413, `Le fichier ne peut pas dépasser ${formatBytes(MAX_UPLOAD_SIZE_BYTES)}.`);
  }

  if (metadata.storage === 'inline') {
    const previousBuffer = metadata.inlineBuffer instanceof Buffer ? metadata.inlineBuffer : Buffer.alloc(0);
    const combined = Buffer.concat([previousBuffer, buffer]);
    metadata.receivedBytes = nextReceivedBytes;
    metadata.chunkCount = chunkCount;
    metadata.lastChunkIndex = chunkIndex;
    metadata.inlineBuffer = combined;
    writeMetadata(uploadId, metadata);

    if (chunkIndex < chunkCount - 1) {
      return NextResponse.json({ success: true, receivedBytes: metadata.receivedBytes, storage: 'inline' });
    }

    const dataUri = `data:${metadata.mimeType || 'application/octet-stream'};base64,${combined.toString('base64')}`;
    cleanupSession(uploadId);
    return NextResponse.json({ success: true, storedPath: dataUri, storage: 'inline' });
  }

  const sessionDir = getSessionDirectory(uploadId);
  const tempFilePath = path.join(sessionDir, 'data.part');
  const writeFlag = chunkIndex === 0 ? 'w' : 'a';

  try {
    fs.writeFileSync(tempFilePath, buffer, { flag: writeFlag });
  } catch (error) {
    if (isReadOnlyFileSystemError(error)) {
      const existingBuffer = chunkIndex === 0 ? Buffer.alloc(0) : fs.readFileSync(tempFilePath);
      const combined = Buffer.concat([existingBuffer, buffer]);
      const dataUri = `data:${metadata.mimeType || 'application/octet-stream'};base64,${combined.toString('base64')}`;
      cleanupSession(uploadId);
      return NextResponse.json({ success: true, storedPath: dataUri, storage: 'inline' });
    }
    cleanupSession(uploadId);
    throw error;
  }

  metadata.receivedBytes = nextReceivedBytes;
  metadata.chunkCount = chunkCount;
  metadata.lastChunkIndex = chunkIndex;
  writeMetadata(uploadId, metadata);

  if (chunkIndex < chunkCount - 1) {
    return NextResponse.json({ success: true, receivedBytes: metadata.receivedBytes, storage: 'filesystem' });
  }

  const destinationDirectory = getDestinationDirectory(metadata.type);
  const destinationDirectoryResult = ensureUploadsDirectory(destinationDirectory);
  if (destinationDirectoryResult?.readOnly) {
    const data = fs.readFileSync(tempFilePath);
    cleanupSession(uploadId);
    return NextResponse.json({
      success: true,
      storedPath: `data:${metadata.mimeType || 'application/octet-stream'};base64,${data.toString('base64')}`,
      storage: 'inline',
    });
  }

  const finalFileName = buildFileName(
    metadata.fileName,
    metadata.mimeType,
    metadata.type === 'image' ? 'balado-couverture' : 'balado-media',
  );
  const finalPath = path.join(destinationDirectory, finalFileName);

  try {
    fs.renameSync(tempFilePath, finalPath);
  } catch (error) {
    if (isReadOnlyFileSystemError(error)) {
      const data = fs.readFileSync(tempFilePath);
      cleanupSession(uploadId);
      return NextResponse.json({
        success: true,
        storedPath: `data:${metadata.mimeType || 'application/octet-stream'};base64,${data.toString('base64')}`,
        storage: 'inline',
      });
    }

    if (error?.code === 'EXDEV') {
      try {
        fs.copyFileSync(tempFilePath, finalPath);
        fs.unlinkSync(tempFilePath);
      } catch (copyError) {
        cleanupSession(uploadId);
        throw copyError;
      }
      cleanupSession(uploadId);
      const publicPath = toPublicPath(finalPath);
      return NextResponse.json({ success: true, storedPath: publicPath, storage: 'filesystem' });
    }

    cleanupSession(uploadId);
    throw error;
  }

  cleanupSession(uploadId);
  const publicPath = toPublicPath(finalPath);
  return NextResponse.json({ success: true, storedPath: publicPath, storage: 'filesystem' });
}

export async function POST(request) {
  try {
    const action = (request.headers.get('x-upload-action') || '').toLowerCase();
    if (action === 'init') {
      return await handleInit(request);
    }
    if (action === 'chunk') {
      return await handleChunk(request);
    }

    return NextResponse.json({ error: 'Action de téléversement inconnue.' }, { status: 400 });
  } catch (error) {
    if (error instanceof HttpError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    console.error('Échec du traitement de la requête POST /api/podcasts/upload :', error);
    return NextResponse.json({ error: 'Échec du téléversement du fichier.' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const uploadId = request.headers.get('x-upload-id');
    const storedPath = request.headers.get('x-upload-path');

    if (storedPath) {
      deleteMediaFileIfExists(storedPath);
      return NextResponse.json({ success: true }, { status: 200 });
    }

    if (!uploadId) {
      return NextResponse.json({ error: 'Identifiant de session requis.' }, { status: 400 });
    }

    cleanupSession(uploadId);
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Échec du traitement de la requête DELETE /api/podcasts/upload :', error);
    return NextResponse.json({ error: 'Échec de l’annulation du téléversement.' }, { status: 500 });
  }
}

export const config = {
  api: {
    bodyParser: false,
    sizeLimit: '4096mb',
  },
};
