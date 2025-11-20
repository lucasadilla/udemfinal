import { useEffect, useState } from 'react';

export default function usePodcasts(initialPodcasts = []) {
  const [podcasts, setPodcasts] = useState(initialPodcasts);
  const [loading, setLoading] = useState(initialPodcasts.length === 0);

  const fetchPodcasts = async () => {
    try {
      const res = await fetch('/api/podcasts');
      if (res.ok) {
        const data = await res.json();
        setPodcasts(data);
      } else {
        console.warn('Impossible de récupérer les balados :', res.status);
      }
    } catch (err) {
      console.error('Impossible de récupérer les balados :', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialPodcasts.length > 0) {
      setPodcasts(initialPodcasts);
      setLoading(false);
    }
    fetchPodcasts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addPodcast = async ({
    title,
    date,
    bio,
    mediaMode,
    media,
    mediaUrl,
    imageMode,
    image,
    imageUrl,
  }) => {
    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('date', date);
      formData.append('bio', bio || '');
      formData.append('mediaMode', mediaMode);
      formData.append('imageMode', imageMode);

      const trimmedMediaUrl = (mediaUrl || '').trim();
      const trimmedImageUrl = (imageUrl || '').trim();

      if (mediaMode === 'upload') {
        if (media) {
          formData.append('media', media);
        }
      } else if (trimmedMediaUrl) {
        formData.append('mediaUrl', trimmedMediaUrl);
      }

      if (imageMode === 'upload') {
        if (image) {
          formData.append('image', image);
        }
      } else if (trimmedImageUrl) {
        formData.append('imageUrl', trimmedImageUrl);
      }

      const res = await fetch('/api/podcasts', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        await fetchPodcasts();
        return { success: true };
      }

      let errorMessage = `Impossible d’ajouter le balado (code ${res.status}).`;
      try {
        const payload = await res.json();
        if (payload?.error) {
          errorMessage = payload.error;
        }
      } catch (parseError) {
        // Ignore JSON parsing errors and use the default message.
      }

      console.warn('Impossible d’ajouter le balado :', errorMessage);
      return { success: false, error: errorMessage };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur inconnue lors de l’ajout du balado.';
      console.error('Impossible d’ajouter le balado :', err);
      return { success: false, error: message };
    }
  };

  const deletePodcast = async (id) => {
    try {
      const res = await fetch(`/api/podcasts?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        await fetchPodcasts();
      } else {
        console.warn('Impossible de supprimer le balado :', res.status);
      }
    } catch (err) {
      console.error('Impossible de supprimer le balado :', err);
    }
  };

  return { podcasts, loading, addPodcast, deletePodcast };
}
