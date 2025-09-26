import { MongoClient, ObjectId } from 'mongodb';

let cachedClientPromise = null;

async function getCollection() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error('MONGODB_URI not configured');
  }

  if (!cachedClientPromise) {
    if (!globalThis._eventClientPromise) {
      const client = new MongoClient(uri);
      globalThis._eventClientPromise = client.connect();
    }

    cachedClientPromise = globalThis._eventClientPromise;
  }

  const client = await cachedClientPromise;
  return client.db().collection('events');
}

function normalizeEvent(doc) {
  if (!doc) {
    return null;
  }

  const { _id, ...rest } = doc;

  return {
    ...rest,
    id: _id ? _id.toString() : rest.id ?? null,
  };
}

export async function getEvents() {
  const collection = await getCollection();
  const docs = await collection
    .find({})
    .sort({ date: 1, createdAt: -1, _id: -1 })
    .toArray();

  return docs.map((doc) => normalizeEvent(doc));
}

export async function getEventById(id) {
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

  const doc = await collection.findOne({ _id: objectId });
  return normalizeEvent(doc);
}

export async function addEvent(event) {
  const collection = await getCollection();

  const payload = {
    title: event.title,
    bio: event.bio,
    date: event.date,
    createdAt: event.createdAt || new Date().toISOString(),
  };

  const result = await collection.insertOne(payload);

  return {
    ...payload,
    id: result.insertedId.toString(),
  };
}
