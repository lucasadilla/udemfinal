import { addEvent, getEvents } from '../../lib/eventDatabase';

export default async function handler(req, res) {
  if (req.method === 'POST') {
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

  res.setHeader('Allow', ['GET', 'POST']);
  return res.status(405).end(`Method ${req.method} Not Allowed`);
}
