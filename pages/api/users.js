import { ObjectId } from 'mongodb';
import getMongoDb from '../../lib/mongoClient';

/**
 * Retrieve or create users from the `users` collection.
 * Each document contains `{ title: string, name: string, profilePicture: string }`.
 *
 * Expects `MONGODB_URI` and `MONGODB_DB_NAME` environment variables for
 * the connection string and database name.
 */
function parseRequestBody(req) {
  const { body } = req;

  if (body == null) {
    return {};
  }

  if (typeof body === 'string') {
    const trimmed = body.trim();
    if (!trimmed) {
      return {};
    }
    return JSON.parse(trimmed);
  }

  if (Buffer.isBuffer(body)) {
    const text = body.toString('utf8').trim();
    if (!text) {
      return {};
    }
    return JSON.parse(text);
  }

  if (body instanceof ArrayBuffer) {
    const text = Buffer.from(body).toString('utf8').trim();
    if (!text) {
      return {};
    }
    return JSON.parse(text);
  }

  if (ArrayBuffer.isView(body)) {
    const view = body;
    const text = Buffer.from(view.buffer, view.byteOffset, view.byteLength)
      .toString('utf8')
      .trim();
    if (!text) {
      return {};
    }
    return JSON.parse(text);
  }

  return body;
}

export default async function handler(req, res) {
  try {
    const db = await getMongoDb();
    const collection = db.collection('users');

    if (req.method === 'POST') {
      let body;
      try {
        body = parseRequestBody(req);
      } catch (parseErr) {
        console.warn('Corps de requête JSON invalide reçu pour /api/users :', parseErr);
        return res.status(400).json({ error: 'Corps de requête invalide.' });
      }

      const title = typeof body?.title === 'string' ? body.title.trim() : '';
      const name = typeof body?.name === 'string' ? body.name.trim() : '';
      const profilePicture = typeof body?.profilePicture === 'string' ? body.profilePicture : '';

      if (!title || !name) {
        return res.status(400).json({ error: 'Les champs title et name sont requis.' });
      }
      const result = await collection.insertOne({
        title,
        name,
        profilePicture,
      });
      return res.status(201).json({ id: result.insertedId.toString() });
    }

    if (req.method === 'DELETE') {
      const { id } = req.query;
      if (!id) {
        return res.status(400).json({ error: "L’identifiant est requis." });
      }
      await collection.deleteOne({ _id: new ObjectId(id) });
      return res.status(200).json({ ok: true });
    }

    const docs = await collection.find({}).toArray();
    const users = docs.map(doc => ({
      id: doc._id?.toString(),
      title: doc.title,
      name: doc.name,
      profilePicture: doc.profilePicture,
    }));

    res.status(200).json(users);
  } catch (err) {
    console.error('Échec du traitement des membres :', err);
    res.status(500).json({ error: 'Échec du traitement des membres.' });
  }
}

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1024mb',
    },
  },
};

