import { useState } from 'react';

export default function ContactCard({ leftContent, rightContent }) {
    const [formData, setFormData] = useState({
        nom: '',
        email: '',
        objet: '',
        message: ''
    });
    const [status, setStatus] = useState({ type: null, message: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setStatus({ type: null, message: '' });
        try {
            const response = await fetch('/api/send-email', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });
            const data = await response.json().catch(() => ({ message: 'Une erreur est survenue.' }));

            if (!response.ok) {
                setStatus({
                    type: 'error',
                    message: data?.message || 'Échec de l\'envoi du courriel.'
                });
                return;
            }

            setFormData({ nom: '', email: '', objet: '', message: '' });
            setStatus({ type: 'success', message: data?.message || 'Votre message a été envoyé avec succès.' });
        } catch (error) {
            console.error('Error sending email:', error);
            setStatus({ type: 'error', message: error.message || 'Une erreur est survenue lors de l\'envoi du courriel.' });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <section className="contact-page">
            <div className="contact-card">
                <div className="left-side">
                    <h2 className="text-2xl font-bold mb-4">NOUS CONTACTER</h2>
                    <p>2900 Bd Édouard-Montpetit, Montréal, QC H3T 1J4</p>
                    <p>femmesetdroit.udem@gmail.com</p>
                </div>
                <div className="right-side">
                    <form onSubmit={handleSubmit} className="contact-form">
                        <div className="mb-4 flex flex-col items-center gap-2 md:items-start">
                            <label htmlFor="nom" className="block text-sm font-semibold text-center md:text-left">Nom</label>
                            <input
                                type="text"
                                id="nom"
                                name="nom"
                                value={formData.nom}
                                onChange={handleChange}
                                className="w-full p-2 border rounded"
                                placeholder="Votre nom"
                                required
                            />
                        </div>
                        <div className="mb-4 flex flex-col items-center gap-2 md:items-start">
                            <label htmlFor="email" className="block text-sm font-semibold text-center md:text-left">Courriel</label>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                className="w-full p-2 border rounded"
                                placeholder="Votre Courriel"
                                required
                            />
                        </div>
                        <div className="mb-4 flex flex-col items-center gap-2 md:items-start">
                            <label htmlFor="objet" className="block text-sm font-semibold text-center md:text-left">Objet</label>
                            <input
                                type="text"
                                id="objet"
                                name="objet"
                                value={formData.objet}
                                onChange={handleChange}
                                className="w-full p-2 border rounded"
                                placeholder="Objet de votre message"
                                required
                            />
                        </div>
                        <div className="mb-4 flex flex-col items-center gap-2 md:items-start">
                            <label htmlFor="message" className="block text-sm font-semibold text-center md:text-left">Message</label>
                            <textarea
                                id="message"
                                name="message"
                                value={formData.message}
                                onChange={handleChange}
                                className="w-full p-2 border rounded"
                                placeholder="Votre message"
                                rows="4"
                                required
                            />
                        </div>
                        <button
                            type="submit"
                            className="bg-blue-500 text-white p-2 rounded disabled:opacity-60 disabled:cursor-not-allowed self-center md:self-start"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? 'Envoi...' : 'Envoyer'}
                        </button>
                        {status.message && (
                            <p
                                className={`mt-4 text-center ${status.type === 'success' ? 'text-green-600' : 'text-red-600'}`}
                                role="status"
                            >
                                {status.message}
                            </p>
                        )}
                    </form>
                </div>
            </div>
        </section>
    );
}

