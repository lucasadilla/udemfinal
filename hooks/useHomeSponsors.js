import { useEffect, useState } from 'react';

// Hook for managing sponsor images displayed on the home page carousel.
// Communicates with the `/api/sponsors` endpoint which stores images in the
// `home_sponsors` collection.
export default function useHomeSponsors() {
    const [sponsors, setSponsors] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchSponsors = async () => {
        try {
            const res = await fetch('/api/sponsors');
            if (res.ok) {
                const data = await res.json();
                setSponsors(data);
            } else {
                console.warn('Failed to fetch sponsors:', res.status);
            }
        } catch (err) {
            console.error('Failed to fetch sponsors:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSponsors();
    }, []);

    const addSponsor = async (sponsor) => {
        try {
            const res = await fetch('/api/sponsors', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(sponsor),
            });
            if (res.ok) {
                await fetchSponsors();
            } else {
                console.warn('Failed to add sponsor:', res.status);
            }
        } catch (err) {
            console.error('Failed to add sponsor:', err);
        }
    };

    const deleteSponsor = async (id) => {
        try {
            const res = await fetch(`/api/sponsors?id=${id}`, { method: 'DELETE' });
            if (res.ok) {
                await fetchSponsors();
            } else {
                console.warn('Failed to delete sponsor:', res.status);
            }
        } catch (err) {
            console.error('Failed to delete sponsor:', err);
        }
    };

    return { sponsors, loading, addSponsor, deleteSponsor };
}

