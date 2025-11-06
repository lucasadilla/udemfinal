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
          {isAudioSource(podcast.video) ? (
            <audio
              src={podcast.video}
              controls
              className="podcast-audio-player"
            >
              Votre navigateur ne supporte pas la lecture audio.
            </audio>
          ) : (
            <video
              src={podcast.video}
              controls
              autoPlay
              className="podcast-video-player"
            >
              Votre navigateur ne supporte pas la lecture vidéo.
            </video>
          )}
        </div>
      </main>
    </>
  );
}

export async function getServerSideProps({ params }) {
  try {
    const podcast = await getPodcastBySlug(params.slug);

    if (!podcast) {
      return {
        props: {
          podcast: null,
        },
      };
    }

    return {
      props: {
        podcast,
      },
    };
  } catch (error) {
    console.error('Impossible de récupérer le balado pour la page :', error);
    return {
      props: {
        podcast: null,
      },
    };
  }
}
