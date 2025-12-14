import { GridFSBucket, ObjectId } from 'mongodb';
import getMongoDb from './mongoClient';

let cachedBucket = null;

export async function getPodcastMediaBucket() {
  if (cachedBucket) {
    return cachedBucket;
  }

  const db = await getMongoDb();
  if (!db) {
    throw new Error('MongoDB non disponible pour le stockage de médias podcast');
  }
  cachedBucket = new GridFSBucket(db, { bucketName: 'podcastMedia' });
  return cachedBucket;
}

function hasFallbackNetworkCode(error) {
  if (!error || typeof error !== 'object') {
    return false;
  }

  const fallbackErrorCodes = new Set([
    'ENOTFOUND',
    'ECONNREFUSED',
    'ETIMEDOUT',
    'ECONNRESET',
    'EHOSTUNREACH',
  ]);

  if (fallbackErrorCodes.has(error.code)) {
    return true;
  }

  if (error.cause && error.cause !== error) {
    return hasFallbackNetworkCode(error.cause);
  }

  return false;
}

export function isGridFsUnavailable(error) {
  if (!error) {
    return false;
  }

  if (error.message?.includes('MONGODB_URI n’est pas configuré')) {
    return true;
  }

  const fallbackErrorNames = new Set([
    'MongoServerSelectionError',
    'MongoNetworkError',
    'MongoNotConnectedError',
  ]);

  if (fallbackErrorNames.has(error.name)) {
    return true;
  }

  if (hasFallbackNetworkCode(error)) {
    return true;
  }

  if (typeof error.message === 'string' && /\bquerySrv\s+ENOTFOUND\b/.test(error.message)) {
    return true;
  }

  return false;
}

export function toObjectId(id) {
  if (!id) {
    return null;
  }

  if (id instanceof ObjectId) {
    return id;
  }

  try {
    return new ObjectId(id);
  } catch (error) {
    return null;
  }
}

export async function deletePodcastMediaFile(fileId) {
  const objectId = toObjectId(fileId);
  if (!objectId) {
    return;
  }

  const bucket = await getPodcastMediaBucket();
  await bucket.delete(objectId);
}

