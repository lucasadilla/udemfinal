import Link from 'next/link';

// Format raw article data into a unified shape
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
    author = {},
    authorName,
    authorImage,
    date = '',
    category,
    tag,
  } = raw;

  return {
    id: _id || id,
    title,
    body: body || content || '',
    image: image || imageUrl || coverImage || 'https://placehold.co/600x400',
    author: {
      name: author.name || authorName || 'Unknown',
      image: author.profilePic || authorImage || 'https://placehold.co/48',
    },
    date,
    category: category || tag || '',
  };
}

// Compact article preview card
export default function ArticleCard({ article = {} }) {
  const a = formatArticle(article);
  const excerpt = a.body.length > 80 ? `${a.body.slice(0, 80)}...` : a.body;

  return (
    <Link href={`/articles/${a.id}`}>
      <article className="max-w-xs overflow-hidden rounded-lg bg-white shadow transition-shadow duration-200 hover:shadow-lg">
        <div className="relative h-36 w-full">
          <img src={a.image} alt={a.title} className="h-full w-full object-cover" />
          {a.category && (
            <span className="absolute left-2 top-2 rounded-full bg-blue-600 px-2 py-0.5 text-[10px] font-medium text-white">
              {a.category}
            </span>
          )}
        </div>
        <div className="space-y-2 p-4">
          <h3 className="text-sm font-semibold leading-snug">{a.title}</h3>
          <p className="text-xs text-gray-600">{excerpt}</p>
          <div className="flex items-center border-t pt-2 text-xs text-gray-500">
            <img
              src={a.author.image}
              alt={a.author.name}
              className="mr-2 h-6 w-6 rounded-full object-cover"
            />
            <span className="mr-auto">{a.author.name}</span>
            {a.date && <span>{a.date}</span>}
          </div>
        </div>
      </article>
    </Link>
  );
}
