import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Head from 'next/head';
import AdminLoginForm from '../components/AdminLoginForm';
import useSponsors from '../hooks/useSponsors';

export default function GuidePage() {
    const { sponsors, loading, addSponsor, deleteSponsor } = useSponsors();
    const [selectedSponsor, setSelectedSponsor] = useState(null);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isAdmin, setIsAdmin] = useState(false);
    const [image, setImage] = useState('');

    useEffect(() => {
        setIsAdmin(document.cookie.includes('admin-auth=true'));
    }, []);

    const openModal = (index) => {
        setSelectedSponsor(sponsors[index]);
        setCurrentIndex(index);
    };

    const closeModal = () => {
        setSelectedSponsor(null);
        setCurrentIndex(0);
    };

    const nextImage = () => {
        if (sponsors.length === 0) return;
        const nextIndex = (currentIndex + 1) % sponsors.length;
        setSelectedSponsor(sponsors[nextIndex]);
        setCurrentIndex(nextIndex);
    };

    const prevImage = () => {
        if (sponsors.length === 0) return;
        const prevIndex = (currentIndex - 1 + sponsors.length) % sponsors.length;
        setSelectedSponsor(sponsors[prevIndex]);
        setCurrentIndex(prevIndex);
    };

    const handleFileChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
            setImage(reader.result);
        };
        reader.readAsDataURL(file);
    };

    const handleAdd = async (e) => {
        e.preventDefault();
        if (!image) return;
        await addSponsor({ image });
        setImage('');
    };

    return (
        <div>
            <Head>
                <title>Guide des Commanditaires</title>
                <meta
                    name="description"
                    content="Découvrez notre guide des commanditaires avec toutes les images en aperçu."
                />
                <meta
                    name="keywords"
                    content="commanditaires, guide, partenaires, photos, féminisme, Université de Montréal"
                />
            </Head>
            <Navbar />
            <main className="p-8">
                <h1 className="page-title text-center mb-8">Guide des Commanditaires</h1>
                {isAdmin && (
                    <form onSubmit={handleAdd} className="mb-8 space-y-2">
                        <input
                            type="file"
                            accept="image/*"
                            className="border p-2 w-full"
                            onChange={handleFileChange}
                        />
                        <button
                            type="submit"
                            className="bg-blue-600 text-white px-4 py-2 rounded"
                        >
                            Ajouter
                        </button>
                    </form>
                )}
                <div className="sponsor-gallery">
                    {loading ? (
                        <p>Loading...</p>
                    ) : (
                        sponsors.map((sponsor, index) => (
                            <div key={sponsor.id} className="relative inline-block">
                                <img
                                    src={sponsor.image}
                                    alt="Sponsor"
                                    className="sponsor-image rounded-lg cursor-pointer hover:shadow-lg"
                                    onClick={() => openModal(index)}
                                />
                                {isAdmin && (
                                    <button
                                        onClick={() => deleteSponsor(sponsor.id)}
                                        className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded"
                                    >
                                        &times;
                                    </button>
                                )}
                            </div>
                        ))
                    )}
                </div>
                {!isAdmin && (
                    <div className="my-8 text-center">
                        <h2 className="text-xl font-bold mb-2">Admin Login</h2>
                        <AdminLoginForm />
                    </div>
                )}
                {selectedSponsor && (
                    <div className="modal">
                        <div className="modal-content">
                            <img
                                src={selectedSponsor.image}
                                alt="Sponsor"
                                className="modal-image"
                            />
                            <button className="close" onClick={closeModal}>
                                &times;
                            </button>
                            <button className="prev" onClick={prevImage}>
                                &lt;
                            </button>
                            <button className="next" onClick={nextImage}>
                                &gt;
                            </button>
                        </div>
                    </div>
                )}
            </main>
            <Footer />
        </div>
    );
}

