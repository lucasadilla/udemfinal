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
    console.error(`Détails de l'erreur :`, {
      message: err.message,
      name: err.name,
      code: err.code,
    });
    
    const errorResponse = {
      error: 'Échec du traitement de la requête de contenu.',
      message: err.message,
      // Always include error name and code for better debugging
      errorName: err.name,
      errorCode: err.code,
    };
    
    // Include stack trace in development, but also include helpful info in production
    if (process.env.NODE_ENV === 'development') {
      errorResponse.details = {
        name: err.name,
        stack: err.stack,
      };
    } else {
      // In production, provide helpful hints without exposing stack
      if (err.message?.includes('MONGODB_URI')) {
        errorResponse.hint = 'MongoDB connection string not configured. Check environment variables.';
      } else if (err.message?.includes('connection') || err.message?.includes('timeout')) {
        errorResponse.hint = 'Database connection failed. Check MongoDB Atlas IP whitelist and connection string.';
      }
    }
    
    return res.status(500).json(errorResponse);
  }
}

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '8mb',
    },
  },
};
