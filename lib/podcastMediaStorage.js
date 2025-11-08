import { GridFSBucket, ObjectId } from 'mongodb';
import getMongoDb from './mongoClient';

let cachedBucket = null;

export async function getPodcastMediaBucket() {
  if (cachedBucket) {
    return cachedBucket;
  }

  const db = await getMongoDb();
  cachedBucket = new GridFSBucket(db, { bucketName: 'podcastMedia' });
  return cachedBucket;
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

  return fallbackErrorNames.has(error.name);
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

