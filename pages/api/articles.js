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
    if (!db) {
      return { authorImage: '', authorId: authorId || null };
    }
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
  // Ajout d'en-têtes de cache pour les requêtes GET
  if (req.method === 'GET') {
    // Cache for 5 minutes, allow stale content for up to 1 hour while revalidating
    res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=3600');
  }

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

    const startTime = Date.now();
    
    // Get database info for debugging
    const db = await getMongoDb();
    if (!db) {
      console.error('[Articles API] Database connection failed - getMongoDb returned null');
      return res.status(503).json({ 
        error: 'Database connection failed',
        message: 'Unable to connect to MongoDB. Please check your environment variables and MongoDB Atlas configuration.',
        hint: 'Verify MONGODB_URI and MONGODB_DB_NAME are set correctly in your deployment environment.'
      });
    }
    
    const dbName = db.databaseName;
    const collection = db.collection('articles');
    const documentCount = await collection.countDocuments();
    
    const articles = await getArticles();
    const queryTime = Date.now() - startTime;
    
    // Log detailed information
    console.log(`[Articles API] Database: ${dbName}, Collection: articles, Documents: ${documentCount}, Articles returned: ${articles.length}`);
    
    if (articles.length === 0) {
      console.warn(`[Articles API] Aucun article trouvé. Base de données: ${dbName}, Documents dans collection: ${documentCount}`);
      if (documentCount > 0) {
        console.warn('[Articles API] Des documents existent mais ne sont pas retournés. Vérifiez la structure des documents.');
        // Log a sample document for debugging
        const sampleDoc = await collection.findOne({});
        if (sampleDoc) {
          console.log('[Articles API] Exemple de document:', JSON.stringify(sampleDoc, null, 2).substring(0, 500));
        }
      }
    } else {
      console.log(`[Articles API] Récupération de ${articles.length} article(s) depuis la base de données ${dbName} en ${queryTime}ms.`);
    }
    
    // Set cache headers for better performance
    res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
    res.setHeader('X-Query-Time', `${queryTime}ms`);
    res.setHeader('X-Database-Name', dbName);
    res.setHeader('X-Document-Count', documentCount.toString());
    
    // Log pour debug - vérifier si des articles sont retournés
    console.log(`[API Articles] Returning ${articles.length} articles`);
    
    return res.status(200).json(articles);
  } catch (err) {
    console.error('Échec du traitement des articles :', err);
    console.error(`Détails de l'erreur :`, {
      message: err.message,
      name: err.name,
      stack: err.stack,
    });
    
    if (err?.code === 'FALLBACK_STORAGE_FAILED') {
      return res.status(503).json({
        error:
          `Échec de l'enregistrement de l'article. Vérifiez la connexion à la base de données ou la configuration du stockage.`,
      });
    }
    
    // Include more error details in development
    const errorResponse = {
      error: 'Échec du traitement des articles.',
      message: err.message,
    };
    
    if (process.env.NODE_ENV === 'development') {
      errorResponse.details = {
        name: err.name,
        stack: err.stack,
      };
    }
    
    return res.status(500).json(errorResponse);
  }
}

export const config = {
  api: {
    bodyParser: {
      // Autorise des images encodées en base64 plus volumineuses lors de la création d’un article.
      sizeLimit: '50mb',
    },
    responseLimit: false,
  },
};
