import getMongoDb from '../../lib/mongoClient';

/**
 * Health check endpoint to diagnose database connection issues.
 * This helps verify that environment variables are set correctly
 * and the database is accessible.
 */
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const diagnostics = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'unknown',
    mongodbUri: {
      configured: !!process.env.MONGODB_URI,
      length: process.env.MONGODB_URI?.length || 0,
      startsWith: process.env.MONGODB_URI?.substring(0, 20) || 'not set',
    },
    mongodbDbName: {
      configured: !!process.env.MONGODB_DB_NAME,
      value: process.env.MONGODB_DB_NAME || 'not set',
    },
    database: {
      connected: false,
      error: null,
      collections: [],
    },
  };

  try {
    const db = await getMongoDb();
    const collections = await db.listCollections().toArray();
    diagnostics.database.connected = true;
    diagnostics.database.collections = collections.map((c) => c.name);
    
    // Try to query a collection to ensure it's actually working
    const articlesCollection = db.collection('articles');
    const articleCount = await articlesCollection.countDocuments();
    diagnostics.database.articleCount = articleCount;

    const contentCollection = db.collection('content');
    const contentExists = await contentCollection.findOne({ _id: 'content' });
    diagnostics.database.contentExists = !!contentExists;

    return res.status(200).json({
      status: 'healthy',
      ...diagnostics,
    });
  } catch (error) {
    diagnostics.database.error = {
      message: error.message,
      name: error.name,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    };

    return res.status(503).json({
      status: 'unhealthy',
      ...diagnostics,
    });
  }
}

