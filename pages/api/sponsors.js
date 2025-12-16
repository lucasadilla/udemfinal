import crypto from 'node:crypto';
import { ObjectId } from 'mongodb';
import getMongoDb from '../../lib/mongoClient';
import { readJsonFile, writeJsonFile } from '../../lib/jsonStorage';

const FALLBACK_FILE = 'home_sponsors.json';

function getFallbackSponsors() {
  return readJsonFile(FALLBACK_FILE, []);
}

function setFallbackSponsors(sponsors) {
  return writeJsonFile(FALLBACK_FILE, sponsors);
}

/**
 * Retrieve sponsor logos for the home page carousel from the
 * `home_sponsors` collection. Each document should contain
 * `{ image: string }` where the image is a base64-encoded data URL.
 *
 * Falls back to JSON storage if MongoDB is not configured.
 */
export default async function handler(req, res) {
    try {
        const db = await getMongoDb();
        
        if (db) {
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
                    return res.status(400).json({ error: "L'identifiant est requis." });
                }
                await collection.deleteOne({ _id: new ObjectId(id) });
                return res.status(200).json({ ok: true });
            }

            // Cache for 5 minutes, revalidate in background
            res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');
            
            const sponsorDocs = await collection.find({}).toArray();
            const sponsors = sponsorDocs.map(doc => ({
                id: doc._id?.toString() || doc.id,
                image: doc.image,
            }));

            return res.status(200).json(sponsors);
        } else {
            // Fallback to JSON storage
            if (req.method === 'POST') {
                const { image } = req.body || {};
                if (!image) {
                    return res.status(400).json({ error: 'Le champ image est requis.' });
                }
                const sponsors = getFallbackSponsors();
                const newSponsor = {
                    id: crypto.randomUUID(),
                    image,
                };
                sponsors.push(newSponsor);
                setFallbackSponsors(sponsors);
                return res.status(201).json({ id: newSponsor.id });
            }

            if (req.method === 'DELETE') {
                const { id } = req.query;
                if (!id) {
                    return res.status(400).json({ error: "L'identifiant est requis." });
                }
                const sponsors = getFallbackSponsors();
                const index = sponsors.findIndex(s => s.id === id);
                if (index === -1) {
                    return res.status(404).json({ error: 'Commanditaire introuvable.' });
                }
                sponsors.splice(index, 1);
                setFallbackSponsors(sponsors);
                return res.status(200).json({ ok: true });
            }

            // Cache for 5 minutes, revalidate in background
            res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');
            
            const sponsors = getFallbackSponsors();
            return res.status(200).json(sponsors);
        }
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

