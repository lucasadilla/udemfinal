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
export default function ArticleCard({ article = {} }) {
  const a = formatArticle(article);
  const plainBody = a.body ? a.body.replace(/<[^>]+>/g, '') : '';
  const excerpt = plainBody.length > 200 ? `${plainBody.slice(0, 200)}...` : plainBody;

  return (
    <Link href={`/articles/${a.id}`}>
      <article className="overflow-hidden rounded-lg bg-white shadow transition-shadow duration-200 hover:shadow-lg">
        <img src={a.image} alt={a.title} className="article-card-image" />
        <div className="p-4">
          <h3 className="mb-2 text-lg font-semibold">{a.title}</h3>
          {a.date && <p className="mb-2 text-sm text-gray-500">{a.date}</p>}
          <p className="text-sm text-gray-700">{excerpt}</p>
        </div>
      </article>
    </Link>
  );
}
