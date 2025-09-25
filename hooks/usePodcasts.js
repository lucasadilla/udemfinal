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

  const addPodcast = async (podcast) => {
    try {
      const res = await fetch('/api/podcasts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(podcast),
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
