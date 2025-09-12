import { useEffect, useState } from 'react';

// Hook managing sponsor images specifically for the Guide des Commanditaires page.
// Data is retrieved from the `/api/guide-sponsors` endpoint which persists
// images in their own collection separate from the home page carousel.
export default function useGuideSponsors() {
    const [sponsors, setSponsors] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchSponsors = async () => {
        try {
            const res = await fetch('/api/guide-sponsors');
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
            const res = await fetch('/api/guide-sponsors', {
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
            const res = await fetch(`/api/guide-sponsors?id=${id}`, { method: 'DELETE' });
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

