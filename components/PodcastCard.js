import Link from 'next/link';

const FALLBACK_IMAGE = 'https://placehold.co/600x400?text=Balado';

function formatDate(dateString) {
  if (!dateString) {
    return '';
  }

  const parsed = new Date(dateString);
  if (Number.isNaN(parsed.getTime())) {
    return dateString;
  }

  return parsed.toLocaleDateString('fr-CA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export default function PodcastCard({ podcast, isAdmin = false, onDelete }) {
  const { id, title, image, date, slug, bio, description, content } = podcast;
  const coverImage = image || FALLBACK_IMAGE;
  const rawBio = bio || description || content || '';
  const plainBio = rawBio ? rawBio.replace(/<[^>]+>/g, '') : '';
  const excerpt = plainBio.length > 200 ? `${plainBio.slice(0, 200)}...` : plainBio;

  return (
    <article className="article-card flex h-full max-w-md flex-col overflow-hidden rounded-2xl shadow-md">
      <Link href={`/podcasts/${slug}`} className="flex flex-col flex-grow">
        <div className="article-card-media">
          <img src={coverImage} alt={title} className="article-card-image" />
        </div>
        <div className="article-card-content flex flex-grow flex-col">
          <h3 className="mb-1 text-2xl font-bold leading-snug text-black">{title}</h3>
          {date && <p className="mb-4 text-sm text-gray-500">{formatDate(date)}</p>}
          <p className="text-base text-gray-600 flex-grow">{excerpt}</p>
        </div>
      </Link>
      {isAdmin && (
        <div className="border-t border-gray-200 bg-gray-50 p-4">
          <button
            type="button"
            onClick={() => onDelete?.(id)}
            className="w-full rounded bg-red-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-red-700"
          >
            Supprimer le balado
          </button>
        </div>
      )}
    </article>
  );
}
