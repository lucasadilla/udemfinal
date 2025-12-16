import { useEffect, useState } from 'react';
import Image from 'next/image';
import useHomeSponsors from '../hooks/useHomeSponsors';
import useAdminStatus from '../hooks/useAdminStatus';

/**
 * Displays a horizontally scrolling list of sponsor logos on the home page.
 * Admin users can upload and remove images which are stored via the
 * `/api/sponsors` endpoint in the `home_sponsors` collection.
 */
export default function SponsorsBar() {
    const { sponsors, loading, addSponsor, deleteSponsor } = useHomeSponsors();
    const isAdmin = useAdminStatus();
    const [image, setImage] = useState('');

    const handleFileChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => setImage(reader.result);
        reader.readAsDataURL(file);
    };

    const handleAdd = async (e) => {
        e.preventDefault();
        if (!image) return;
        await addSponsor({ image });
        setImage('');
        // Reset file input
        e.target.reset();
    };

    // Duplicate scroller items for seamless infinite scroll effect
    useEffect(() => {
        if (sponsors.length === 0) return;
        const scroller = document.querySelector('.scroller');
        if (!scroller || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
        scroller.setAttribute('data-animated', true);
        const scrollerInner = scroller.querySelector('.scroller__inner');
        if (!scrollerInner) return;
        
        // Remove existing duplicates
        scrollerInner.querySelectorAll('[aria-hidden="true"]').forEach(el => el.remove());
        
        // Get original content
        const scrollerContent = Array.from(scrollerInner.children);
        if (scrollerContent.length === 0) return;
        
        // Duplicate the entire set multiple times for seamless infinite scrolling
        const numberOfDuplicates = 4;
        for (let i = 0; i < numberOfDuplicates; i++) {
            scrollerContent.forEach((item) => {
                const duplicatedItem = item.cloneNode(true);
                duplicatedItem.setAttribute('aria-hidden', true);
                scrollerInner.appendChild(duplicatedItem);
            });
        }
    }, [sponsors]);

    if (!isAdmin && sponsors.length === 0 && !loading) {
        return null;
    }

    return (
        <div>
            {isAdmin && (
                <div className="max-w-6xl mx-auto px-4 py-6 bg-gray-50 rounded-lg mb-6">
                    <h3 className="text-xl font-bold mb-4">Gestion des Commanditaires</h3>
                    
                    {/* Add Sponsor Form */}
                    <form onSubmit={handleAdd} className="mb-6 space-y-2">
                        <input
                            type="file"
                            accept="image/*"
                            className="border p-2 w-full rounded"
                            onChange={handleFileChange}
                        />
                        <button
                            type="submit"
                            disabled={!image}
                            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                        >
                            Ajouter un Commanditaire
                        </button>
                    </form>

                    {/* Sponsor Management Grid */}
                    {sponsors.length > 0 && (
                        <div>
                            <h4 className="text-lg font-semibold mb-3">Commanditaires actuels ({sponsors.length})</h4>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                {sponsors.map((sponsor) => (
                                    <div key={sponsor.id} className="relative border rounded-lg p-4 bg-white shadow-sm hover:shadow-md transition-shadow">
                                        <Image
                                            src={sponsor.image}
                                            alt="Logo de commanditaire"
                                            className="w-full h-24 object-contain mb-2"
                                            width={200}
                                            height={96}
                                            style={{ objectFit: 'contain' }}
                                            loading="lazy"
                                        />
                                        <button
                                            onClick={() => {
                                                if (window.confirm('Êtes-vous sûr de vouloir supprimer ce commanditaire ?')) {
                                                    deleteSponsor(sponsor.id);
                                                }
                                            }}
                                            className="w-full bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 text-sm"
                                        >
                                            Supprimer
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Public Scrolling Carousel */}
            {sponsors.length > 0 && (
                <div className="scroller" data-speed="slow">
                    <div className="scroller__inner">
                        {sponsors.map((sponsor) => (
                            <div key={sponsor.id} className="relative inline-block">
                                <Image
                                    src={sponsor.image}
                                    alt="Logo de commanditaire"
                                    className="scroller-item"
                                    width={150}
                                    height={150}
                                    style={{ objectFit: 'contain' }}
                                    loading="lazy"
                                />
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

