import Head from 'next/head';
import { useState } from 'react';
import Navbar from '../../components/Navbar';
import usePodcasts from '../../hooks/usePodcasts';
import PodcastCard from '../../components/PodcastCard';
import useAdminStatus from '../../hooks/useAdminStatus';

const DEFAULT_MAX_UPLOAD_SIZE_BYTES = 4 * 1024 * 1024 * 1024; // 4 GB
const parsedLimit = Number(process.env.NEXT_PUBLIC_PODCAST_MAX_UPLOAD_BYTES);
const maxUploadSizeBytes = Number.isFinite(parsedLimit) && parsedLimit > 0
  ? parsedLimit
  : DEFAULT_MAX_UPLOAD_SIZE_BYTES;

function formatBytes(bytes) {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return null;
  }

  const units = ['octets', 'Ko', 'Mo', 'Go', 'To'];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }

  const precision = size >= 10 || unitIndex === 0 ? 0 : 1;
  return `${size.toFixed(precision)} ${units[unitIndex]}`;
}

export default function PodcastsPage() {
  const { podcasts, loading, addPodcast, deletePodcast } = usePodcasts();
  const isAdmin = useAdminStatus();
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [mediaFile, setMediaFile] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [bio, setBio] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const formattedUploadLimit = formatBytes(maxUploadSizeBytes);

  const isFileTooLarge = (file) =>
    file && Number.isFinite(maxUploadSizeBytes) && file.size > maxUploadSizeBytes;

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!title || !date || !mediaFile || !imageFile) return;

    if (isFileTooLarge(mediaFile)) {
      setSubmitError(
        formattedUploadLimit
          ? `Le fichier audio ou vidéo ne peut pas dépasser ${formattedUploadLimit}.`
          : "Le fichier audio ou vidéo sélectionné est trop volumineux.",
      );
      return;
    }

    if (isFileTooLarge(imageFile)) {
      setSubmitError(
        formattedUploadLimit
          ? `L'image de couverture ne peut pas dépasser ${formattedUploadLimit}.`
          : "L'image de couverture sélectionnée est trop volumineuse.",
      );
      return;
    }

    setSubmitError('');
    setSubmitSuccess('');
    setIsSubmitting(true);

    const result = await addPodcast({ title, date, bio, media: mediaFile, image: imageFile });

    if (result?.success) {
      setSubmitSuccess('Le balado a été téléversé avec succès.');
      setTitle('');
      setDate('');
      setBio('');
      setMediaFile(null);
      setImageFile(null);
      event.target.reset();
    } else {
      setSubmitError(result?.error || "Impossible d’ajouter le balado.");
    }

    setIsSubmitting(false);
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
                <label className="mb-1 block text-sm font-medium" htmlFor="bio">
                  Courte bio
                </label>
                <textarea
                  id="bio"
                  value={bio}
                  onChange={(event) => setBio(event.target.value)}
                  className="w-full rounded border border-gray-300 p-2"
                  placeholder="Ajoutez une courte description du podcast"
                  rows={4}
                />
                <p className="mt-1 text-sm text-gray-500">
                  Cette bio sera affichée sur la carte du podcast et sur la page détaillée.
                </p>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium" htmlFor="media">
                  Fichier audio ou vidéo
                </label>
                <input
                  id="media"
                  type="file"
                  accept="audio/*,video/*"
                  onChange={(event) => {
                    const file = event.target.files?.[0] || null;

                    if (file && isFileTooLarge(file)) {
                      setSubmitError(
                        formattedUploadLimit
                          ? `Le fichier audio ou vidéo ne peut pas dépasser ${formattedUploadLimit}.`
                          : "Le fichier audio ou vidéo sélectionné est trop volumineux.",
                      );
                      event.target.value = '';
                      setMediaFile(null);
                      return;
                    }

                    setSubmitError('');
                    setMediaFile(file);
                  }}
                  className="w-full rounded border border-gray-300 p-2"
                  required
                />
                <p className="mt-1 text-sm text-gray-500">
                  Sélectionnez un fichier média (audio ou vidéo) présent sur votre ordinateur.
                </p>
                {formattedUploadLimit && (
                  <p className="mt-1 text-sm text-gray-500">
                    Taille maximale autorisée : {formattedUploadLimit}.
                  </p>
                )}
                {mediaFile && (
                  <p className="mt-1 text-sm text-gray-600">Fichier sélectionné : {mediaFile.name}</p>
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

                    if (file && isFileTooLarge(file)) {
                      setSubmitError(
                        formattedUploadLimit
                          ? `L'image de couverture ne peut pas dépasser ${formattedUploadLimit}.`
                          : "L'image de couverture sélectionnée est trop volumineuse.",
                      );
                      event.target.value = '';
                      setImageFile(null);
                      return;
                    }

                    setSubmitError('');
                    setImageFile(file);
                  }}
                  className="w-full rounded border border-gray-300 p-2"
                  required
                />
                <p className="mt-1 text-sm text-gray-500">
                  Téléversez une image qui sera affichée sur la carte du podcast.
                </p>
                {formattedUploadLimit && (
                  <p className="mt-1 text-sm text-gray-500">
                    Taille maximale autorisée : {formattedUploadLimit}.
                  </p>
                )}
                {imageFile && (
                  <p className="mt-1 text-sm text-gray-600">Image sélectionnée : {imageFile.name}</p>
                )}
              </div>
              {submitError && (
                <p className="rounded border border-red-200 bg-red-50 p-2 text-sm text-red-700">
                  {submitError}
                </p>
              )}
              {submitSuccess && (
                <p className="rounded border border-green-200 bg-green-50 p-2 text-sm text-green-700">
                  {submitSuccess}
                </p>
              )}
              <button
                type="submit"
                disabled={isSubmitting}
                className="rounded bg-blue-600 px-4 py-2 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? 'Téléversement en cours…' : 'Publier le podcast'}
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
