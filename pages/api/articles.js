import { MongoClient, ObjectId } from 'mongodb';

let cachedClient = null;

/**
 * API route to manage blog articles.
 * Each article has { title, content, authorId, authorName, authorImage, image, images, date }.
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
    const collection = db.collection('articles');

    if (req.method === 'POST') {
      const { title, content, authorId, authorName, authorImage, image, images, date } = req.body;
      if (!title || !content || !authorId || !authorName || !date) {
        return res.status(400).json({ error: 'title, content, author and date are required' });
      }
      const article = {
        title,
        content,
        authorId,
        authorName,
        authorImage: authorImage || '',
        image: image || '',
        images: images || [],
        date,
      };
      const result = await collection.insertOne(article);
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

    if (req.method === 'GET' && req.query.id) {
      const { id } = req.query;
      const doc = await collection.findOne({ _id: new ObjectId(id) });
      if (!doc) {
        return res.status(404).json({ error: 'Article not found' });
      }
      const article = {
        id: doc._id.toString(),
        title: doc.title,
        content: doc.content,
        authorName: doc.authorName,
        authorImage: doc.authorImage,
        authorId: doc.authorId,
        image: doc.image,
        images: doc.images || [],
        date: doc.date,
      };
      return res.status(200).json(article);
    }

    // GET request - all articles
    const docs = await collection.find({}).sort({ date: -1 }).toArray();
    const articles = docs.map(doc => ({
      id: doc._id?.toString(),
      title: doc.title,
      content: doc.content,
      authorName: doc.authorName,
      authorImage: doc.authorImage,
      authorId: doc.authorId,
      image: doc.image,
      images: doc.images || [],
      date: doc.date,
    }));
    res.status(200).json(articles);
  } catch (err) {
    console.error('Failed to handle articles', err);
    res.status(500).json({ error: 'Failed to handle articles' });
  }
}

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '8mb',
    },
  },
};
