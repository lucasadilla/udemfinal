import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB_NAME;

if (!uri) {
  throw new Error('MONGODB_URI not configured');
}

if (!dbName) {
  throw new Error('MONGODB_DB_NAME not configured');
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
  cachedDb = client.db(dbName);
  return cachedDb;
}
