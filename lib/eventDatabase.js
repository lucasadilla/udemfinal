import crypto from 'node:crypto';
import { ObjectId } from 'mongodb';
import getMongoDb from './mongoClient';
import { readJsonFile, writeJsonFile } from './jsonStorage';

const FALLBACK_FILE = 'events.json';

function readFallbackEvents() {
  return readJsonFile(FALLBACK_FILE, []);
}

function writeFallbackEvents(events) {
  return writeJsonFile(FALLBACK_FILE, events);
}

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

function sortEvents(events) {
  return [...events].sort((a, b) => {
    const dateA = a?.date || '';
    const dateB = b?.date || '';

    if (dateA === dateB) {
      return (b?.createdAt || '').localeCompare(a?.createdAt || '');
    }

    return dateA.localeCompare(dateB);
  });
}

export async function getEvents() {
  try {
    const collection = await getCollection();
    const docs = await collection
      .find({})
      .sort({ date: 1, createdAt: -1, _id: -1 })
      .toArray();

    return docs.map((doc) => normalizeEvent(doc)).filter(Boolean);
  } catch (error) {
    console.warn('Impossible de récupérer les événements depuis MongoDB :', error);
    return sortEvents(readFallbackEvents());
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
      return readFallbackEvents().find((item) => item.id === id) || null;
    }

    const doc = await collection.findOne({ _id: objectId });
    return normalizeEvent(doc);
  } catch (error) {
    console.warn('Impossible de récupérer un événement depuis MongoDB :', error);
    return readFallbackEvents().find((item) => item.id === id) || null;
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
    console.warn('Impossible de créer un événement dans MongoDB :', error);
    const events = readFallbackEvents();
    const fallbackEvent = { ...payload, id: crypto.randomUUID() };
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
    return { deletedCount: result.deletedCount || 0 };
  } catch (error) {
    console.warn('Impossible de supprimer un événement dans MongoDB :', error);
    const events = readFallbackEvents();
    const nextEvents = events.filter((event) => event.id !== id);
    const deletedCount = events.length - nextEvents.length;
    writeFallbackEvents(nextEvents);
    return { deletedCount };
  }
}
