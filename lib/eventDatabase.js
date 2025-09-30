import { ObjectId } from 'mongodb';
import getMongoDb from './mongoClient';

async function getCollection() {
  const db = await getMongoDb();
  return db.collection('events');
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

export async function deleteEvent(id) {
  if (!id) {
    return { deletedCount: 0 };
  }

  const collection = await getCollection();

  let objectId;
  try {
    objectId = new ObjectId(id);
  } catch (err) {
    return { deletedCount: 0 };
  }

  const result = await collection.deleteOne({ _id: objectId });
  return { deletedCount: result.deletedCount || 0 };
}
