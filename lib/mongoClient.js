import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI?.trim();
const connectionTimeoutMs = Number(process.env.MONGODB_TIMEOUT_MS) || 5000;
const dbName =
  process.env.MONGODB_DB_NAME?.trim() ||
  process.env.MONGODB_DATABASE?.trim() ||
  process.env.MONGODB_DB?.trim() ||
  process.env.MONGODB_DBNAME?.trim() ||
  (() => {
    if (!uri) return '';
    try {
      const url = new URL(uri.trim());
      return url.pathname?.replace(/^\//, '') || '';
    } catch (err) {
      console.warn('Impossible de déterminer le nom de la base de données à partir de MONGODB_URI :', err);
      return '';
    }
  })();

if (!uri && process.env.NODE_ENV !== 'production') {
  console.warn(
    'MONGODB_URI n’est pas configuré; utilisation du stockage JSON local pour persister les données.'
  );
}

let cachedClientPromise = null;
let cachedDb = null;

function buildMongoClient() {
  return new MongoClient(uri, {
    serverSelectionTimeoutMS: connectionTimeoutMs,
    connectTimeoutMS: connectionTimeoutMs,
    socketTimeoutMS: connectionTimeoutMs,
  });
}

export default async function getMongoDb() {
  if (!uri) {
    throw new Error('MONGODB_URI n’est pas configuré.');
  }

  if (cachedDb) {
    return cachedDb;
  }

  if (!cachedClientPromise) {
    if (!globalThis._mongoClientPromise) {
      const client = buildMongoClient();
      globalThis._mongoClientPromise = client.connect();
    }

    cachedClientPromise = globalThis._mongoClientPromise;
  }

  let client;
  try {
    client = await cachedClientPromise;
  } catch (connectionError) {
    // Reset cached promise so future requests can retry quickly instead of
    // waiting on a previously failed or timed-out attempt.
    cachedClientPromise = null;
    globalThis._mongoClientPromise = null;
    throw connectionError;
  }

  cachedDb = client.db(dbName || undefined);
  if (!dbName && process.env.NODE_ENV !== 'production') {
    console.warn(
      'MONGODB_DB_NAME n’est pas configuré; utilisation de la base de données du lien de connexion.',
    );
  }
  return cachedDb;
}
