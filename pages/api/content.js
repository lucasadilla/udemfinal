import getMongoDb from '../../lib/mongoClient';

export default async function handler(req, res) {
  try {
    const db = await getMongoDb();
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
