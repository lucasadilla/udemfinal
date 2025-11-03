import { createContext, useContext, useEffect, useState } from 'react';

const MAX_ARTICLE_PAYLOAD_SIZE = 3.5 * 1024 * 1024; // ~3.5 MB to stay under the server limit

function getPayloadSize(article) {
    try {
        const json = JSON.stringify(article);
        if (typeof TextEncoder !== 'undefined') {
            return new TextEncoder().encode(json).length;
        }
        return json.length;
    } catch (error) {
        console.error('Impossible de calculer la taille du contenu de l’article :', error);
        return Infinity;
    }
}

const ArticlesContext = createContext({ articles: [], loading: true, addArticle: async () => {}, deleteArticle: async () => {} });

export function ArticlesProvider({ children }) {
    const [articles, setArticles] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchArticles = async () => {
        try {
            const res = await fetch('/api/articles');
            if (res.ok) {
                const data = await res.json();
                setArticles(data);
            } else {
                console.warn('Impossible de récupérer les articles :', res.status);
            }
        } catch (err) {
            console.error('Impossible de récupérer les articles :', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchArticles();
    }, []);

    const addArticle = async (article) => {
        try {
            const payloadSize = getPayloadSize(article);
            if (payloadSize > MAX_ARTICLE_PAYLOAD_SIZE) {
                throw new Error(
                    "L’article est trop volumineux pour être publié. Réduisez la taille des images ou le contenu avant de réessayer."
                );
            }
            const res = await fetch('/api/articles', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(article),
            });
            if (!res.ok) {
                const payload = await res.json().catch(() => ({}));
                const message = payload?.error || `Impossible d’ajouter un article : ${res.status}`;
                throw new Error(message);
            }
            await fetchArticles();
            return true;
        } catch (err) {
            console.error('Impossible d’ajouter un article :', err);
            throw err;
        }
    };

    const deleteArticle = async (id) => {
        try {
            const res = await fetch(`/api/articles?id=${id}`, { method: 'DELETE' });
            if (res.ok) {
                await fetchArticles();
            } else {
                console.warn('Impossible de supprimer l’article :', res.status);
            }
        } catch (err) {
            console.error('Impossible de supprimer l’article :', err);
        }
    };

    return (
        <ArticlesContext.Provider value={{ articles, loading, addArticle, deleteArticle }}>
            {children}
        </ArticlesContext.Provider>
    );
}

export function useArticles() {
    return useContext(ArticlesContext);
}

