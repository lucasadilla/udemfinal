import { MongoClient } from 'mongodb';

const rawUri = process.env.MONGODB_URI ?? process.env.NEXT_PUBLIC_MONGODB_URI;
const uri = rawUri?.trim();

function inferDbNameFromUri(connectionString) {
  if (!connectionString) return null;

  try {
    const url = new URL(connectionString);
    const pathnameDb = url.pathname?.replace(/^\/+/, '') || '';
    if (pathnameDb) return pathnameDb;

    // If no path is provided, fall back to the appName query param (commonly set to the DB name in Atlas UIs).
    const appName = url.searchParams.get('appName');
    if (appName) return appName;
  } catch (error) {
    console.warn('Impossible de déduire le nom de la base depuis MONGODB_URI :', error?.message || error);
  }

  return null;
}

const envDbName = process.env.MONGODB_DB_NAME ?? process.env.NEXT_PUBLIC_MONGODB_DB_NAME;
const inferredDbName = inferDbNameFromUri(uri);
const dbName = envDbName?.trim() || inferredDbName || 'udem';

if (!uri && process.env.NODE_ENV !== 'production') {
  console.warn(
    'MONGODB_URI n’est pas configuré; utilisation du stockage JSON local pour persister les données. Assurez-vous que .env.local contient MONGODB_URI (ou NEXT_PUBLIC_MONGODB_URI) et éventuellement MONGODB_DB_NAME.'
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
      // Options optimisées pour Vercel/Serverless
      const options = {
        maxPoolSize: 1, // Réduire le pool pour éviter de saturer les connexions en serverless
        minPoolSize: 0,
        connectTimeoutMS: 10000, // Timeout de connexion plus court (10s)
        serverSelectionTimeoutMS: 10000, // Timeout de sélection de serveur (10s)
        socketTimeoutMS: 45000, // Timeout socket
      };
      const client = new MongoClient(uri, options);
      globalThis._mongoClientPromise = client.connect();
    }

    cachedClientPromise = globalThis._mongoClientPromise;
  }

  const client = await cachedClientPromise;
  // Si MONGODB_DB_NAME n'est pas défini, on passe undefined pour utiliser la base de données de l'URI.
  cachedDb = client.db(dbName || undefined);
  return cachedDb;
}
