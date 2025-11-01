import { ObjectId } from 'mongodb';
import getMongoDb from '../../lib/mongoClient';

/**
 * API route to manage blog articles.
 * Each article has { title, content, author, authorImage, image, date }.
 */
export default async function handler(req, res) {
  try {
    const db = await getMongoDb();
    const collection = db.collection('articles');

    if (req.method === 'POST') {
      const { title, content, author, authorImage, image, date } = req.body;
      if (!title || !content || !author || !date) {
        return res.status(400).json({ error: 'Les champs title, content, author et date sont requis.' });
      }
      const article = {
        title,
        content,
        author,
        authorImage: authorImage || '',
        image: image || '',
        date,
      };
      const result = await collection.insertOne(article);
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

    if (req.method === 'GET' && req.query.id) {
      const { id } = req.query;
      const doc = await collection.findOne({ _id: new ObjectId(id) });
      if (!doc) {
        return res.status(404).json({ error: 'Article introuvable.' });
      }
      const article = {
        id: doc._id.toString(),
        title: doc.title,
        content: doc.content,
        author: doc.author,
        authorImage: doc.authorImage,
        image: doc.image,
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
      author: doc.author,
      authorImage: doc.authorImage,
      image: doc.image,
      date: doc.date,
    }));
    res.status(200).json(articles);
  } catch (err) {
    console.error('Échec du traitement des articles :', err);
    res.status(500).json({ error: 'Échec du traitement des articles.' });
  }
}

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '8mb',
    },
  },
};
