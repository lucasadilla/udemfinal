import getMongoDb from './mongoClient';
import { readJsonFile, writeJsonFile } from './jsonStorage';

const FALLBACK_FILE = 'content.json';

function readFallbackContent() {
  return readJsonFile(FALLBACK_FILE, {});
}

function writeFallbackContent(data) {
  return writeJsonFile(FALLBACK_FILE, data);
}

function setNestedValue(target, keys, value) {
  let current = target;
  for (let i = 0; i < keys.length - 1; i += 1) {
    const key = keys[i];
    if (!current[key] || typeof current[key] !== 'object') {
      current[key] = {};
    }
    current = current[key];
  }
  current[keys[keys.length - 1]] = value;
  return target;
}

export async function fetchContentFromDb() {
  try {
    const db = await getMongoDb();
    const collection = db.collection('content');
    const doc = (await collection.findOne({ _id: 'content' })) || {};
    const { _id, ...data } = doc;
    return data;
  } catch (error) {
    console.error('Impossible de récupérer le contenu depuis MongoDB :', error);
    return readFallbackContent();
  }
}

export async function updateContentField(section, subsection, key, value) {
  const path = `${section}.${subsection}.${key}`;

  try {
    const db = await getMongoDb();
    const collection = db.collection('content');

    await collection.updateOne(
      { _id: 'content' },
      { $set: { [path]: value } },
      { upsert: true }
    );

    return fetchContentFromDb();
  } catch (error) {
    console.error("Impossible de mettre à jour le contenu dans MongoDB :", error);
    const fallback = setNestedValue(readFallbackContent(), [section, subsection, key], value);
    writeFallbackContent(fallback);
    return fallback;
  }
}
