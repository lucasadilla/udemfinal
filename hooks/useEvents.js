import { useEffect, useState } from 'react';

export default function useEvents(initialEvents = []) {
  const [events, setEvents] = useState(initialEvents);
  const [loading, setLoading] = useState(initialEvents.length === 0);

  const fetchEvents = async () => {
    try {
      const res = await fetch('/api/events');
      if (res.ok) {
        const data = await res.json();
        setEvents(data);
      } else {
        console.warn('Impossible de récupérer les événements :', res.status);
      }
    } catch (err) {
      console.error('Impossible de récupérer les événements :', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialEvents.length > 0) {
      setEvents(initialEvents);
      setLoading(false);
    }
    fetchEvents();
  }, []);

  const addEvent = async (event) => {
    try {
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(event),
      });
      if (res.ok) {
        await fetchEvents();
      } else {
        console.warn('Impossible d’ajouter un événement :', res.status);
      }
    } catch (err) {
      console.error('Impossible d’ajouter un événement :', err);
    }
  };

  const deleteEventById = async (id) => {
    if (!id) return;
    try {
      const res = await fetch(`/api/events?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        await fetchEvents();
      } else {
        console.warn('Impossible de supprimer l’événement :', res.status);
      }
    } catch (err) {
      console.error('Impossible de supprimer l’événement :', err);
    }
  };

  return { events, loading, addEvent, deleteEvent: deleteEventById };
}
