import fs from 'fs';
import path from 'path';
import { addPodcast, deletePodcastById, getPodcasts } from '../../lib/podcastDatabase';

const baseUploadsDirectory = path.join(process.cwd(), 'public', 'uploads', 'podcasts');
const videoUploadsDirectory = path.join(baseUploadsDirectory, 'videos');
const imageUploadsDirectory = path.join(baseUploadsDirectory, 'images');

function ensureUploadsDirectory(directory) {
  if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory, { recursive: true });
  }
}

function saveMediaFromDataUrl(dataUrl, originalName, directory, fallbackBaseName) {
  if (!dataUrl || typeof dataUrl !== 'string') {
    throw new Error('Invalid media payload.');
  }

  const matches = dataUrl.match(/^data:(.+);base64,(.*)$/);
  if (!matches) {
    throw new Error('Invalid data URL format.');
  }

  const [, mimeType, base64Data] = matches;
  const buffer = Buffer.from(base64Data, 'base64');

  const originalExt = (originalName && path.extname(originalName).toLowerCase()) || '';
  const baseName =
    (originalName && path.basename(originalName, originalExt)) || fallbackBaseName || 'file';
  const sanitizedBaseName =
    baseName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '') || fallbackBaseName || 'file';

  const fallbackExt =
    originalExt ||
    (mimeType && mimeType.includes('/')
      ? `.${mimeType.split('/')[1].split(/\+|;/)[0]}`
      : '');

  const fileName = `${Date.now()}-${sanitizedBaseName}${fallbackExt}`;

  ensureUploadsDirectory(directory);
  fs.writeFileSync(path.join(directory, fileName), buffer);

  const relativeDirectory = path.relative(path.join(process.cwd(), 'public'), directory);
  return path.posix.join('/', relativeDirectory.split(path.sep).join('/'), fileName);
}

function deleteMediaFileIfExists(filePath) {
  if (!filePath) {
    return;
  }

  const sanitizedPath = filePath.startsWith('/') ? filePath.slice(1) : filePath;
  const absolutePath = path.join(process.cwd(), 'public', sanitizedPath);

  try {
    const stats = fs.statSync(absolutePath);
    if (stats.isFile()) {
      fs.unlinkSync(absolutePath);
    }
  } catch (error) {
    // File already removed or does not exist. Ignore silently.
  }
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
    const {
      title,
      date,
      bio,
      videoDataUrl,
      originalName,
      imageDataUrl,
      imageOriginalName,
    } = req.body;

    if (!title || !date || !videoDataUrl || !originalName || !imageDataUrl || !imageOriginalName) {
      return res.status(400).json({
        error: 'title, date, videoDataUrl, originalName, imageDataUrl and imageOriginalName are required',
      });
    }

    let storedVideoPath;
    let storedImagePath;
    try {
      storedVideoPath = saveMediaFromDataUrl(videoDataUrl, originalName, videoUploadsDirectory, 'video');
      storedImagePath = saveMediaFromDataUrl(
        imageDataUrl,
        imageOriginalName,
        imageUploadsDirectory,
        'podcast-cover'
      );
    } catch (error) {
      console.error('Failed to store uploaded media:', error);
      return res.status(500).json({ error: 'Failed to store uploaded media.' });
    }

    const podcasts = getPodcasts();
    const podcast = {
      id: Date.now().toString(),
      title,
      date,
      video: storedVideoPath,
      image: storedImagePath,
      slug: createSlug(title, podcasts),
      createdAt: new Date().toISOString(),
      bio: typeof bio === 'string' ? bio.trim() : '',
    };

    addPodcast(podcast);
    return res.status(201).json(podcast);
  }

  if (req.method === 'DELETE') {
    const { id } = req.query.id ? req.query : req.body || {};

    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'A podcast id is required.' });
    }

    const deletedPodcast = deletePodcastById(id);

    if (!deletedPodcast) {
      return res.status(404).json({ error: 'Podcast not found.' });
    }

    deleteMediaFileIfExists(deletedPodcast.video);
    deleteMediaFileIfExists(deletedPodcast.image);

    return res.status(200).json({ success: true });
  }

  const podcasts = getPodcasts();
  res.status(200).json(podcasts);
}
