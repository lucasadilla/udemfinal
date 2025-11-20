import { fetchContentFromDb, updateContentField } from '../../lib/contentService';

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      const data = await fetchContentFromDb();
      return res.status(200).json(data);
    }

    if (req.method === 'PUT') {
      const { section, subsection, key, value } = req.body || {};
      if (!section || !subsection || !key) {
        return res.status(400).json({ error: 'Les champs section, subsection et key sont requis.' });
      }
      const data = await updateContentField(section, subsection, key, value);
      return res.status(200).json(data);
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
