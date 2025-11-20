import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI;
const dbName =
  process.env.MONGODB_DB_NAME?.trim() ||
  process.env.MONGODB_DATABASE?.trim() ||
  process.env.MONGODB_DB?.trim() ||
  process.env.MONGODB_DBNAME?.trim() ||
  (() => {
    if (!uri) return '';
    try {
      const url = new URL(uri);
      return url.pathname?.replace(/^\//, '') || '';
    } catch (err) {
      console.warn('Impossible de déterminer le nom de la base de données à partir de MONGODB_URI :', err);
      return '';
    }
  })();

function getDbNameFromUri(connectionString) {
  try {
    const parsed = new URL(connectionString);
    const rawPath = parsed.pathname?.replace(/^\//, '')?.trim();
    return rawPath || null;
  } catch (error) {
    console.warn('Impossible d’extraire le nom de base de données depuis MONGODB_URI :', error);
    return null;
  }
}

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
  const derivedDbName = dbName || getDbNameFromUri(uri) || 'udemfinal';
  if (!dbName && process.env.NODE_ENV !== 'production') {
    console.warn(
      `MONGODB_DB_NAME n’est pas configuré; utilisation de "${derivedDbName}" tiré du lien ou de la valeur par défaut.`,
    );
  }

  cachedDb = client.db(derivedDbName);
  return cachedDb;
}
