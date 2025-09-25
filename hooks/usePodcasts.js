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

  const addPodcast = async ({ title, date, video }) => {
    try {
      if (!video) {
        throw new Error('A video file must be provided');
      }

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

      const videoDataUrl = await fileToDataUrl(video);

      const res = await fetch('/api/podcasts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          date,
          videoDataUrl,
          originalName: video.name,
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

  return { podcasts, loading, addPodcast };
}
