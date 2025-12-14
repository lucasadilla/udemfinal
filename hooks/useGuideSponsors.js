import { useEffect, useState } from 'react';

const CACHE_KEY = 'guide_sponsors_cache';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

function getCachedSponsors() {
    if (typeof window === 'undefined') return null;
    
    try {
        const cached = localStorage.getItem(CACHE_KEY);
        if (!cached) return null;
        
        const { data, timestamp } = JSON.parse(cached);
        const age = Date.now() - timestamp;
        
        if (age < CACHE_DURATION) {
            console.log(`[useGuideSponsors] Using cached sponsors (${Math.floor(age / 1000)}s old)`);
            return data;
        }
        
        return null;
    } catch (error) {
        console.warn('[useGuideSponsors] Error reading cache:', error);
        return null;
    }
}

function setCachedSponsors(data) {
    if (typeof window === 'undefined') return;
    
    try {
        const cacheData = {
            data,
            timestamp: Date.now()
        };
        localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
    } catch (error) {
        console.warn('[useGuideSponsors] Error writing cache:', error);
    }
}

// Hook managing sponsor images specifically for the Guide des Commanditaires page.
// Data is retrieved from the `/api/guide-sponsors` endpoint which persists
// images in their own collection separate from the home page carousel.
export default function useGuideSponsors() {
    const [sponsors, setSponsors] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchSponsors = async (skipCache = false) => {
        try {
            // Try to use cached data first
            if (!skipCache) {
                const cached = getCachedSponsors();
                if (cached) {
                    setSponsors(cached);
                    setLoading(false);
                    return;
                }
            }
            
            const res = await fetch('/api/guide-sponsors', {
                // Add cache headers for browser caching
                cache: 'default',
            });
            if (res.ok) {
                const data = await res.json();
                setSponsors(data);
                setCachedSponsors(data);
            } else {
                console.warn('Impossible de récupérer les commanditaires :', res.status);
            }
        } catch (err) {
            console.error('Impossible de récupérer les commanditaires :', err);
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
                await fetchSponsors(true); // Skip cache after adding
            } else {
                console.warn('Impossible d\'ajouter un commanditaire :', res.status);
            }
        } catch (err) {
            console.error('Impossible d\'ajouter un commanditaire :', err);
        }
    };

    const deleteSponsor = async (id) => {
        try {
            const res = await fetch(`/api/guide-sponsors?id=${id}`, { method: 'DELETE' });
            if (res.ok) {
                await fetchSponsors(true); // Skip cache after deleting
            } else {
                console.warn('Impossible de supprimer le commanditaire :', res.status);
            }
        } catch (err) {
            console.error('Impossible de supprimer le commanditaire :', err);
        }
    };

    return { sponsors, loading, addSponsor, deleteSponsor };
}

