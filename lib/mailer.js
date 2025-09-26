import nodemailer from 'nodemailer';

const EMAIL_SETTINGS = {
    transporter: {
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: {
            user: 'femmesetdroit.udem@gmail.com',
            pass: 'REPLACE_WITH_GMAIL_APP_PASSWORD'
        }
    },
    defaults: {
        from: 'Site Contact <femmesetdroit.udem@gmail.com>',
        to: 'femmesetdroit.udem@gmail.com'
    }
};

let transporterPromise;

function assertEmailConfigured() {
    const { transporter, defaults } = EMAIL_SETTINGS;
    const authUser = transporter?.auth?.user;
    const authPass = transporter?.auth?.pass;
    const recipient = defaults?.to || authUser;

    if (!authUser || !authPass) {
        throw new Error('Email service is not configured. Please update EMAIL_SETTINGS with working Gmail credentials.');
    }

    if (authPass.includes('REPLACE_WITH_GMAIL_APP_PASSWORD')) {
        throw new Error('Email service is not configured. Replace REPLACE_WITH_GMAIL_APP_PASSWORD with the Gmail app password.');
    }

    if (!recipient) {
        throw new Error('Email recipient is not configured. Set defaults.to in EMAIL_SETTINGS.');
    }

    return { transporter, defaults, recipient };
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
                console.warn('Unable to verify email transporter:', error.message);
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
        subject: `Contact Form: ${objet}`,
        text: `Nom: ${nom}\nEmail: ${email}\n\n${message}`,
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
