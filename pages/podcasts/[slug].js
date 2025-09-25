import Head from 'next/head';
import Navbar from '../../components/Navbar';
import { getPodcastBySlug } from '../../lib/podcastDatabase';

export default function PodcastDetail({ podcast }) {
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

  return (
    <>
      <Head>
        <title>{podcast.title}</title>
      </Head>
      <Navbar />
      <main className="mx-auto max-w-4xl p-4">
        <article className="space-y-6 rounded-lg bg-white p-6 shadow">
          <header>
            <p className="text-sm uppercase tracking-wide text-gray-500">{displayDate}</p>
            <h1 className="text-3xl font-semibold">{podcast.title}</h1>
          </header>
          <div className="aspect-video w-full">
            <video
              src={podcast.video}
              controls
              autoPlay
              className="h-full w-full rounded-lg bg-black"
            />
          </div>
        </article>
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
