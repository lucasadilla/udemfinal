import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB_NAME?.trim();

if (!uri && process.env.NODE_ENV !== 'production') {
  console.warn(
    'MONGODB_URI n’est pas configuré; utilisation du stockage JSON local pour persister les données.'
  );
}

let cachedClientPromise = null;
let cachedDb = null;

export default async function getMongoDb() {
  if (!uri) {
    throw new Error('MONGODB_URI n’est pas configuré.');
  }

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
  // Si MONGODB_DB_NAME n'est pas défini, on passe undefined pour utiliser la base de données de l'URI.
  cachedDb = client.db(dbName || undefined);
  return cachedDb;
}
