import { useEffect, useState } from 'react';
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
    };

    // Duplicate scroller items for the infinite scroll effect once sponsors load
    useEffect(() => {
        if (sponsors.length === 0) return;
        const scroller = document.querySelector('.scroller');
        if (!scroller || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
        scroller.setAttribute('data-animated', true);
        const scrollerInner = scroller.querySelector('.scroller__inner');
        // Remove existing duplicates
        scrollerInner.querySelectorAll('[aria-hidden="true"]').forEach(el => el.remove());
        const scrollerContent = Array.from(scrollerInner.children);
        scrollerContent.forEach((item) => {
            const duplicatedItem = item.cloneNode(true);
            duplicatedItem.setAttribute('aria-hidden', true);
            duplicatedItem.querySelector('.delete-button')?.remove();
            scrollerInner.appendChild(duplicatedItem);
        });
    }, [sponsors]);

    if (!isAdmin && sponsors.length === 0 && !loading) {
        return null;
    }

    return (
        <div>
            {isAdmin && (
                <form onSubmit={handleAdd} className="mb-4 space-y-2">
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
            {sponsors.length > 0 && (
                <div className="scroller" data-speed="slow">
                    <div className="scroller__inner">
                        {sponsors.map((sponsor) => (
                            <div key={sponsor.id} className="relative inline-block">
                                <img
                                    src={sponsor.image}
                                    alt="Logo de commanditaire"
                                    className="scroller-item"
                                />
                                {isAdmin && (
                                    <button
                                        onClick={() => deleteSponsor(sponsor.id)}
                                        className="delete-button absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded"
                                    >
                                        &times;
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

