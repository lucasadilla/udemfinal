import { useState } from 'react';

export default function ContactCard({ leftContent, rightContent }) {
    const [formData, setFormData] = useState({
        nom: '',
        email: '',
        objet: '',
        message: ''
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch('/api/send-email', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });
            if (response.ok) {
                alert('Email sent successfully');
            } else {
                alert('Failed to send email');
            }
        } catch (error) {
            console.error('Error sending email:', error);
            alert('An error occurred while sending the email');
        }
    };

    return (
        <div className="contact-page p-8">
            <div className="contact-card">
                <div className="left-side">
                    <h2 className="text-2xl font-bold mb-4">NOUS CONTACTER</h2>
                    <p>2900 Bd Édouard-Montpetit, Montréal, QC H3T 1J4</p>
                    <p>femmesetdroit.udem@gmail.com</p>
                </div>
                <div className="right-side">
                    <form onSubmit={handleSubmit} className="contact-form">
                        <div className="mb-4 flex flex-col items-center">
                            <label htmlFor="nom" className="block text-sm font-semibold mb-2 text-center">Nom</label>
                            <input
                                type="text"
                                id="nom"
                                name="nom"
                                value={formData.nom}
                                onChange={handleChange}
                                className="w-full p-2 border rounded"
                                placeholder="Votre nom"
                            />
                        </div>
                        <div className="mb-4 flex flex-col items-center">
                            <label htmlFor="email" className="block text-sm font-semibold mb-2 text-center">Courriel</label>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                className="w-full p-2 border rounded"
                                placeholder="Votre Courriel"
                            />
                        </div>
                        <div className="mb-4 flex flex-col items-center">
                            <label htmlFor="objet" className="block text-sm font-semibold mb-2 text-center">Objet</label>
                            <input
                                type="text"
                                id="objet"
                                name="objet"
                                value={formData.objet}
                                onChange={handleChange}
                                className="w-full p-2 border rounded"
                                placeholder="Objet de votre message"
                            />
                        </div>
                        <div className="mb-4 flex flex-col items-center">
                            <label htmlFor="message" className="block text-sm font-semibold mb-2 text-center">Message</label>
                            <textarea
                                id="message"
                                name="message"
                                value={formData.message}
                                onChange={handleChange}
                                className="w-full p-2 border rounded"
                                placeholder="Votre message"
                            />
                        </div>
                        <button type="submit" className="bg-blue-500 text-white p-2 rounded">Envoyer</button>
                    </form>
                </div>
            </div>
        </div>
    );
}

