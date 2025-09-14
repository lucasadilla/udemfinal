import { getEvents, addEvent } from '../../lib/eventDatabase';

export default function handler(req, res) {
  if (req.method === 'POST') {
    const { title, bio, date } = req.body;
    if (!title || !bio || !date) {
      return res.status(400).json({ error: 'title, bio and date are required' });
    }
    addEvent({ id: Date.now().toString(), title, bio, date });
    return res.status(201).json({ ok: true });
  }

  const events = getEvents();
  res.status(200).json(events);
}
