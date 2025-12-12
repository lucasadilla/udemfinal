import getMongoDb from '../../lib/mongoClient';
import { readJsonFile, writeJsonFile } from '../../lib/jsonStorage';

const FALLBACK_FILE = 'content.json';

function getFallbackContent() {
  return readJsonFile(FALLBACK_FILE, {});
}

function setFallbackContent(data) {
  return writeJsonFile(FALLBACK_FILE, data);
}

function setNestedValue(obj, path, value) {
  const keys = path.split('.');
  let current = obj;
  for (let i = 0; i < keys.length - 1; i++) {
    if (!current[keys[i]]) {
      current[keys[i]] = {};
    }
    current = current[keys[i]];
  }
  current[keys[keys.length - 1]] = value;
}

export default async function handler(req, res) {
  try {
    const db = await getMongoDb();
    
    if (db) {
      const collection = db.collection('content');

      if (req.method === 'GET') {
        const doc = await collection.findOne({ _id: 'content' }) || {};
        const { _id, ...data } = doc;
        return res.status(200).json(data);
      }

      if (req.method === 'PUT') {
        const { section, subsection, key, value } = req.body || {};
        if (!section || !subsection || !key) {
          return res.status(400).json({ error: 'Les champs section, subsection et key sont requis.' });
        }
        const path = `${section}.${subsection}.${key}`;
        await collection.updateOne(
          { _id: 'content' },
          { $set: { [path]: value } },
          { upsert: true }
        );
        const doc = await collection.findOne({ _id: 'content' }) || {};
        const { _id, ...data } = doc;
        return res.status(200).json(data);
      }

      res.setHeader('Allow', ['GET', 'PUT']);
      return res.status(405).end(`Méthode ${req.method} non autorisée`);
    } else {
      // Fallback to JSON storage
      if (req.method === 'GET') {
        const data = getFallbackContent();
        return res.status(200).json(data);
      }

      if (req.method === 'PUT') {
        const { section, subsection, key, value } = req.body || {};
        if (!section || !subsection || !key) {
          return res.status(400).json({ error: 'Les champs section, subsection et key sont requis.' });
        }
        const data = getFallbackContent();
        const path = `${section}.${subsection}.${key}`;
        setNestedValue(data, path, value);
        setFallbackContent(data);
        return res.status(200).json(data);
      }

      res.setHeader('Allow', ['GET', 'PUT']);
      return res.status(405).end(`Méthode ${req.method} non autorisée`);
    }
  } catch (err) {
    console.error('Échec du traitement de la requête de contenu :', err);
    return res.status(500).json({ error: 'Échec du traitement de la requête de contenu.' });
  }
}

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '50mb',
    },
    responseLimit: false,
  },
};
