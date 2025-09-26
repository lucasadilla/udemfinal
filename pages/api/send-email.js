import { sendContactEmail, validateEmailConfiguration } from '../../lib/mailer';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        res.status(405).json({ message: 'Method Not Allowed' });
        return;
    }

    const { nom, email, objet, message } = req.body || {};

    if (!nom || !email || !objet || !message) {
        res.status(400).json({ message: 'Missing required fields' });
        return;
    }

    const configError = validateEmailConfiguration();

    if (configError) {
        res.status(500).json({ message: configError });
        return;
    }

    try {
        await sendContactEmail({ nom, email, objet, message });
        res.status(200).json({ message: 'Votre message a été envoyé avec succès.' });
    } catch (error) {
        console.error('Error sending email:', error);
        res.status(500).json({ message: "Impossible d'envoyer le courriel pour le moment." });
    }
}
