import fs from 'fs';
import path from 'path';
import { addPodcast, getPodcasts } from '../../lib/podcastDatabase';

const uploadsDirectory = path.join(process.cwd(), 'public', 'uploads', 'podcasts');

function ensureUploadsDirectory() {
  if (!fs.existsSync(uploadsDirectory)) {
    fs.mkdirSync(uploadsDirectory, { recursive: true });
  }
}

function saveVideoFromDataUrl(videoDataUrl, originalName) {
  if (!videoDataUrl || typeof videoDataUrl !== 'string') {
    throw new Error('Invalid video payload.');
  }

  const matches = videoDataUrl.match(/^data:(.+);base64,(.*)$/);
  if (!matches) {
    throw new Error('Invalid data URL format.');
  }

  const [, mimeType, base64Data] = matches;
  const buffer = Buffer.from(base64Data, 'base64');

  const originalExt = (originalName && path.extname(originalName).toLowerCase()) || '';
  const baseName = (originalName && path.basename(originalName, originalExt)) || 'video';
  const sanitizedBaseName = baseName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '') || 'video';

  const fallbackExt =
    originalExt ||
    (mimeType && mimeType.includes('/')
      ? `.${mimeType.split('/')[1].split(/\+|;/)[0]}`
      : '');

  const fileName = `${Date.now()}-${sanitizedBaseName}${fallbackExt}`;

  ensureUploadsDirectory();
  fs.writeFileSync(path.join(uploadsDirectory, fileName), buffer);

  return path.posix.join('/uploads/podcasts', fileName);
}

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
    const { title, date, videoDataUrl, originalName } = req.body;

    if (!title || !date || !videoDataUrl || !originalName) {
      return res
        .status(400)
        .json({ error: 'title, date, videoDataUrl and originalName are required' });
    }

    let storedVideoPath;
    try {
      storedVideoPath = saveVideoFromDataUrl(videoDataUrl, originalName);
    } catch (error) {
      console.error('Failed to store uploaded video:', error);
      return res.status(500).json({ error: 'Failed to store uploaded video.' });
    }

    const podcasts = getPodcasts();
    const podcast = {
      id: Date.now().toString(),
      title,
      date,
      video: storedVideoPath,
      slug: createSlug(title, podcasts),
      createdAt: new Date().toISOString(),
    };

    addPodcast(podcast);
    return res.status(201).json(podcast);
  }

  const podcasts = getPodcasts();
  res.status(200).json(podcasts);
}
