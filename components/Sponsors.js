import { useEffect, useRef, useState } from 'react';
import useHomeSponsors from '../hooks/useHomeSponsors';
import useAdminStatus from '../hooks/useAdminStatus';

export default function SponsorsBar() {
    const { sponsors, loading, addSponsor, deleteSponsor } = useHomeSponsors();
    const isAdmin = useAdminStatus();
    const scrollerRef = useRef(null);
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

    // Setup infinite scroll with proper duplication
    useEffect(() => {
        if (sponsors.length === 0 || !scrollerRef.current) return;
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

        const scroller = scrollerRef.current;
        const content = scroller.querySelector('.sponsor-scroll-content');
        if (!content) return;

        // Remove any existing duplicates
        const duplicates = scroller.querySelectorAll('.sponsor-duplicate');
        duplicates.forEach(el => el.remove());

        // Get original items (non-duplicates)
        const originalItems = Array.from(content.children).filter(
            item => !item.classList.contains('sponsor-duplicate')
        );
        if (originalItems.length === 0) return;

        // Clone the entire set multiple times to ensure continuous content
        // We need enough content to fill the screen from the start and continue scrolling seamlessly
        // Calculate how many clones we need to fill at least 2x viewport width
        const itemWidth = 200; // width of each logo wrapper
        const gap = 64; // 4rem gap
        const itemTotalWidth = itemWidth + gap;
        const viewportWidth = window.innerWidth;
        const minClonesNeeded = Math.ceil((viewportWidth * 2) / (originalItems.length * itemTotalWidth)) + 1;
        
        // Clone enough times to ensure continuous scrolling
        for (let i = 0; i < Math.max(3, minClonesNeeded); i++) {
            originalItems.forEach((item) => {
                const clone = item.cloneNode(true);
                clone.classList.add('sponsor-duplicate');
                clone.setAttribute('aria-hidden', 'true');
                // Remove delete buttons from duplicates
                const deleteBtn = clone.querySelector('.delete-button');
                if (deleteBtn) deleteBtn.remove();
                content.appendChild(clone);
            });
        }
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
                <div className="sponsors-section">
                    <div className="sponsor-scroller" ref={scrollerRef}>
                        <div className="sponsor-scroll-content">
                            {sponsors.map((sponsor) => (
                                <div key={sponsor.id} className="sponsor-item">
                                    <div className="sponsor-logo-wrapper">
                                        <img
                                            src={sponsor.image}
                                            alt="Logo de commanditaire"
                                            className="sponsor-logo"
                                            loading="lazy"
                                        />
                                        {isAdmin && (
                                            <button
                                                onClick={() => deleteSponsor(sponsor.id)}
                                                className="delete-button"
                                                aria-label="Supprimer le logo"
                                            >
                                                &times;
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
