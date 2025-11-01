import nodemailer from 'nodemailer';

const CONTACT_EMAIL_USER = process.env.CONTACT_EMAIL_USER?.trim() || 'femmesetdroit.udem@gmail.com';
const CONTACT_EMAIL_PASS = process.env.CONTACT_EMAIL_PASS?.trim();
const CONTACT_EMAIL_TO = process.env.CONTACT_EMAIL_TO?.trim();
const CONTACT_EMAIL_FROM = process.env.CONTACT_EMAIL_FROM?.trim();

const EMAIL_SETTINGS = {
    transporter: {
        host: process.env.CONTACT_EMAIL_HOST?.trim() || 'smtp.gmail.com',
        port: Number(process.env.CONTACT_EMAIL_PORT || 465),
        secure: process.env.CONTACT_EMAIL_SECURE === 'false' ? false : true,
        auth: {
            user: CONTACT_EMAIL_USER,
            pass: CONTACT_EMAIL_PASS
        }
    },
    defaults: {
        from: CONTACT_EMAIL_FROM,
        to: CONTACT_EMAIL_TO
    }
};

let transporterPromise;

function assertEmailConfigured() {
    const { transporter, defaults } = EMAIL_SETTINGS;
    const authUser = transporter?.auth?.user?.trim();
    const authPass = transporter?.auth?.pass?.trim();
    const recipient = (defaults?.to || authUser)?.trim();
    const fromAddress = defaults?.from?.trim() || (authUser ? `Contact du site <${authUser}>` : undefined);

    if (!authUser) {
        throw new Error('Le service de courriel n’est pas configuré. Définissez la variable CONTACT_EMAIL_USER.');
    }

    if (!authPass) {
        throw new Error('Le service de courriel n’est pas configuré. Définissez la variable CONTACT_EMAIL_PASS.');
    }

    if (!recipient) {
        throw new Error('Le destinataire du courriel n’est pas configuré. Définissez CONTACT_EMAIL_TO ou CONTACT_EMAIL_USER.');
    }

    return {
        transporter: {
            ...transporter,
            auth: { user: authUser, pass: authPass }
        },
        defaults: {
            from: fromAddress,
            to: recipient
        },
        recipient,
        fromAddress
    };
}

async function createTransporter() {
    const { transporter } = assertEmailConfigured();
    return nodemailer.createTransport(transporter);
}

async function getTransporter() {
    if (!transporterPromise) {
        transporterPromise = createTransporter().then(async (transporter) => {
            try {
                await transporter.verify();
            } catch (error) {
                console.warn('Impossible de vérifier le service de courriel :', error.message);
            }
            return transporter;
        });
    }
    return transporterPromise;
}

export async function sendContactEmail({ nom, email, objet, message }) {
    const { defaults, recipient } = assertEmailConfigured();
    const transporter = await getTransporter();

    return transporter.sendMail({
        from: defaults?.from || EMAIL_SETTINGS.transporter.auth.user,
        to: recipient,
        subject: `Formulaire de contact : ${objet}`,
        text: `Nom : ${nom}\nCourriel : ${email}\n\n${message}`,
        replyTo: email
    });
}

export function validateEmailConfiguration() {
    try {
        assertEmailConfigured();
        return null;
    } catch (error) {
        return error.message;
    }
}
