import {
  addArticle,
  deleteArticleById,
  getArticleById,
  getArticles,
} from '../../lib/articlesDatabase';
import getMongoDb from '../../lib/mongoClient';
import { ObjectId } from 'mongodb';

async function resolveAuthorMetadata({ authorId, author, authorImage }) {
  if (authorImage) {
    return { authorImage, authorId: authorId || null };
  }

  try {
    const db = await getMongoDb();
    const collection = db.collection('users');

    let authorObjectId = null;
    if (authorId) {
      try {
        authorObjectId = new ObjectId(authorId);
      } catch (conversionError) {
        console.warn("Identifiant d’auteur invalide fourni :", conversionError);
      }
    }

    const query = authorObjectId
      ? { _id: authorObjectId }
      : author
        ? { name: author }
        : null;

    if (!query) {
      return { authorImage: '', authorId: authorId || null };
    }

    const userDoc = await collection.findOne(query);
    if (!userDoc) {
      return { authorImage: '', authorId: authorId || null };
    }

    return {
      authorImage: userDoc.profilePicture || '',
      authorId: userDoc._id ? userDoc._id.toString() : authorId || null,
    };
  } catch (error) {
    console.error("Impossible de récupérer l’image du profil auteur :", error);
    return { authorImage: '', authorId: authorId || null };
  }
}

/**
 * API route to manage blog articles.
 * Each article has { title, content, author, authorId, authorImage, image, date }.
 */
export default async function handler(req, res) {
  try {
    if (req.method === 'POST') {
      const { title, content, author, authorId, authorImage, image, date } = req.body || {};
      if (!title || !content || !author || !date) {
        return res.status(400).json({ error: 'Les champs title, content, author et date sont requis.' });
      }

      const resolvedAuthor = await resolveAuthorMetadata({ authorId, author, authorImage });

      const savedArticle = await addArticle({
        title,
        content,
        author,
        authorId: resolvedAuthor.authorId || authorId || null,
        authorImage: resolvedAuthor.authorImage,
        image,
        date,
        createdAt: new Date().toISOString(),
      });

      return res.status(201).json({ id: savedArticle.id });
    }

    if (req.method === 'DELETE') {
      const { id } = req.query || {};
      if (!id) {
        return res.status(400).json({ error: "L’identifiant est requis." });
      }

      const deleted = await deleteArticleById(id);
      if (!deleted) {
        return res.status(404).json({ error: 'Article introuvable.' });
      }
      return res.status(200).json({ ok: true });
    }

    if (req.method === 'GET' && req.query?.id) {
      const article = await getArticleById(req.query.id);
      if (!article) {
        return res.status(404).json({ error: 'Article introuvable.' });
      }
      return res.status(200).json(article);
    }

    const articles = await getArticles();
    // Cache for 60 seconds, allow stale-while-revalidate
    res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=120');
    return res.status(200).json(articles);
  } catch (err) {
    console.error('Échec du traitement des articles :', err);
    if (err?.code === 'FALLBACK_STORAGE_FAILED') {
      return res.status(503).json({
        error:
          'Échec de l’enregistrement de l’article. Vérifiez la connexion à la base de données ou la configuration du stockage.',
      });
    }
    return res.status(500).json({ error: 'Échec du traitement des articles.' });
  }
}

export const config = {
  api: {
    bodyParser: {
      // Autorise des images encodées en base64 plus volumineuses lors de la création d’un article.
      sizeLimit: '24mb',
    },
  },
};
