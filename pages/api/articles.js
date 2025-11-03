import {
  addArticle,
  deleteArticleById,
  getArticleById,
  getArticles,
} from '../../lib/articlesDatabase';

/**
 * API route to manage blog articles.
 * Each article has { title, content, author, authorImage, image, date }.
 */
export default async function handler(req, res) {
  try {
    if (req.method === 'POST') {
      const { title, content, author, authorImage, image, date } = req.body || {};
      if (!title || !content || !author || !date) {
        return res.status(400).json({ error: 'Les champs title, content, author et date sont requis.' });
      }

      const savedArticle = await addArticle({
        title,
        content,
        author,
        authorImage,
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
      sizeLimit: '100mb',
    },
  },
};
