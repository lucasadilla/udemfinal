import crypto from 'node:crypto';
import { ObjectId } from 'mongodb';
import getMongoDb from './mongoClient';
import { readJsonFile, writeJsonFile } from './jsonStorage';

const FALLBACK_FILE = 'events.json';

let fallbackCache = [];
let fallbackCacheLoaded = false;

function isReadOnlyFileSystemError(error) {
  return error?.code === 'EACCES' || error?.code === 'EROFS' || error?.code === 'EPERM';
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

function loadFallbackEvents() {
  if (!fallbackCacheLoaded) {
    fallbackCache = readJsonFile(FALLBACK_FILE, []);
    fallbackCacheLoaded = true;
  }
  return fallbackCache.map((event) => normalizeEvent(event)).filter(Boolean);
}

function persistFallbackEvents(nextEvents) {
  fallbackCache = nextEvents;
  fallbackCacheLoaded = true;
  try {
    writeJsonFile(FALLBACK_FILE, nextEvents);
  } catch (error) {
    if (isReadOnlyFileSystemError(error)) {
      console.warn(
        'Système de fichiers en lecture seule détecté; les événements ajoutés seront conservés uniquement en mémoire.',
      );
      return;
    }
    throw error;
  }
}

function sortEvents(list) {
  return [...list].sort((a, b) => {
    if (a?.date === b?.date) {
      return (b?.createdAt || '').localeCompare(a?.createdAt || '');
    }
    return (a?.date || '').localeCompare(b?.date || '');
  });
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
    return sortEvents(loadFallbackEvents());
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
      return loadFallbackEvents().find((event) => event.id === id) || null;
    }

    const doc = await collection.findOne({ _id: objectId });
    return normalizeEvent(doc);
  } catch (error) {
    console.error("Impossible de récupérer l'événement depuis MongoDB :", error);
    return loadFallbackEvents().find((event) => event.id === id) || null;
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
    console.error("Impossible d’enregistrer l’événement dans MongoDB :", error);
    const fallbackEvent = { ...payload, id: crypto.randomUUID() };
    const events = sortEvents([...loadFallbackEvents(), fallbackEvent]);
    persistFallbackEvents(events);
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
      objectId = null;
    }

    if (!objectId) {
      return { deletedCount: 0 };
    }

    const result = await collection.deleteOne({ _id: objectId });
    return { deletedCount: result.deletedCount || 0 };
  } catch (error) {
    console.error("Impossible de supprimer l’événement dans MongoDB :", error);
    const events = loadFallbackEvents();
    const index = events.findIndex((event) => event.id === id);
    if (index === -1) {
      return { deletedCount: 0 };
    }
    const nextEvents = [...events];
    nextEvents.splice(index, 1);
    persistFallbackEvents(nextEvents);
    return { deletedCount: 1 };
  }
}
