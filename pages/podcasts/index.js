import Head from 'next/head';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import Navbar from '../../components/Navbar';
import usePodcasts from '../../hooks/usePodcasts';

export default function PodcastsPage() {
  const { podcasts, loading, addPodcast } = usePodcasts();
  const [isAdmin, setIsAdmin] = useState(false);
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [video, setVideo] = useState('');

  useEffect(() => {
    setIsAdmin(document.cookie.includes('admin-auth=true'));
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!title || !date || !video) return;

    await addPodcast({ title, date, video });
    setTitle('');
    setDate('');
    setVideo('');
  };

  const formatDisplayDate = (dateString) => {
    const parsed = dateString ? new Date(dateString) : null;
    if (!parsed || Number.isNaN(parsed.getTime())) {
      return dateString;
    }

    return parsed.toLocaleDateString('fr-CA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const sortedPodcasts = [...podcasts].sort((a, b) =>
    a.date < b.date ? 1 : -1
  );

  return (
    <>
      <Head>
        <title>Podcasts</title>
      </Head>
      <Navbar />
      <main className="mx-auto max-w-5xl p-4">
        <h1 className="mb-6 text-center text-3xl font-semibold">Podcasts</h1>

        {isAdmin && (
          <section className="mb-10 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
            <h2 className="mb-4 text-xl font-semibold">Ajouter un podcast</h2>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="mb-1 block text-sm font-medium" htmlFor="title">
                  Titre
                </label>
                <input
                  id="title"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  className="w-full rounded border border-gray-300 p-2"
                  placeholder="Titre du podcast"
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium" htmlFor="date">
                  Date
                </label>
                <input
                  id="date"
                  type="date"
                  value={date}
                  onChange={(event) => setDate(event.target.value)}
                  className="w-full rounded border border-gray-300 p-2"
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium" htmlFor="video">
                  Lien de la vidéo
                </label>
                <input
                  id="video"
                  type="url"
                  value={video}
                  onChange={(event) => setVideo(event.target.value)}
                  className="w-full rounded border border-gray-300 p-2"
                  placeholder="https://exemple.com/video.mp4"
                  required
                />
                <p className="mt-1 text-sm text-gray-500">
                  Fournissez un lien direct vers une vidéo compatible avec les balises HTML5.
                </p>
              </div>
              <button
                type="submit"
                className="rounded bg-blue-600 px-4 py-2 font-semibold text-white transition hover:bg-blue-700"
              >
                Publier le podcast
              </button>
            </form>
          </section>
        )}

        <section>
          {loading ? (
            <p className="text-center text-gray-600">Chargement des podcasts...</p>
          ) : sortedPodcasts.length === 0 ? (
            <p className="text-center text-gray-600">Aucun podcast n'est disponible pour le moment.</p>
          ) : (
            <ul className="grid gap-6 md:grid-cols-2">
              {sortedPodcasts.map((podcast) => (
                <li key={podcast.id} className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                  <h3 className="text-lg font-semibold">{podcast.title}</h3>
                  <p className="text-sm text-gray-600">
                    {formatDisplayDate(podcast.date)}
                  </p>
                  <Link
                    href={`/podcasts/${podcast.slug}`}
                    className="mt-4 inline-block rounded bg-blue-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
                  >
                    Écouter le podcast
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </>
  );
}
