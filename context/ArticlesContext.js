import { createContext, useContext, useEffect, useState } from 'react';
import { estimateBase64Size, MAX_FORM_BASE64_SIZE } from '../lib/clientImageUtils';

const MAX_ARTICLE_PAYLOAD_SIZE = 6 * 1024 * 1024; // Allow larger payloads while staying under server-side 24 MB cap

function sanitizeArticleForSubmission(article) {
    if (!article || typeof article !== 'object') {
        return {};
    }

    const { authorImage, ...rest } = article;

    const sanitized = {
        ...rest,
        authorId: rest.authorId ? String(rest.authorId) : '',
        image: rest.image || '',
    };

    if (!sanitized.authorId) {
        delete sanitized.authorId;
    }

    return sanitized;
}

function getPayloadSize(article) {
    try {
        const json = JSON.stringify(article);
        if (typeof Blob !== 'undefined') {
            return new Blob([json]).size;
        }
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
            const sanitizedArticle = sanitizeArticleForSubmission(article);
            const payloadSize = getPayloadSize(sanitizedArticle);
            if (payloadSize > MAX_ARTICLE_PAYLOAD_SIZE) {
                const sizeMb = (payloadSize / (1024 * 1024)).toFixed(1);
                const limitMb = (MAX_ARTICLE_PAYLOAD_SIZE / (1024 * 1024)).toFixed(1);
                throw new Error(
                    `L’article est trop volumineux (${sizeMb} Mo). Réduisez la taille des images ou le contenu avant de réessayer (limite ${limitMb} Mo).`
                );
            }

            const coverImageSize = estimateBase64Size(sanitizedArticle.image);
            if (coverImageSize > MAX_FORM_BASE64_SIZE) {
                const sizeMb = (coverImageSize / (1024 * 1024)).toFixed(1);
                const limitMb = (MAX_FORM_BASE64_SIZE / (1024 * 1024)).toFixed(1);
                throw new Error(
                    `L’image de couverture est trop volumineuse (${sizeMb} Mo). Réessayez avec une image plus petite que ${limitMb} Mo.`
                );
            }
            const res = await fetch('/api/articles', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(sanitizedArticle),
            });
            if (!res.ok) {
                const payload = await res.json().catch(() => ({}));
                if (res.status === 413) {
                    throw new Error(
                        "Le serveur a rejeté l’article car il dépasse la taille maximale autorisée. Réduisez la taille des images ou du contenu avant de réessayer."
                    );
                }
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

