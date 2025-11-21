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
