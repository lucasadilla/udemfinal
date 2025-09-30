import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB_NAME?.trim();

if (!uri) {
  throw new Error('MONGODB_URI not configured');
}

let cachedClientPromise = null;
let cachedDb = null;

export default async function getMongoDb() {
  if (cachedDb) {
    return cachedDb;
  }

  if (!cachedClientPromise) {
    if (!globalThis._mongoClientPromise) {
      const client = new MongoClient(uri);
      globalThis._mongoClientPromise = client.connect();
    }

    cachedClientPromise = globalThis._mongoClientPromise;
  }

  const client = await cachedClientPromise;
  cachedDb = client.db(dbName || undefined);
  if (!dbName && process.env.NODE_ENV !== 'production') {
    console.warn(
      'MONGODB_DB_NAME not configured; falling back to the database in the connection string',
    );
  }
  return cachedDb;
}
