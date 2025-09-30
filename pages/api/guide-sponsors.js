import { ObjectId } from 'mongodb';
import getMongoDb from '../../lib/mongoClient';

/**
 * Retrieve sponsors for the Guide des Commanditaires page from the
 * `guide_sponsors` collection. Each document should contain
 * `{ image: string }` where the image is a base64-encoded data URL.
 *
 * This API route expects environment variables `MONGODB_URI` and
 * `MONGODB_DB_NAME` to be defined with the connection string and
 * database name.
 */
export default async function handler(req, res) {
    try {
        const db = await getMongoDb();
        const collection = db.collection('guide_sponsors');

        if (req.method === 'POST') {
            const { image } = req.body || {};
            if (!image) {
                return res.status(400).json({ error: 'image is required' });
            }
            const result = await collection.insertOne({ image });
            return res.status(201).json({ id: result.insertedId.toString() });
        }

        if (req.method === 'DELETE') {
            const { id } = req.query;
            if (!id) {
                return res.status(400).json({ error: 'id is required' });
            }
            await collection.deleteOne({ _id: new ObjectId(id) });
            return res.status(200).json({ ok: true });
        }

        const sponsorDocs = await collection.find({}).toArray();
        const sponsors = sponsorDocs.map(doc => ({
            id: doc._id?.toString() || doc.id,
            image: doc.image,
        }));

        res.status(200).json(sponsors);
    } catch (err) {
        console.error('Failed to load sponsors', err);
        res.status(500).json({ error: 'Failed to load sponsors' });
    }
}

export const config = {
    api: {
        bodyParser: {
            sizeLimit: '8mb',
        },
    },
};

