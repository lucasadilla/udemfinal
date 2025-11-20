import getMongoDb from './mongoClient';

export async function fetchContentFromDb() {
  const db = await getMongoDb();
  const collection = db.collection('content');
  const doc = (await collection.findOne({ _id: 'content' })) || {};
  const { _id, ...data } = doc;
  return data;
}

export async function updateContentField(section, subsection, key, value) {
  const db = await getMongoDb();
  const collection = db.collection('content');
  const path = `${section}.${subsection}.${key}`;

  await collection.updateOne(
    { _id: 'content' },
    { $set: { [path]: value } },
    { upsert: true }
  );

  return fetchContentFromDb();
}
