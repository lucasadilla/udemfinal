import { ObjectId } from 'mongodb';
import getMongoDb from '../../lib/mongoClient';

/**
 * Retrieve sponsor logos for the home page carousel from the
 * `home_sponsors` collection. Each document should contain
 * `{ image: string }` where the image is a base64-encoded data URL.
 *
 * This API route expects environment variables `MONGODB_URI` and
 * `MONGODB_DB_NAME` to be defined with the connection string and
 * database name.
 */
export default async function handler(req, res) {
    try {
        const db = await getMongoDb();
        const collection = db.collection('home_sponsors');

        if (req.method === 'POST') {
            const { image } = req.body || {};
            if (!image) {
                return res.status(400).json({ error: 'Le champ image est requis.' });
            }
            const result = await collection.insertOne({ image });
            return res.status(201).json({ id: result.insertedId.toString() });
        }

        if (req.method === 'DELETE') {
            const { id } = req.query;
            if (!id) {
                return res.status(400).json({ error: "L’identifiant est requis." });
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
        console.error('Impossible de charger les commanditaires :', err);
        res.status(500).json({ error: 'Impossible de charger les commanditaires.' });
    }
}

export const config = {
    api: {
        bodyParser: {
            sizeLimit: '8mb',
        },
    },
};

