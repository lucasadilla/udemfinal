import { GridFSBucket } from 'mongodb';
import getMongoDb from './mongoClient';
import { isGridFsUnavailable, toObjectId } from './podcastMediaStorage.js';

let cachedBucket = null;

export async function getUserImageBucket() {
  if (cachedBucket) {
    return cachedBucket;
  }

  const db = await getMongoDb();
  if (!db) {
    throw new Error('MongoDB non disponible pour le stockage d\'images utilisateur');
  }
  cachedBucket = new GridFSBucket(db, { bucketName: 'userImages' });
  return cachedBucket;
}

export { isGridFsUnavailable, toObjectId };

export async function deleteUserImageFile(fileId) {
  const objectId = toObjectId(fileId);
  if (!objectId) {
    return;
  }

  const bucket = await getUserImageBucket();
  await bucket.delete(objectId);
}
