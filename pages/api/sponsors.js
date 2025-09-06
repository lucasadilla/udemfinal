import { MongoClient } from 'mongodb';

let cachedClient = null;

/**
 * Retrieve sponsors from the `sponsors` collection.
 * Each document should contain `{ name: string, image: string }`.
 *
 * This API route expects an environment variable `MONGODB_URI` to be
 * defined with the connection string to the database.
 */
export default async function handler(req, res) {
    try {
        const uri = process.env.MONGODB_URI;
        if (!uri) {
            return res.status(500).json({ error: 'MONGODB_URI not configured' });
        }

        if (!cachedClient) {
            const client = new MongoClient(uri);
            cachedClient = await client.connect();
        }

        const db = cachedClient.db();
        const sponsorDocs = await db.collection('sponsors').find({}).toArray();
        const sponsors = sponsorDocs.map(doc => ({
            id: doc._id?.toString() || doc.id,
            name: doc.name,
            image: doc.image,
        }));

        res.status(200).json(sponsors);
    } catch (err) {
        console.error('Failed to load sponsors', err);
        res.status(500).json({ error: 'Failed to load sponsors' });
    }
}

