import { useEffect, useState } from 'react';

export default function usePodcasts() {
  const [podcasts, setPodcasts] = useState([]);
  const [loading, setLoading] = useState(true);

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
    fetchPodcasts();
  }, []);

  const addPodcast = async ({ title, date, video, image, bio }) => {
    try {
      if (!video) {
        throw new Error('Un fichier vidéo doit être fourni.');
      }

      if (!image) {
        throw new Error('Un fichier image doit être fourni.');
      }

      const formData = new FormData();
      formData.append('title', title);
      formData.append('date', date);
      formData.append('bio', bio || '');
      formData.append('video', video, video.name);
      formData.append('image', image, image.name);

      const res = await fetch('/api/podcasts', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        await fetchPodcasts();
      } else {
        console.warn('Impossible d’ajouter le balado :', res.status);
      }
    } catch (err) {
      console.error('Impossible d’ajouter le balado :', err);
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
