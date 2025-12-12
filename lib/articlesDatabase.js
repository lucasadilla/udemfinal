import crypto from 'node:crypto';
import { ObjectId } from 'mongodb';
import getMongoDb from './mongoClient';
import { readJsonFile, writeJsonFile } from './jsonStorage';

const FALLBACK_FILE = 'articles.json';

function normalizeArticle(doc) {
  if (!doc) {
    return null;
  }

  const { _id, id, ...rest } = doc;
  return {
    ...rest,
    id: _id ? _id.toString() : id || null,
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

async function ensureIndex(collection) {
    try {
        // Crée un index pour optimiser le tri par date et éviter l'erreur de mémoire
        await collection.createIndex({ date: -1 });
    } catch (e) {
        console.warn('Index creation failed (non-fatal):', e.message);
    }
}

export async function getArticles() {
  try {
    const collection = await getCollection();
    // Lance la création d'index en arrière-plan
    ensureIndex(collection).catch(() => {});

    const docs = await collection.find({}).sort({ date: -1 }).toArray();
    const normalized = docs.map((doc) => normalizeArticle(doc)).filter(Boolean);
    
    // Si on a des articles, on les retourne même s'il y a eu un problème de tri
    if (normalized.length > 0) {
      return normalized;
    }
    
    // Si aucun article trouvé, essayer sans tri au cas où le tri échoue silencieusement
    const docsNoSort = await collection.find({}).toArray();
    const normalizedNoSort = docsNoSort.map((doc) => normalizeArticle(doc)).filter(Boolean);
    if (normalizedNoSort.length > 0) {
      return sortArticles(normalizedNoSort);
    }
    
    return [];
  } catch (error) {
    // Code 292: QueryExceededMemoryLimitNoDiskUseAllowed
    if (error.code === 292) {
        console.warn('MongoDB sort exceeded memory limit, falling back to in-memory sort.');
        try {
            const collection = await getCollection();
            const docs = await collection.find({}).toArray();
            const normalized = docs.map((doc) => normalizeArticle(doc)).filter(Boolean);
            return sortArticles(normalized);
        } catch (retryError) {
            console.error('Retry without sort failed:', retryError);
        }
    }
    console.error('Impossible de récupérer les articles depuis MongoDB :', error);
    const fallback = sortArticles(readFallbackArticles());
    return fallback.length > 0 ? fallback : [];
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
