import crypto from 'node:crypto';
import { ObjectId } from 'mongodb';
import getMongoDb from './mongoClient';
import { readJsonFile, writeJsonFile } from './jsonStorage';

const FALLBACK_FILE = 'podcasts.json';

async function getCollection() {
  const db = await getMongoDb();
  return db.collection('podcasts');
}

function normalizePodcast(doc) {
  if (!doc) {
    return null;
  }

  const { _id, ...rest } = doc;

  return {
    ...rest,
    id: _id ? _id.toString() : rest.id ?? null,
  };
}

export async function getPodcasts() {
  try {
    const collection = await getCollection();
    const docs = await collection
      .find({})
      .sort({ createdAt: -1, _id: -1 })
      .toArray();

    return docs.map((doc) => normalizePodcast(doc));
  } catch (error) {
    console.error('Impossible de récupérer les balados depuis MongoDB :', error);
    const items = readJsonFile(FALLBACK_FILE, []);
    return items
      .map((item) => normalizePodcast(item))
      .filter(Boolean)
      .sort((a, b) => (b?.createdAt || '').localeCompare(a?.createdAt || ''));
  }
}

export async function getPodcastBySlug(slug) {
  if (!slug) {
    return null;
  }

  try {
    const collection = await getCollection();
    const doc = await collection.findOne({ slug });
    return normalizePodcast(doc);
  } catch (error) {
    console.error('Impossible de récupérer le balado depuis MongoDB :', error);
    const items = readJsonFile(FALLBACK_FILE, []);
    return (
      items
        .map((item) => normalizePodcast(item))
        .find((podcast) => podcast?.slug === slug) || null
    );
  }
}

export async function addPodcast(podcast) {
  const payload = {
    title: podcast.title,
    date: podcast.date,
    video: podcast.video,
    image: podcast.image,
    slug: podcast.slug,
    bio: podcast.bio || '',
    createdAt: podcast.createdAt || new Date().toISOString(),
  };

  try {
    const collection = await getCollection();
    const result = await collection.insertOne(payload);

    return {
      ...payload,
      id: result.insertedId.toString(),
    };
  } catch (error) {
    console.error('Impossible d’enregistrer le balado dans MongoDB :', error);
    const podcasts = readJsonFile(FALLBACK_FILE, []);
    const fallbackPodcast = {
      ...payload,
      id: crypto.randomUUID(),
    };
    podcasts.push(fallbackPodcast);
    writeJsonFile(FALLBACK_FILE, podcasts);
    return fallbackPodcast;
  }
}

export async function deletePodcastById(id) {
  if (!id) {
    return null;
  }

  try {
    const collection = await getCollection();

    let objectId;
    try {
      objectId = new ObjectId(id);
    } catch (err) {
      objectId = null;
    }

    if (objectId) {
      const result = await collection.findOneAndDelete({ _id: objectId });
      const deleted = normalizePodcast(result.value);
      if (deleted) {
        return deleted;
      }
    }
  } catch (error) {
    console.error('Impossible de supprimer le balado dans MongoDB :', error);
  }

  const podcasts = readJsonFile(FALLBACK_FILE, []);
  const index = podcasts.findIndex((item) => {
    const normalized = normalizePodcast(item);
    return normalized?.id === id;
  });
  if (index === -1) {
    return null;
  }
  const [removed] = podcasts.splice(index, 1);
  writeJsonFile(FALLBACK_FILE, podcasts);
  return normalizePodcast(removed);
}
