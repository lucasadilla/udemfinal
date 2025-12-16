import Head from 'next/head';
import { useRouter } from 'next/router';
import Navbar from '../../components/Navbar';
import { getPodcastBySlug } from '../../lib/podcastDatabase';

function isAudioSource(source) {
  if (!source || typeof source !== 'string') {
    return false;
  }

  if (source.startsWith('data:')) {
    return source.startsWith('data:audio/');
  }

  const lowerSource = source.toLowerCase();
  const audioExtensions = ['.mp3', '.wav', '.m4a', '.aac', '.ogg', '.oga', '.flac'];
  return audioExtensions.some((extension) => lowerSource.endsWith(extension));
}

function isHttpUrl(value) {
  if (typeof value !== 'string' || !value.trim()) {
    return false;
  }

  try {
    const parsed = new URL(value);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch (error) {
    return false;
  }
}

function getEmbeddableVideoUrl(source) {
  if (!isHttpUrl(source)) {
    return null;
  }

  try {
    const url = new URL(source);
    const host = url.hostname.toLowerCase();

    if (host.includes('youtube.com') || host.includes('youtu.be')) {
      const pathSegments = url.pathname.split('/').filter(Boolean);
      const searchId = url.searchParams.get('v') || '';

      if (url.pathname.startsWith('/embed/')) {
        return `https://www.youtube.com${url.pathname}${url.search}`;
      }

      if (url.pathname.startsWith('/shorts/') && pathSegments[1]) {
        return `https://www.youtube.com/embed/${pathSegments[1]}`;
      }

      if (url.pathname.startsWith('/live/') && pathSegments[1]) {
        return `https://www.youtube.com/embed/${pathSegments[1]}`;
      }

      if (searchId) {
        return `https://www.youtube.com/embed/${searchId}`;
      }

      if (host.includes('youtu.be') && pathSegments[0]) {
        return `https://www.youtube.com/embed/${pathSegments[0]}`;
      }

      const directId = pathSegments[pathSegments.length - 1];
      if (directId && directId !== 'watch') {
        return `https://www.youtube.com/embed/${directId}`;
      }
    }

    if (host.includes('vimeo.com')) {
      if (host === 'player.vimeo.com' && url.pathname.startsWith('/video/')) {
        return source;
      }

      const pathSegments = url.pathname.split('/').filter(Boolean);
      const videoId = [...pathSegments].reverse().find((segment) => /^(\d+)$/.test(segment));

      if (videoId) {
        return `https://player.vimeo.com/video/${videoId}`;
      }
    }
  } catch (error) {
    return null;
  }

  return null;
}

export default function PodcastDetail({ podcast }) {
  const router = useRouter();

  if (!podcast) {
    return (
      <>
        <Head>
          <title>Balado introuvable</title>
        </Head>
        <Navbar />
        <main className="mx-auto max-w-4xl p-4 text-center">
          <h1 className="text-2xl font-semibold">Ce balado est introuvable.</h1>
        </main>
      </>
    );
  }

  const displayDate = podcast.date
    ? new Date(podcast.date).toLocaleDateString('fr-CA', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : '';

  const mediaSource = podcast.video || '';
  const audioSource = isAudioSource(mediaSource);
  const embedUrl = getEmbeddableVideoUrl(mediaSource);
  const hasMedia = Boolean(mediaSource);

  const handleBack = () => {
    router.back();
  };

  return (
    <>
      <Head>
        <title>{podcast.title}</title>
      </Head>
      <Navbar />
      <main className="article-page article-box">
        <button type="button" onClick={handleBack} className="back-button">
          ← Retour
        </button>
        <header className="mb-6 text-center">
          <h1 className="mb-2 text-3xl font-semibold">{podcast.title}</h1>
          {displayDate && <p className="text-sm text-gray-600">{displayDate}</p>}
          {podcast.bio && (
            <p className="mt-4 text-base text-gray-700">{podcast.bio}</p>
          )}
        </header>
        <div className="podcast-video-container">
          {hasMedia ? (
            audioSource ? (
              <audio src={mediaSource} controls className="podcast-audio-player">
                Votre navigateur ne supporte pas la lecture audio.
              </audio>
            ) : embedUrl ? (
              <div className="podcast-embed-wrapper">
                <iframe
                  src={embedUrl}
                  title={`Lecture du balado ${podcast.title}`}
                  className="podcast-embed-frame"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            ) : (
              <video
                src={mediaSource}
                controls
                autoPlay
                className="podcast-video-player"
                poster={podcast.image || undefined}
              >
                Votre navigateur ne supporte pas la lecture vidéo.
              </video>
            )
          ) : (
            <p className="text-center text-gray-600">Aucun média n’est associé à ce balado.</p>
          )}
        </div>
      </main>
    </>
  );
}

// ISR: Generate static pages at build time and revalidate every 60 seconds
export async function getStaticProps({ params }) {
  try {
    const podcast = await getPodcastBySlug(params.slug);

    if (!podcast) {
      return {
        notFound: true,
        revalidate: 60, // Revalidate every 60 seconds
      };
    }

    return {
      props: {
        podcast,
      },
      revalidate: 60, // Revalidate every 60 seconds
    };
  } catch (error) {
    console.error('Impossible de récupérer le balado pour la page :', error);
    return {
      notFound: true,
      revalidate: 60,
    };
  }
}

// Generate static paths for all podcasts at build time
export async function getStaticPaths() {
  try {
    const { getPodcasts } = await import('../../lib/podcastDatabase');
    const podcasts = await getPodcasts();
    const paths = podcasts
      .filter((podcast) => podcast?.slug)
      .map((podcast) => ({
        params: { slug: podcast.slug },
      }));

    return {
      paths,
      fallback: 'blocking', // Generate new pages on-demand if not found at build time
    };
  } catch (error) {
    console.error('Impossible de récupérer les slugs de balados :', error);
    return {
      paths: [],
      fallback: 'blocking',
    };
  }
}
