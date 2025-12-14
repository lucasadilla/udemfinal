import { MongoClient } from 'mongodb';

const rawUri = process.env.MONGODB_URI ?? process.env.NEXT_PUBLIC_MONGODB_URI;
const uri = rawUri?.trim();


// Validate URI format and check for placeholder values
function validateMongoUri(uri) {
  if (!uri) return { valid: false, error: 'URI is empty' };
  
  // Check for placeholder values (only check for obvious placeholders that wouldn't appear in real credentials)
  if (uri.includes('xxxxx') || uri.includes('your-username') || uri.includes('your-password')) {
    return { valid: false, error: 'URI contains placeholder values. Please replace with your actual MongoDB credentials.' };
  }
  
  // Check for basic MongoDB URI format
  if (!uri.startsWith('mongodb://') && !uri.startsWith('mongodb+srv://')) {
    return { valid: false, error: 'URI must start with mongodb:// or mongodb+srv://' };
  }
  
  try {
    new URL(uri);
    return { valid: true };
  } catch (error) {
    return { valid: false, error: `Invalid URI format: ${error.message}` };
  }
}

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

// Validate URI if it exists
if (uri) {
  const validation = validateMongoUri(uri);
  if (!validation.valid) {
    console.error(`[MongoDB] Invalid connection URI: ${validation.error}`);
    if (process.env.NODE_ENV !== 'production') {
      console.error(`[MongoDB] Current URI (first 50 chars): ${uri.substring(0, 50)}...`);
      console.error('[MongoDB] Please check your .env.local file and ensure MONGODB_URI is correctly set.');
    }
  }
} else if (process.env.NODE_ENV !== 'production') {
  console.warn(
    'MONGODB_URI n’est pas configuré; utilisation du stockage JSON local pour persister les données. Assurez-vous que .env.local contient MONGODB_URI (ou NEXT_PUBLIC_MONGODB_URI) et éventuellement MONGODB_DB_NAME.'
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
    return null;
  }

  // Validate URI before attempting connection
  const validation = validateMongoUri(uri);
  if (!validation.valid) {
    console.error(`[MongoDB] Cannot connect: ${validation.error}`);
    return null;
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
      
      try {
        const client = new MongoClient(uri, options);
        globalThis._mongoClientPromise = client.connect().catch((error) => {
          // Log detailed error information
          console.error('[MongoDB] Connection failed:', {
            code: error.code,
            message: error.message,
            hostname: error.hostname || (uri.match(/@([^/]+)/)?.[1]),
            errorType: error.constructor.name
          });
          
          if (error.code === 'ENOTFOUND') {
            console.error('[MongoDB] DNS resolution failed. Check:');
            console.error('  1. Your MongoDB URI hostname is correct');
            console.error('  2. Your internet connection is working');
            console.error('  3. The MongoDB cluster is accessible');
            console.error(`  4. URI format: ${uri.substring(0, 30)}...`);
          }
          
          // Clear the promise so we can retry
          globalThis._mongoClientPromise = null;
          throw error;
        });
      } catch (error) {
        console.error('[MongoDB] Failed to create client:', error.message);
        return null;
      }
    }

    cachedClientPromise = globalThis._mongoClientPromise;
  }

  try {
    const client = await cachedClientPromise;
    // Si MONGODB_DB_NAME n'est pas défini, on passe undefined pour utiliser la base de données de l'URI.
    cachedDb = client.db(dbName || undefined);
    if (process.env.NODE_ENV !== 'production') {
      console.log('[MongoDB] Connected to database:', cachedDb.databaseName);
    }
    return cachedDb;
  } catch (error) {
    console.error('[MongoDB] Connection failed:', error.message);
    // Clear cache on error to allow retry
    cachedClientPromise = null;
    cachedDb = null;
    if (globalThis._mongoClientPromise) {
      globalThis._mongoClientPromise = null;
    }
    return null;
  }
}
