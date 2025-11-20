import { ObjectId } from 'mongodb';
import getMongoDb from '../../lib/mongoClient';
import { deleteJsonFile } from '../../lib/jsonStorage';

const FALLBACK_FILE = 'guide_sponsors.json';

/**
 * Retrieve sponsors for the Guide des Commanditaires page from the
 * `guide_sponsors` collection. Each document should contain
 * `{ image: string }` where the image is a base64-encoded data URL.
 *
 * This API route expects environment variables `MONGODB_URI` and
 * `MONGODB_DB_NAME` to be defined with the connection string and
 * database name. JSON fallback storage has been removed; the MongoDB
 * collection is now required so local files like `guide_sponsors.json`
 * should be cleaned up to avoid confusion.
 */
export default async function handler(req, res) {
    let collection = null;
    try {
        const db = await getMongoDb();
        collection = db.collection('guide_sponsors');
        deleteJsonFile(FALLBACK_FILE);
    } catch (connectionError) {
        console.error(
            'Connexion à MongoDB requise pour /api/guide-sponsors.',
            connectionError,
        );
        return res.status(503).json({ error: 'Connexion MongoDB requise pour charger les commanditaires.' });
    }

    try {
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

