import Head from 'next/head';
import { useEffect, useState } from 'react';
import Navbar from '../../components/Navbar';
import usePodcasts from '../../hooks/usePodcasts';
import PodcastCard from '../../components/PodcastCard';

export default function PodcastsPage() {
  const { podcasts, loading, addPodcast, deletePodcast } = usePodcasts();
  const [isAdmin, setIsAdmin] = useState(false);
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [videoFile, setVideoFile] = useState(null);
  const [imageFile, setImageFile] = useState(null);

  useEffect(() => {
    setIsAdmin(document.cookie.includes('admin-auth=true'));
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!title || !date || !videoFile || !imageFile) return;

    await addPodcast({ title, date, video: videoFile, image: imageFile });
    setTitle('');
    setDate('');
    setVideoFile(null);
    setImageFile(null);
    event.target.reset();
  };

  const sortedPodcasts = [...podcasts]
    .map((podcast) => ({
      ...podcast,
      image:
        podcast.image ||
        podcast.coverImage ||
        podcast.thumbnail ||
        podcast.imageUrl ||
        '',
    }))
    .sort((a, b) => (a.date < b.date ? 1 : -1));

  const handleDeletePodcast = async (id) => {
    const confirmation = window.confirm(
      'Êtes-vous sûr de vouloir supprimer ce podcast ?'
    );
    if (!confirmation) return;

    await deletePodcast(id);
  };

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
                  Fichier vidéo
                </label>
                <input
                  id="video"
                  type="file"
                  accept="video/*"
                  onChange={(event) => {
                    const file = event.target.files?.[0] || null;
                    setVideoFile(file);
                  }}
                  className="w-full rounded border border-gray-300 p-2"
                  required
                />
                <p className="mt-1 text-sm text-gray-500">
                  Sélectionnez un fichier vidéo présent sur votre ordinateur (format MP4, WebM, etc.).
                </p>
                {videoFile && (
                  <p className="mt-1 text-sm text-gray-600">Fichier sélectionné : {videoFile.name}</p>
                )}
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium" htmlFor="image">
                  Image de couverture
                </label>
                <input
                  id="image"
                  type="file"
                  accept="image/*"
                  onChange={(event) => {
                    const file = event.target.files?.[0] || null;
                    setImageFile(file);
                  }}
                  className="w-full rounded border border-gray-300 p-2"
                  required
                />
                <p className="mt-1 text-sm text-gray-500">
                  Téléversez une image qui sera affichée sur la carte du podcast.
                </p>
                {imageFile && (
                  <p className="mt-1 text-sm text-gray-600">Image sélectionnée : {imageFile.name}</p>
                )}
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
            <div className="article-cards-container">
              {sortedPodcasts.map((podcast) => (
                <PodcastCard
                  key={podcast.id}
                  podcast={podcast}
                  isAdmin={isAdmin}
                  onDelete={handleDeletePodcast}
                />
              ))}
            </div>
          )}
        </section>
      </main>
    </>
  );
}
