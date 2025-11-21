import { getOptionalMongoCollection } from '../../lib/optionalMongoCollection';
import { readJsonFile, writeJsonFile } from '../../lib/jsonStorage';

const FALLBACK_FILE = 'content.json';
const DEFAULT_CONTENT = {
  home: {
    hero: {
      hero_title: 'FEMMES & DROIT',
      hero_subtitle:
        "Promotion du féminisme intersectionnel auprès de la communauté étudiante de l'Université de Montréal",
      hero_banner: '',
    },
    articles: {
      recent_articles_title: 'Articles Récents',
    },
    meta: {
      page_title: 'Accueil',
      page_description:
        "Femme & Droit - Promotion du féminisme intersectionnel auprès de la communauté étudiante de l'Université de Montréal.",
      page_keywords:
        "féminisme, intersectionnalité, Université de Montréal, communauté, féminisme étudiant",
    },
  },
};

function readFallbackContent() {
  return readJsonFile(FALLBACK_FILE, DEFAULT_CONTENT);
}

function writeFallbackContent(content) {
  writeJsonFile(FALLBACK_FILE, content);
}

function updateNestedContent(content, section, subsection, key, value) {
  return {
    ...content,
    [section]: {
      ...(content?.[section] || {}),
      [subsection]: {
        ...(content?.[section]?.[subsection] || {}),
        [key]: value,
      },
    },
  };
}

export default async function handler(req, res) {
  const collection = await getOptionalMongoCollection('content', { logPrefix: '/api/content' });

  try {
    if (req.method === 'GET') {
      if (!collection) {
        return res.status(200).json(readFallbackContent());
      }

      const doc = await collection.findOne({ _id: 'content' }) || {};
      const { _id, ...data } = doc;
      return res.status(200).json(Object.keys(data).length ? data : DEFAULT_CONTENT);
    }

    if (req.method === 'PUT') {
      const { section, subsection, key, value } = req.body || {};
      if (!section || !subsection || !key) {
        return res.status(400).json({ error: 'Les champs section, subsection et key sont requis.' });
      }

      if (!collection) {
        const content = updateNestedContent(readFallbackContent(), section, subsection, key, value);
        writeFallbackContent(content);
        return res.status(200).json(content);
      }

      const path = `${section}.${subsection}.${key}`;
      await collection.updateOne(
        { _id: 'content' },
        { $set: { [path]: value } },
        { upsert: true }
      );
      const doc = await collection.findOne({ _id: 'content' }) || {};
      const { _id, ...data } = doc;
      return res.status(200).json(Object.keys(data).length ? data : DEFAULT_CONTENT);
    }

    res.setHeader('Allow', ['GET', 'PUT']);
    return res.status(405).end(`Méthode ${req.method} non autorisée`);
  } catch (err) {
    console.error('Échec du traitement de la requête de contenu :', err);
    return res.status(500).json({ error: 'Échec du traitement de la requête de contenu.' });
  }
}

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '8mb',
    },
  },
};
