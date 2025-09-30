import { useEffect, useState } from 'react';

export default function useEvents() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchEvents = async () => {
    try {
      const res = await fetch('/api/events');
      if (res.ok) {
        const data = await res.json();
        setEvents(data);
      } else {
        console.warn('Failed to fetch events:', res.status);
      }
    } catch (err) {
      console.error('Failed to fetch events:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
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
        console.warn('Failed to add event:', res.status);
      }
    } catch (err) {
      console.error('Failed to add event:', err);
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
        console.warn('Failed to delete event:', res.status);
      }
    } catch (err) {
      console.error('Failed to delete event:', err);
    }
  };

  return { events, loading, addEvent, deleteEvent: deleteEventById };
}
