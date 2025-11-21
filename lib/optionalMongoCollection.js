import getMongoDb from './mongoClient';

const DEFAULT_TIMEOUT_MS = 1500;
const RETRY_COOLDOWN_MS = 60000;

let lastFailureTimestamp = 0;

function shouldSkipAttempt() {
  if (!process.env.MONGODB_URI) {
    return true;
  }

  if (!lastFailureTimestamp) {
    return false;
  }

  return Date.now() - lastFailureTimestamp < RETRY_COOLDOWN_MS;
}

function withTimeout(promise, timeoutMs) {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(
      () => reject(new Error(`Délai dépassé (${timeoutMs} ms) pour la connexion MongoDB.`)),
      timeoutMs,
    );

    promise.then(
      (value) => {
        clearTimeout(timeoutId);
        resolve(value);
      },
      (error) => {
        clearTimeout(timeoutId);
        reject(error);
      },
    );
  });
}

export async function getOptionalMongoCollection(collectionName, { timeoutMs = DEFAULT_TIMEOUT_MS, logPrefix = '' } = {}) {
  if (shouldSkipAttempt()) {
    return null;
  }

  try {
    const db = await withTimeout(getMongoDb(), timeoutMs);
    return db.collection(collectionName);
  } catch (connectionError) {
    lastFailureTimestamp = Date.now();
    const prefix = logPrefix ? `${logPrefix} ` : '';
    console.warn(
      `${prefix}Connexion à MongoDB indisponible ; basculement vers le stockage JSON.`,
      connectionError,
    );
    return null;
  }
}

export function resetMongoFailureState() {
  lastFailureTimestamp = 0;
}
