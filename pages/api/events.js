import { addEvent, getEvents, deleteEvent } from '../../lib/eventDatabase';

export default async function handler(req, res) {
  // Simple admin check via cookie set by /api/login
  const isAdmin = (req.headers?.cookie || '').includes('admin-auth=true');

  if (req.method === 'POST') {
    if (!isAdmin) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const { title, bio, date } = req.body || {};

    if (!title || !bio || !date) {
      return res.status(400).json({ error: 'title, bio and date are required' });
    }

    try {
      const created = await addEvent({ title, bio, date });
      return res.status(201).json(created);
    } catch (err) {
      console.error('Failed to add event', err);
      return res.status(500).json({ error: 'Failed to create event' });
    }
  }

  if (req.method === 'GET') {
    try {
      const events = await getEvents();
      return res.status(200).json(events);
    } catch (err) {
      console.error('Failed to fetch events', err);
      return res.status(500).json({ error: 'Failed to fetch events' });
    }
  }

  if (req.method === 'DELETE') {
    if (!isAdmin) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    try {
      const { id } = req.query || {};
      if (!id) {
        return res.status(400).json({ error: 'id is required' });
      }
      const result = await deleteEvent(id);
      if (result.deletedCount === 0) {
        return res.status(404).json({ error: 'Event not found' });
      }
      return res.status(200).json({ ok: true });
    } catch (err) {
      console.error('Failed to delete event', err);
      return res.status(500).json({ error: 'Failed to delete event' });
    }
  }

  res.setHeader('Allow', ['GET', 'POST', 'DELETE']);
  return res.status(405).end(`Method ${req.method} Not Allowed`);
}
