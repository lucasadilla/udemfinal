import Link from 'next/link';

// Normalize raw article data
function formatArticle(raw = {}) {
  const {
    _id,
    id,
    title = 'Untitled',
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
  const plainBody = a.body ? a.body.replace(/<[^>]+>/g, '') : '';
  const excerpt = plainBody.length > 200 ? `${plainBody.slice(0, 200)}...` : plainBody;

  const handleDelete = (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (typeof onDelete === 'function' && a.id) {
      onDelete(a.id);
    }
  };

  return (
    <div className="relative">
      {isAdmin && (
        <button
          type="button"
          onClick={handleDelete}
          className="absolute top-3 right-3 z-10 rounded bg-red-600 px-3 py-1 text-sm font-semibold text-white shadow hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
        >
          Supprimer
        </button>
      )}
      <Link href={`/articles/${a.id}`} className="block">
        <article className="article-card max-w-md h-full flex flex-col overflow-hidden rounded-2xl shadow-md">
          <div className="article-card-media">
            <img src={a.image} alt={a.title} className="article-card-image" />
          </div>
          <div className="article-card-content flex flex-col flex-grow">
            <h3 className="mb-1 text-4xl font-bold leading-snug text-black">{a.title}</h3>
            {a.date && <p className="mb-4 text-sm text-gray-500">{a.date}</p>}
            <p className="text-base text-gray-600 flex-grow">{excerpt}</p>
          </div>
        </article>
      </Link>
    </div>
  );
}
