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
  const excerpt = plainBio.length > 160 ? `${plainBio.slice(0, 160)}...` : plainBio;

  return (
    <div className="article-card-wrapper">
      <Link
        href={`/podcasts/${slug}`}
        className="article-card-link"
        aria-label={`Écouter le balado « ${title} »`}
      >
        <article className="article-card">
          <div className="article-card-media">
            <img src={coverImage} alt={title} className="article-card-image" />
          </div>
          <div className="article-card-content">
            <h3 className="article-card-title">{title}</h3>
            {date && <p className="article-card-date">{formatDate(date)}</p>}
            <p className="article-card-excerpt">{excerpt}</p>
          </div>
          {isAdmin && (
            <footer className="article-card-footer">
              <button
                type="button"
                onClick={() => onDelete?.(id)}
                className="article-card-admin-action"
              >
                Supprimer le balado
              </button>
            </footer>
          )}
        </article>
      </Link>
    </div>
  );
}
