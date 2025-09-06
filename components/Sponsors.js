import { useEffect, useState } from 'react';

/**
 * Displays a horizontally scrolling list of sponsor logos.
 * Sponsor data is loaded from the `/api/sponsors` endpoint which is expected
 * to return an array of objects with the following shape:
 * `{ id: string, name: string, image: string }` where `image` is a URL.
 */
export default function SponsorsBar() {
    const [sponsors, setSponsors] = useState([]);

    // Fetch sponsor data from the API route which pulls from the database
    useEffect(() => {
        async function loadSponsors() {
            try {
                const res = await fetch('/api/sponsors');
                if (!res.ok) {
                    throw new Error('Failed to fetch sponsors');
                }
                const data = await res.json();
                setSponsors(data);
            } catch (err) {
                console.error('Error loading sponsors:', err);
            }
        }
        loadSponsors();
    }, []);

    // Duplicate scroller items for the infinite scroll effect once sponsors load
    useEffect(() => {
        if (sponsors.length === 0) return;

        const scrollers = document.querySelectorAll('.scroller');

        if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            scrollers.forEach((scroller) => {
                scroller.setAttribute('data-animated', true);

                const scrollerInner = scroller.querySelector('.scroller__inner');
                const scrollerContent = Array.from(scrollerInner.children);

                scrollerContent.forEach((item) => {
                    const duplicatedItem = item.cloneNode(true);
                    duplicatedItem.setAttribute('aria-hidden', true);
                    scrollerInner.appendChild(duplicatedItem);
                });
            });
        }
    }, [sponsors]);

    if (sponsors.length === 0) {
        return null;
    }

    return (
        <div className="scroller" data-speed="slow">
            <div className="scroller__inner">
                {sponsors.map((sponsor) => (
                    <img
                        key={sponsor.id}
                        src={sponsor.image}
                        alt={sponsor.name}
                        className="scroller-item"
                    />
                ))}
            </div>
        </div>
    );
}

