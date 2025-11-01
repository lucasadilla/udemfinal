import { createContext, useContext, useEffect, useState } from 'react';

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
            const res = await fetch('/api/articles', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(article),
            });
            if (res.ok) {
                await fetchArticles();
            } else {
                console.warn('Impossible d’ajouter un article :', res.status);
            }
        } catch (err) {
            console.error('Impossible d’ajouter un article :', err);
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

