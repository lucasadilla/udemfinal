import { addEvent, getEvents, deleteEvent } from '../../lib/eventDatabase';

export default async function handler(req, res) {
  // Simple admin check via cookie set by /api/login
  const isAdmin = (req.headers?.cookie || '').includes('admin-auth=true');

  if (req.method === 'POST') {
    if (!isAdmin) {
      return res.status(401).json({ error: 'Non autorisé.' });
    }
    const { title, bio, date } = req.body || {};

    if (!title || !bio || !date) {
      return res.status(400).json({ error: 'Les champs title, bio et date sont requis.' });
    }

    try {
      const created = await addEvent({ title, bio, date });
      return res.status(201).json(created);
    } catch (err) {
      console.error('Impossible d’ajouter un événement :', err);
      return res.status(500).json({ error: 'Impossible de créer l’événement.' });
    }
  }

  if (req.method === 'GET') {
    try {
      // Cache for 2 minutes, revalidate in background
      res.setHeader('Cache-Control', 'public, s-maxage=120, stale-while-revalidate=300');
      const events = await getEvents();
      return res.status(200).json(events);
    } catch (err) {
      console.error('Impossible de récupérer les événements :', err);
      return res.status(500).json({ error: 'Impossible de récupérer les événements.' });
    }
  }

  if (req.method === 'DELETE') {
    if (!isAdmin) {
      return res.status(401).json({ error: 'Non autorisé.' });
    }
    try {
      const { id } = req.query || {};
      if (!id) {
        return res.status(400).json({ error: "L’identifiant est requis." });
      }
      const result = await deleteEvent(id);
      if (result.deletedCount === 0) {
        return res.status(404).json({ error: 'Événement introuvable.' });
      }
      return res.status(200).json({ ok: true });
    } catch (err) {
      console.error('Impossible de supprimer l’événement :', err);
      return res.status(500).json({ error: 'Impossible de supprimer l’événement.' });
    }
  }

  res.setHeader('Allow', ['GET', 'POST', 'DELETE']);
  return res.status(405).end(`Méthode ${req.method} non autorisée`);
}
