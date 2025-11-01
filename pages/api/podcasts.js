import fs from 'fs';
import path from 'path';
import { addPodcast, deletePodcastById, getPodcastBySlug, getPodcasts } from '../../lib/podcastDatabase';

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
    throw new Error('Chargement de média invalide.');
  }

  const matches = dataUrl.match(/^data:(.+);base64,(.*)$/);
  if (!matches) {
    throw new Error('Format d’URL de données invalide.');
  }

  const [, mimeType, base64Data] = matches;
  const buffer = Buffer.from(base64Data, 'base64');

  const originalExt = (originalName && path.extname(originalName).toLowerCase()) || '';
  const baseName =
    (originalName && path.basename(originalName, originalExt)) || fallbackBaseName || 'fichier';
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

async function generateUniqueSlug(title) {
  const baseSlug = title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');

  const initialSlug = baseSlug || Date.now().toString();

  // Ensure slug uniqueness even if multiple requests happen in quick succession.
  // We reuse getPodcastBySlug to leverage the shared MongoDB connection layer.
  for (let suffix = 0; ; suffix += 1) {
    const slugCandidate = suffix === 0 ? initialSlug : `${initialSlug}-${suffix}`;
    // eslint-disable-next-line no-await-in-loop
    const existing = await getPodcastBySlug(slugCandidate);
    if (!existing) {
      return slugCandidate;
    }
  }
}

export default async function handler(req, res) {
  try {
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
          error: 'Les champs title, date, videoDataUrl, originalName, imageDataUrl et imageOriginalName sont requis.',
        });
      }

      let storedVideoPath;
      let storedImagePath;
      try {
        storedVideoPath = saveMediaFromDataUrl(
          videoDataUrl,
          originalName,
          videoUploadsDirectory,
          'video'
        );
        storedImagePath = saveMediaFromDataUrl(
          imageDataUrl,
          imageOriginalName,
          imageUploadsDirectory,
          'balado-couverture'
        );
      } catch (error) {
        console.error('Impossible d’enregistrer les fichiers téléversés :', error);
        return res.status(500).json({ error: 'Impossible d’enregistrer les fichiers téléversés.' });
      }

      const slug = await generateUniqueSlug(title);
      const podcast = await addPodcast({
        title,
        date,
        video: storedVideoPath,
        image: storedImagePath,
        slug,
        createdAt: new Date().toISOString(),
        bio: typeof bio === 'string' ? bio.trim() : '',
      });

      return res.status(201).json(podcast);
    }

    if (req.method === 'DELETE') {
      const { id } = req.query.id ? req.query : req.body || {};

      if (!id || typeof id !== 'string') {
        return res.status(400).json({ error: 'Un identifiant de balado est requis.' });
      }

      const deletedPodcast = await deletePodcastById(id);

      if (!deletedPodcast) {
        return res.status(404).json({ error: 'Balado introuvable.' });
      }

      deleteMediaFileIfExists(deletedPodcast.video);
      deleteMediaFileIfExists(deletedPodcast.image);

      return res.status(200).json({ success: true });
    }

    const podcasts = await getPodcasts();
    return res.status(200).json(podcasts);
  } catch (error) {
    console.error('Échec du traitement de la requête de balado :', error);
    return res.status(500).json({ error: 'Échec du traitement de la requête de balado.' });
  }
}

export const config = {
  api: {
    bodyParser: {
      // Podcasts include base64-encoded video and image payloads which easily
      // exceed Next.js' default 1MB body size limit. Increasing the limit
      // ensures the request body is fully parsed instead of being rejected
      // before we can persist the podcast to disk.
      sizeLimit: '200mb',
    },
  },
};
