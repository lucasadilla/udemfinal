import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { estimateBase64Size, MAX_FORM_BASE64_SIZE } from '../lib/clientImageUtils';

const MAX_ARTICLE_PAYLOAD_SIZE = 6 * 1024 * 1024; // Allow larger payloads while staying under server-side 24 MB cap
const DEDUPING_INTERVAL = 2 * 60 * 1000; // 2 minutes between identical fetches

const ARTICLES_CACHE = {
    data: null,
    timestamp: 0,
    inFlight: null,
};

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

function updateArticleCache(nextArticles) {
    ARTICLES_CACHE.data = nextArticles;
    ARTICLES_CACHE.timestamp = Date.now();
}

async function fetchArticlesFromApi(signal) {
    const res = await fetch('/api/articles', { signal });
    if (!res.ok) {
        throw new Error(`Impossible de récupérer les articles : ${res.status}`);
    }
    return res.json();
}

async function getCachedArticles({ force = false, signal } = {}) {
    const now = Date.now();
    if (!force && ARTICLES_CACHE.data && now - ARTICLES_CACHE.timestamp < DEDUPING_INTERVAL) {
        return ARTICLES_CACHE.data;
    }

    if (ARTICLES_CACHE.inFlight) {
        return ARTICLES_CACHE.inFlight;
    }

    ARTICLES_CACHE.inFlight = fetchArticlesFromApi(signal)
        .then((data) => {
            updateArticleCache(data);
            return data;
        })
        .catch((error) => {
            if (ARTICLES_CACHE.data) {
                return ARTICLES_CACHE.data;
            }
            throw error;
        })
        .finally(() => {
            ARTICLES_CACHE.inFlight = null;
        });

    return ARTICLES_CACHE.inFlight;
}

export function ArticlesProvider({ children, initialArticles = [] }) {
    const [articles, setArticles] = useState(initialArticles);
    const [loading, setLoading] = useState(!initialArticles || initialArticles.length === 0);
    const abortController = useRef(null);

    useEffect(() => {
        if (initialArticles?.length) {
            updateArticleCache(initialArticles);
        }
    }, [initialArticles]);

    useEffect(() => {
        let isMounted = true;
        abortController.current = new AbortController();

        const loadArticles = async () => {
            try {
                const data = await getCachedArticles({ force: !initialArticles?.length, signal: abortController.current.signal });
                if (isMounted) {
                    setArticles(data);
                }
            } catch (err) {
                console.error('Impossible de récupérer les articles :', err);
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        const revalidateInBackground = async () => {
            try {
                const data = await getCachedArticles({ force: true, signal: abortController.current.signal });
                if (isMounted) {
                    setArticles(data);
                }
            } catch (err) {
                console.error('Impossible de revalider les articles :', err);
            }
        };

        loadArticles();
        const revalidationTimer = setInterval(revalidateInBackground, DEDUPING_INTERVAL);

        return () => {
            isMounted = false;
            if (abortController.current) {
                abortController.current.abort();
            }
            clearInterval(revalidationTimer);
        };
    }, [initialArticles]);

    const applyMutationToCache = (updater) => {
        setArticles((current) => {
            const updated = updater(current || []);
            updateArticleCache(updated);
            return updated;
        });
    };

    const revalidateArticles = async () => {
        try {
            const data = await getCachedArticles({ force: true, signal: abortController.current?.signal });
            setArticles(data);
        } catch (err) {
            console.error('Impossible de mettre à jour le cache des articles :', err);
        }
    };

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
            const payload = await res.json().catch(() => ({}));
            const newArticle = {
                ...sanitizedArticle,
                id: payload?.id || sanitizedArticle.id || String(Date.now()),
            };

            applyMutationToCache((current) => {
                const merged = [newArticle, ...(current || [])];
                const deduped = new Map();
                merged.forEach((item) => {
                    const key = item?.id || item?._id;
                    if (!key) return;
                    deduped.set(String(key), item);
                });
                return Array.from(deduped.values());
            });

            revalidateArticles();
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
                applyMutationToCache((current) => (current || []).filter((article) => {
                    const articleId = article?.id || article?._id;
                    return String(articleId) !== String(id);
                }));
                revalidateArticles();
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
