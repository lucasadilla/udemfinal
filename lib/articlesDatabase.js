import crypto from 'node:crypto';
import { ObjectId } from 'mongodb';
import getMongoDb from './mongoClient';
import { readJsonFile, writeJsonFile } from './jsonStorage';

const FALLBACK_FILE = 'articles.json';

function normalizeArticle(doc, includeFullContent = true) {
  if (!doc) {
    return null;
  }

  const { _id, id, content, body, ...rest } = doc;
  const fullContent = content || body || '';
  
  // Generate excerpt from content if we have it
  const plainText = fullContent ? fullContent.replace(/<[^>]+>/g, '') : '';
  const excerpt = plainText.length > 160 ? `${plainText.slice(0, 160)}...` : plainText;
  
  return {
    ...rest,
    id: _id ? _id.toString() : id || null,
    // Only include full content if requested (for individual article pages)
    ...(includeFullContent ? { content: fullContent, body: fullContent } : {}),
    // Always include excerpt for list views
    excerpt: excerpt,
  };
}

function sortArticles(list) {
  return [...list].sort((a, b) => {
    const dateA = a?.date || '';
    const dateB = b?.date || '';
    if (dateA === dateB) {
      return (b?.createdAt || '').localeCompare(a?.createdAt || '');
    }
    return dateB.localeCompare(dateA);
  });
}

function readFallbackArticles() {
  const items = readJsonFile(FALLBACK_FILE, []);
  return items.map((item) => normalizeArticle(item)).filter(Boolean);
}

function writeFallbackArticles(articles) {
  return writeJsonFile(FALLBACK_FILE, articles);
}

async function getCollection() {
  const db = await getMongoDb();
  if (!db) {
    throw new Error('MongoDB non disponible');
  }
  return db.collection('articles');
}

// Simple in-memory cache with TTL
let articlesCache = null;
let cacheTimestamp = 0;
const CACHE_TTL = 30000; // 30 seconds

function clearCache() {
  articlesCache = null;
  cacheTimestamp = 0;
}

async function ensureIndex(collection) {
    try {
        // Crée un index pour optimiser le tri par date et éviter l'erreur de mémoire
        await collection.createIndex({ date: -1 });
    } catch (e) {
        console.warn('Index creation failed (non-fatal):', e.message);
    }
}

export async function getArticles(includeFullContent = false) {
  try {
    // Return cached data if still valid (for list view without full content)
    const now = Date.now();
    if (!includeFullContent && articlesCache && (now - cacheTimestamp) < CACHE_TTL) {
      return articlesCache;
    }

    const collection = await getCollection();
    // Optimize query: use limit if we only need a few articles, and ensure index is used
    const docs = await collection
      .find({})
      .sort({ date: -1 })
      .toArray();
    
    const articles = docs.map((doc) => normalizeArticle(doc, includeFullContent)).filter(Boolean);
    
    // Cache the list view (without full content)
    if (!includeFullContent) {
      articlesCache = articles;
      cacheTimestamp = now;
    }
    
    if (articles.length === 0 && docs.length > 0) {
      console.warn('Des documents ont été trouvés mais aucun article valide après normalisation.');
    }
    
    // Lance la création d'index en arrière-plan
    ensureIndex(collection).catch(() => {});
    
    return articles;
  } catch (error) {
    // Code 292: QueryExceededMemoryLimitNoDiskUseAllowed
    if (error.code === 292) {
        console.warn('MongoDB sort exceeded memory limit, falling back to in-memory sort.');
        try {
            const collection = await getCollection();
            const docs = await collection.find({}).toArray();
            const normalized = docs.map((doc) => normalizeArticle(doc, includeFullContent)).filter(Boolean);
            return sortArticles(normalized);
        } catch (retryError) {
            console.error('Retry without sort failed:', retryError);
        }
    }
    console.error('Impossible de récupérer les articles depuis MongoDB :', error);
    console.error(`Détails de l'erreur MongoDB :`, {
      message: error.message,
      name: error.name,
      code: error.code,
    });
    
    // Only fall back to JSON if MongoDB connection actually failed
    // Don't fall back if it's just an empty collection
    const fallbackArticles = sortArticles(readFallbackArticles());
    if (fallbackArticles.length > 0) {
      console.warn(`Utilisation de ${fallbackArticles.length} article(s) depuis le fichier de secours.`);
    }
    
    return fallbackArticles;
  }
}

export async function getArticleById(id) {
  if (!id) {
    return null;
  }

  try {
    const collection = await getCollection();
    const objectId = new ObjectId(id);
    const doc = await collection.findOne({ _id: objectId });
    return normalizeArticle(doc);
  } catch (error) {
    if (error instanceof TypeError || error?.name === 'BSONTypeError') {
      // Fall back immediately for invalid ObjectId formats.
      return readFallbackArticles().find((article) => article.id === id) || null;
    }
    console.error('Impossible de récupérer l’article depuis MongoDB :', error);
    return readFallbackArticles().find((article) => article.id === id) || null;
  }
}

export async function addArticle(article) {
  const payload = {
    title: article.title,
    content: article.content,
    author: article.author,
    authorId: article.authorId || null,
    authorImage: article.authorImage || '',
    image: article.image || '',
    date: article.date,
    createdAt: article.createdAt || new Date().toISOString(),
  };

  try {
    const collection = await getCollection();
    const result = await collection.insertOne(payload);
    // Clear cache when new article is added
    clearCache();
    return {
      ...payload,
      id: result.insertedId.toString(),
    };
  } catch (error) {
    console.error('Impossible d’enregistrer l’article dans MongoDB :', error);
    const articles = readFallbackArticles();
    const fallbackArticle = {
      ...payload,
      id: crypto.randomUUID(),
    };
    articles.push(fallbackArticle);
    try {
      writeFallbackArticles(articles);
    } catch (writeError) {
      const persistenceError = new Error('FALLBACK_STORAGE_FAILED');
      persistenceError.code = 'FALLBACK_STORAGE_FAILED';
      persistenceError.cause = writeError;
      persistenceError.originalError = error;
      throw persistenceError;
    }
    return fallbackArticle;
  }
}

export async function deleteArticleById(id) {
  if (!id) {
    return false;
  }

  try {
    const collection = await getCollection();
    const objectId = new ObjectId(id);
    const result = await collection.deleteOne({ _id: objectId });
    if (result.deletedCount && result.deletedCount > 0) {
      // Clear cache when article is deleted
      clearCache();
      return true;
    }
  } catch (error) {
    if (!(error instanceof TypeError || error?.name === 'BSONTypeError')) {
      console.error('Impossible de supprimer l’article dans MongoDB :', error);
    }
  }

  const articles = readFallbackArticles();
  const index = articles.findIndex((article) => article.id === id);
  if (index === -1) {
    return false;
  }
  articles.splice(index, 1);
  writeFallbackArticles(articles);
  return true;
}
