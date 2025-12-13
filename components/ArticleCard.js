import Link from 'next/link';

// Normalize raw article data
function formatArticle(raw = {}) {
  const {
    _id,
    id,
    title = 'Sans titre',
    body,
    content,
    image,
    imageUrl,
    coverImage,
    date = '',
  } = raw;

  return {
    id: _id || id,
    title,
    body: body || content || '',
    image: image || imageUrl || coverImage || 'https://placehold.co/600x400',
    date,
  };
}

// Article preview card
export default function ArticleCard({ article = {}, isAdmin = false, onDelete }) {
  const a = formatArticle(article);
  // Use server-generated excerpt if available, otherwise generate client-side
  const excerpt = a.excerpt || (a.body ? a.body.replace(/<[^>]+>/g, '').slice(0, 160) + (a.body.length > 160 ? '...' : '') : '');

  const handleDelete = (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (typeof onDelete === 'function' && a.id) {
      onDelete(a.id);
    }
  };

  return (
    <div className="article-card-wrapper">
      {isAdmin && (
        <button
          type="button"
          onClick={handleDelete}
          className="article-card-admin-fab"
        >
          Supprimer
        </button>
      )}
      <Link
        href={`/articles/${a.id}`}
        className="article-card-link"
        aria-label={`Lire l'article « ${a.title} »`}
      >
        <article className="article-card">
          <div className="article-card-media">
            <img src={a.image} alt={a.title} className="article-card-image" />
          </div>
          <div className="article-card-content">
            {a.date && <p className="article-card-date">{a.date}</p>}
            <h3 className="article-card-title">{a.title}</h3>
            <p className="article-card-excerpt">{excerpt}</p>
          </div>
        </article>
      </Link>
    </div>
  );
}
