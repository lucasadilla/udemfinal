import { sendContactEmail, validateEmailConfiguration } from '../../lib/mailer';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        res.status(405).json({ message: 'Méthode non autorisée.' });
        return;
    }

    const { nom, email, objet, message } = req.body || {};

    if (!nom || !email || !objet || !message) {
        res.status(400).json({ message: 'Champs obligatoires manquants.' });
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
        console.error("Erreur lors de l'envoi du courriel :", error);

        if (error?.code === 'EAUTH' || error?.responseCode === 535) {
            res.status(500).json({
                message:
                    'La connexion au serveur de courriel a échoué. Vérifiez le nom d’utilisateur et le mot de passe d’application Gmail configurés.'
            });
            return;
        }

        res.status(500).json({ message: "Impossible d'envoyer le courriel pour le moment." });
    }
}
