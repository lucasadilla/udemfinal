import { addPodcast, getPodcasts } from '../../lib/podcastDatabase';

function createSlug(baseSlug, existingPodcasts) {
  const slug = baseSlug
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');

  if (!slug) {
    return Date.now().toString();
  }

  let uniqueSlug = slug;
  let suffix = 1;

  while (existingPodcasts.some((podcast) => podcast.slug === uniqueSlug)) {
    uniqueSlug = `${slug}-${suffix}`;
    suffix += 1;
  }

  return uniqueSlug;
}

export default function handler(req, res) {
  if (req.method === 'POST') {
    const { title, date, video } = req.body;

    if (!title || !date || !video) {
      return res.status(400).json({ error: 'title, date and video are required' });
    }

    const podcasts = getPodcasts();
    const podcast = {
      id: Date.now().toString(),
      title,
      date,
      video,
      slug: createSlug(title, podcasts),
      createdAt: new Date().toISOString(),
    };

    addPodcast(podcast);
    return res.status(201).json(podcast);
  }

  const podcasts = getPodcasts();
  res.status(200).json(podcasts);
}
