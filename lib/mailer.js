import nodemailer from 'nodemailer';

let transporterPromise;

const REQUIRED_ENV_VARS = ['EMAIL_HOST', 'EMAIL_PORT', 'EMAIL_USER', 'EMAIL_PASS'];

function hasSmtpConfig() {
    return REQUIRED_ENV_VARS.every((key) => process.env[key]);
}

async function createTransporter() {
    if (process.env.EMAIL_SERVER) {
        return nodemailer.createTransport(process.env.EMAIL_SERVER);
    }

    if (!hasSmtpConfig()) {
        throw new Error(
            'Email service is not configured. Please provide EMAIL_SERVER or EMAIL_HOST, EMAIL_PORT, EMAIL_USER and EMAIL_PASS environment variables.'
        );
    }

    return nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: Number(process.env.EMAIL_PORT),
        secure: process.env.EMAIL_SECURE === 'true' || Number(process.env.EMAIL_PORT) === 465,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });
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
    const transporter = await getTransporter();
    const to = process.env.EMAIL_TO || process.env.EMAIL_USER;

    if (!to) {
        throw new Error('Destination email address is not configured. Please set EMAIL_TO or EMAIL_USER.');
    }

    return transporter.sendMail({
        from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
        to,
        subject: `Contact Form: ${objet}`,
        text: `Nom: ${nom}\nEmail: ${email}\n\n${message}`,
        replyTo: email
    });
}

export function validateEmailConfiguration() {
    try {
        if (process.env.EMAIL_SERVER) {
            return null;
        }

        if (!hasSmtpConfig()) {
            return 'Email service is not configured. Please set EMAIL_SERVER or the SMTP variables.';
        }

        if (!process.env.EMAIL_TO && !process.env.EMAIL_USER) {
            return 'Email recipient is not configured. Please set EMAIL_TO or EMAIL_USER.';
        }

        return null;
    } catch (error) {
        return error.message;
    }
}
