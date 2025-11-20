import crypto from 'node:crypto';
import { ObjectId } from 'mongodb';
import getMongoDb from '../../lib/mongoClient';
import { readJsonFile, writeJsonFile } from '../../lib/jsonStorage';

const FALLBACK_FILE = 'home_sponsors.json';

function readFallbackSponsors() {
    return readJsonFile(FALLBACK_FILE, []);
}

function writeFallbackSponsors(items) {
    writeJsonFile(FALLBACK_FILE, items);
}

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
    let collection = null;
    try {
        const db = await getMongoDb();
        collection = db.collection('home_sponsors');
    } catch (connectionError) {
        console.warn(
            'Connexion à MongoDB indisponible pour /api/sponsors; basculement vers le stockage JSON.',
            connectionError,
        );
    }

    try {
        if (req.method === 'POST') {
            const { image } = req.body || {};
            if (!image) {
                return res.status(400).json({ error: 'Le champ image est requis.' });
            }

            if (!collection) {
                const sponsors = readFallbackSponsors();
                const newSponsor = { id: crypto.randomUUID(), image };
                sponsors.push(newSponsor);
                writeFallbackSponsors(sponsors);
                return res.status(201).json({ id: newSponsor.id });
            }

            const result = await collection.insertOne({ image });
            return res.status(201).json({ id: result.insertedId.toString() });
        }

        if (req.method === 'DELETE') {
            const { id } = req.query;
            if (!id) {
                return res.status(400).json({ error: "L’identifiant est requis." });
            }

            if (!collection) {
                const sponsors = readFallbackSponsors();
                const index = sponsors.findIndex((item) => item.id === id);
                if (index === -1) {
                    return res.status(404).json({ error: 'Commanditaire introuvable.' });
                }
                sponsors.splice(index, 1);
                writeFallbackSponsors(sponsors);
                return res.status(200).json({ ok: true });
            }

            await collection.deleteOne({ _id: new ObjectId(id) });
            return res.status(200).json({ ok: true });
        }

        if (!collection) {
            return res.status(200).json(readFallbackSponsors());
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

