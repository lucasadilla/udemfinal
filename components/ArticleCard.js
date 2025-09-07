import Link from 'next/link';

// Normalizes varying article structures into a single format
function normalizeArticle(article = {}) {
  const {
    _id,
    id,
    title = 'Untitled',
    content,
    body,
    image,
    imageUrl,
    coverImage,
    author = {},
    authorName,
    authorImage,
    date = '',
    category,
    tag,
  } = article;

  return {
    id: _id || id,
    title,
    body: content || body || '',
    image: image || imageUrl || coverImage || 'https://placehold.co/600x400',
    authorName: author.name || authorName || 'Unknown',
    authorImage: author.profilePic || authorImage || 'https://placehold.co/40',
    date,
    category: category || tag || '',
  };
}

// Displays an article preview with flexible layout
export default function ArticleCard({ article = {}, isLarge = false }) {
  const normalized = normalizeArticle(article);
  const excerptLength = isLarge ? 160 : 100;
  const excerpt =
    normalized.body.length > excerptLength
      ? `${normalized.body.slice(0, excerptLength)}...`
      : normalized.body;

  const containerClass = isLarge
    ? 'md:flex-row md:h-72'
    : 'flex-col max-w-sm';
  const imageClass = isLarge ? 'md:w-1/2 h-72' : 'w-full h-40';
  const paddingClass = isLarge ? 'p-6' : 'p-4';
  const titleClass = isLarge ? 'text-xl' : 'text-lg';
  const excerptClass = `text-gray-600 text-sm mb-4 ${isLarge ? 'flex-1' : ''}`;
  const authorImageClass = isLarge ? 'w-10 h-10' : 'w-8 h-8';

  return (
    <Link href={`/articles/${normalized.id}`}>
      <article
        className={`flex ${containerClass} bg-white rounded-xl shadow-md overflow-hidden cursor-pointer transition-transform duration-200 hover:shadow-lg hover:-translate-y-1`}
      >
        <div className={`relative ${imageClass} flex-shrink-0`}>
          <img
            src={normalized.image}
            alt={normalized.title}
            className="absolute inset-0 w-full h-full object-cover"
          />
          {normalized.category && (
            <span className="absolute top-2 left-2 bg-blue-600 text-white text-xs font-medium px-3 py-1 rounded-full">
              {normalized.category}
            </span>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        </div>

        <div className={`${paddingClass} flex flex-col flex-1`}>
          <h3 className={`${titleClass} font-semibold mb-3`}>{normalized.title}</h3>
          <p className={excerptClass}>{excerpt}</p>
          <div className="flex items-center mt-auto">
            <img
              src={normalized.authorImage}
              alt={normalized.authorName}
              className={`${authorImageClass} rounded-full mr-3 object-cover`}
            />
            <div className="text-sm">
              <p className="text-gray-900 leading-none">{normalized.authorName}</p>
              {normalized.date && <p className="text-gray-500 text-xs">{normalized.date}</p>}
            </div>
          </div>
        </div>
      </article>
    </Link>
  );
}

