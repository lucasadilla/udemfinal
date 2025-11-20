const fs = require('fs');
const os = require('os');
const path = require('path');
const { MongoClient } = require('mongodb');

function loadEnvFileIfNeeded(filePath) {
  if (process.env.MONGODB_URI || !fs.existsSync(filePath)) {
    return;
  }

  const content = fs.readFileSync(filePath, 'utf8');
  content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'))
    .forEach((line) => {
      const [rawKey, ...rawValueParts] = line.split('=');
      if (!rawKey || rawValueParts.length === 0) {
        return;
      }
      const key = rawKey.trim();
      const rawValue = rawValueParts.join('=').trim();
      const unwrapped = rawValue.replace(/^"|"$/g, '').replace(/^'|'$/g, '');
      if (key && !process.env[key]) {
        process.env[key] = unwrapped;
      }
    });
}

function deriveDbName(uri) {
  if (!uri) return '';
  try {
    const url = new URL(uri);
    return url.pathname.replace(/^\//, '').split('/')[0].split('?')[0];
  } catch (error) {
    return '';
  }
}

function removeFallbackFiles() {
  const candidates = [
    path.join(process.cwd(), 'data', 'users.json'),
    path.join(os.tmpdir(), 'udemfinal-data', 'users.json'),
  ];

  candidates.forEach((filePath) => {
    try {
      if (fs.existsSync(filePath)) {
        fs.rmSync(filePath, { force: true });
        console.log(`Removed fallback file: ${filePath}`);
      }
    } catch (error) {
      console.warn(`Unable to remove fallback file at ${filePath}:`, error.message);
    }
  });
}

async function seedUsers() {
  loadEnvFileIfNeeded(path.join(process.cwd(), '.env.local'));

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('Missing MONGODB_URI. Set it in the environment or .env.local.');
  }

  const dbName = process.env.MONGODB_DB_NAME || deriveDbName(uri) || 'udem';
  const client = new MongoClient(uri);

  const seedData = [
    {
      title: 'Présidente',
      name: 'Camille Bouchard',
      profilePicture: '/images/user-placeholder.svg',
    },
    {
      title: 'Vice-présidente',
      name: 'Sara Tremblay',
      profilePicture: '/images/user-placeholder.svg',
    },
    {
      title: 'Responsable des communications',
      name: 'Leïla Fortin',
      profilePicture: '/images/user-placeholder.svg',
    },
  ];

  await client.connect();
  const db = client.db(dbName);
  const collection = db.collection('users');

  await collection.deleteMany({});
  const insertResult = await collection.insertMany(seedData);

  console.log(`Inserted ${insertResult.insertedCount} user documents into ${dbName}.users.`);
  await client.close();
  removeFallbackFiles();
}

seedUsers()
  .then(() => {
    console.log('User collection seeded successfully.');
  })
  .catch((error) => {
    console.error('Unable to seed users:', error.message);
    process.exitCode = 1;
  });
