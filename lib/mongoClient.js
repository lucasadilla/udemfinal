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
    const errorMessage = process.env.NODE_ENV === 'production'
      ? `MONGODB_URI n'est pas configuré. Veuillez définir cette variable d'environnement dans votre plateforme de déploiement (Vercel, Netlify, etc.). Consultez docs/deployment-guide.md pour plus d'informations.`
      : `MONGODB_URI n'est pas configuré.`;
    throw new Error(errorMessage);
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
  cachedDb = client.db(dbName || undefined);
  if (!dbName && process.env.NODE_ENV !== 'production') {
    console.warn(
      'MONGODB_DB_NAME n’est pas configuré; utilisation de la base de données du lien de connexion.',
    );
  }
  return cachedDb;
}
