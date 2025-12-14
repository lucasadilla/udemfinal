import crypto from 'node:crypto';
import { ObjectId } from 'mongodb';
import getMongoDb from './mongoClient';
import { readJsonFile, writeJsonFile } from './jsonStorage';

const FALLBACK_FILE = 'events.json';

async function getCollection() {
  const db = await getMongoDb();
  if (!db) {
    throw new Error('MongoDB non disponible');
  }
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

function readFallbackEvents() {
  const items = readJsonFile(FALLBACK_FILE, []);
  return items.map((item) => normalizeEvent(item)).filter(Boolean);
}

function writeFallbackEvents(events) {
  return writeJsonFile(FALLBACK_FILE, events);
}

export async function getEvents() {
  try {
    const collection = await getCollection();
    const docs = await collection
      .find({})
      .sort({ date: 1, createdAt: -1, _id: -1 })
      .toArray();

    return docs.map((doc) => normalizeEvent(doc));
  } catch (error) {
    console.error('Impossible de récupérer les événements depuis MongoDB :', error);
    return readFallbackEvents();
  }
}

export async function getEventById(id) {
  if (!id) {
    return null;
  }

  try {
    const collection = await getCollection();
    let objectId;
    try {
      objectId = new ObjectId(id);
    } catch (err) {
      return null;
    }

    const doc = await collection.findOne({ _id: objectId });
    return normalizeEvent(doc);
  } catch (error) {
    if (error instanceof TypeError || error?.name === 'BSONTypeError') {
      return readFallbackEvents().find((event) => event.id === id) || null;
    }
    console.error('Impossible de récupérer l\'événement depuis MongoDB :', error);
    return readFallbackEvents().find((event) => event.id === id) || null;
  }
}

export async function addEvent(event) {
  const payload = {
    title: event.title,
    bio: event.bio,
    date: event.date,
    createdAt: event.createdAt || new Date().toISOString(),
  };

  try {
    const collection = await getCollection();
    const result = await collection.insertOne(payload);
    return {
      ...payload,
      id: result.insertedId.toString(),
    };
  } catch (error) {
    console.error('Impossible d\'enregistrer l\'événement dans MongoDB :', error);
    const events = readFallbackEvents();
    const fallbackEvent = {
      ...payload,
      id: crypto.randomUUID(),
    };
    events.push(fallbackEvent);
    writeFallbackEvents(events);
    return fallbackEvent;
  }
}

export async function deleteEvent(id) {
  if (!id) {
    return { deletedCount: 0 };
  }

  try {
    const collection = await getCollection();
    let objectId;
    try {
      objectId = new ObjectId(id);
    } catch (err) {
      return { deletedCount: 0 };
    }

    const result = await collection.deleteOne({ _id: objectId });
    if (result.deletedCount && result.deletedCount > 0) {
      return { deletedCount: result.deletedCount };
    }
  } catch (error) {
    if (!(error instanceof TypeError || error?.name === 'BSONTypeError')) {
      console.error('Impossible de supprimer l\'événement dans MongoDB :', error);
    }
  }

  const events = readFallbackEvents();
  const index = events.findIndex((event) => event.id === id);
  if (index === -1) {
    return { deletedCount: 0 };
  }
  events.splice(index, 1);
  writeFallbackEvents(events);
  return { deletedCount: 1 };
}
