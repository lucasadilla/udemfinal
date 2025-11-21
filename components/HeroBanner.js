import Image from 'next/image';

export default function HeroBanner({ title, subtitle, imageUrl, loading, error }) {
  const hasImage = Boolean(imageUrl);
  const backgroundStyle = hasImage
    ? {
        backgroundImage: `linear-gradient(180deg, rgba(12, 10, 29, 0.6), rgba(12, 10, 29, 0.75)), url(${imageUrl})`,
      }
    : {
        backgroundImage:
          'radial-gradient(circle at 20% 20%, rgba(147, 197, 253, 0.35), transparent 25%), radial-gradient(circle at 80% 10%, rgba(217, 70, 239, 0.25), transparent 30%), linear-gradient(135deg, #0f172a, #111827)',
      };

  return (
    <div className="hero-banner" style={backgroundStyle}>
      <div className="hero-banner__overlay">
        <div className="hero-banner__content">
          {loading ? (
            <p className="hero-banner__status">Chargement de la bannière…</p>
          ) : (
            <>
              <p className="hero-banner__eyebrow">Femme & Droit</p>
              <h1 className="hero-banner__title">{title}</h1>
              <p className="hero-banner__subtitle">{subtitle}</p>
            </>
          )}
          {error && !loading && (
            <p className="hero-banner__status hero-banner__status--error">
              Impossible de récupérer la bannière dynamique. Affichage du contenu de secours.
            </p>
          )}
          {!hasImage && !loading && !error && (
            <p className="hero-banner__status hero-banner__status--muted">
              Ajoutez une image de bannière pour personnaliser cette section.
            </p>
          )}
        </div>
        {hasImage && (
          <div className="hero-banner__preview" aria-hidden>
            <Image
              src={imageUrl}
              alt="Bannière de la page d'accueil"
              fill
              priority
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="hero-banner__image"
            />
          </div>
        )}
      </div>
    </div>
  );
}
