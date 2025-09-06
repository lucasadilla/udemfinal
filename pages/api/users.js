import { MongoClient, ObjectId } from 'mongodb';

let cachedClient = null;

/**
 * Retrieve or create users from the `users` collection.
 * Each document contains `{ title: string, name: string, profilePicture: string }`.
 *
 * Expects `MONGODB_URI` environment variable for connection string.
 */
export default async function handler(req, res) {
  try {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      return res.status(500).json({ error: 'MONGODB_URI not configured' });
    }

    if (!cachedClient) {
      const client = new MongoClient(uri);
      cachedClient = await client.connect();
    }

    const db = cachedClient.db();
    const collection = db.collection('users');

    if (req.method === 'POST') {
      const { title, name, profilePicture } = req.body;
      if (!title || !name || !profilePicture) {
        return res.status(400).json({ error: 'title, name and profilePicture are required' });
      }
      const result = await collection.insertOne({ title, name, profilePicture });
      return res.status(201).json({ id: result.insertedId.toString() });
    }

    if (req.method === 'DELETE') {
      const { id } = req.query;
      if (!id) {
        return res.status(400).json({ error: 'id is required' });
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
    console.error('Failed to handle users', err);
    res.status(500).json({ error: 'Failed to handle users' });
  }
}

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '4mb',
    },
  },
};

