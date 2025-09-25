import { MongoClient, ObjectId } from 'mongodb';

let cachedClientPromise = null;

async function getCollection() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error('MONGODB_URI not configured');
  }

  if (!cachedClientPromise) {
    if (!globalThis._podcastClientPromise) {
      const client = new MongoClient(uri);
      globalThis._podcastClientPromise = client.connect();
    }

    cachedClientPromise = globalThis._podcastClientPromise;
  }

  const client = await cachedClientPromise;
  return client.db().collection('podcasts');
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
  const collection = await getCollection();
  const docs = await collection
    .find({})
    .sort({ createdAt: -1, _id: -1 })
    .toArray();

  return docs.map((doc) => normalizePodcast(doc));
}

export async function getPodcastBySlug(slug) {
  if (!slug) {
    return null;
  }

  const collection = await getCollection();
  const doc = await collection.findOne({ slug });
  return normalizePodcast(doc);
}

export async function addPodcast(podcast) {
  const collection = await getCollection();

  const payload = {
    title: podcast.title,
    date: podcast.date,
    video: podcast.video,
    image: podcast.image,
    slug: podcast.slug,
    bio: podcast.bio || '',
    createdAt: podcast.createdAt || new Date().toISOString(),
  };

  const result = await collection.insertOne(payload);

  return {
    ...payload,
    id: result.insertedId.toString(),
  };
}

export async function deletePodcastById(id) {
  if (!id) {
    return null;
  }

  const collection = await getCollection();

  let objectId;
  try {
    objectId = new ObjectId(id);
  } catch (err) {
    return null;
  }

  const result = await collection.findOneAndDelete({ _id: objectId });
  return normalizePodcast(result.value);
}
