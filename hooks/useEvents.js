import { useSWRData } from './useSWR';

export default function useEvents() {
  const { data: events = [], error, isLoading: loading, mutate } = useSWRData('/api/events', {
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
    dedupingInterval: 2000, // Cache for 2 seconds
  });

  const addEvent = async (event) => {
    try {
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(event),
      });
      if (res.ok) {
        // Revalidate to get fresh data
        await mutate();
      } else {
        console.warn('Impossible d\'ajouter un événement :', res.status);
      }
    } catch (err) {
      console.error('Impossible d\'ajouter un événement :', err);
    }
  };

  const deleteEventById = async (id) => {
    if (!id) return;
    try {
      const res = await fetch(`/api/events?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        // Revalidate to get fresh data
        await mutate();
      } else {
        console.warn('Impossible de supprimer l\'événement :', res.status);
      }
    } catch (err) {
      console.error('Impossible de supprimer l\'événement :', err);
    }
  };

  return { events, loading, addEvent, deleteEvent: deleteEventById };
}
