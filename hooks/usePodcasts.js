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
        console.warn('Failed to fetch podcasts:', res.status);
      }
    } catch (err) {
      console.error('Failed to fetch podcasts:', err);
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
        reject(new Error('File uploads are only supported in the browser environment.'));
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        const { result } = reader;
        if (typeof result !== 'string') {
          reject(new Error('Unexpected file reader result.'));
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
        throw new Error('A video file must be provided');
      }

      if (!image) {
        throw new Error('An image file must be provided');
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
        console.warn('Failed to add podcast:', res.status);
      }
    } catch (err) {
      console.error('Failed to add podcast:', err);
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
        console.warn('Failed to delete podcast:', res.status);
      }
    } catch (err) {
      console.error('Failed to delete podcast:', err);
    }
  };

  return { podcasts, loading, addPodcast, deletePodcast };
}
