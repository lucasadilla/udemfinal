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

  const fileToDataUrl = (file) =>
    new Promise((resolve, reject) => {
      if (typeof window === 'undefined' || !window.FileReader) {
        reject(new Error('Le téléversement de fichiers est seulement pris en charge dans le navigateur.'));
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        const { result } = reader;
        if (typeof result !== 'string') {
          reject(new Error('Résultat de lecture de fichier inattendu.'));
          return;
        }
        resolve(result);
      };
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(file);
    });

  const addPodcast = async ({ title, date, video, image, bio }) => {
    try {
      if (!video) {
        throw new Error('Un fichier vidéo doit être fourni.');
      }

      if (!image) {
        throw new Error('Un fichier image doit être fourni.');
      }

      const [videoDataUrl, imageDataUrl] = await Promise.all([
        fileToDataUrl(video),
        fileToDataUrl(image),
      ]);

      const res = await fetch('/api/podcasts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          date,
          bio,
          videoDataUrl,
          originalName: video.name,
          imageDataUrl,
          imageOriginalName: image.name,
        }),
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
