import Head from 'next/head';
import { useRouter } from 'next/router';
import Navbar from '../../components/Navbar';
import { getPodcastBySlug } from '../../lib/podcastDatabase';

export default function PodcastDetail({ podcast }) {
  const router = useRouter();

  if (!podcast) {
    return (
      <>
        <Head>
          <title>Podcast introuvable</title>
        </Head>
        <Navbar />
        <main className="mx-auto max-w-4xl p-4 text-center">
          <h1 className="text-2xl font-semibold">Ce podcast est introuvable.</h1>
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
          ← Arrière
        </button>
        <header className="mb-6 text-center">
          <h1 className="mb-2 text-3xl font-semibold">{podcast.title}</h1>
          {displayDate && <p className="text-sm text-gray-600">{displayDate}</p>}
          {podcast.bio && (
            <p className="mt-4 text-base text-gray-700">{podcast.bio}</p>
          )}
        </header>
        {podcast.image && (
          <div className="mb-6 overflow-hidden rounded-lg">
            <img
              src={podcast.image}
              alt={podcast.title}
              className="h-full w-full object-cover"
            />
          </div>
        )}
        <div className="aspect-video w-full">
          <video
            src={podcast.video}
            controls
            autoPlay
            className="h-full w-full rounded-lg bg-black"
          />
        </div>
      </main>
    </>
  );
}

export async function getServerSideProps({ params }) {
  const podcast = getPodcastBySlug(params.slug);

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
}
