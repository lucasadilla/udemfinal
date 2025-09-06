import { events } from '../../lib/eventDatabase';

export default function handler(req, res) {
  if (req.method === 'POST') {
    const { title, bio, date } = req.body;
    if (!title || !bio || !date) {
      return res.status(400).json({ error: 'title, bio and date are required' });
    }
    events.push({ id: Date.now().toString(), title, bio, date });
    return res.status(201).json({ ok: true });
  }

  res.status(200).json(events);
}
