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
                console.warn('Failed to fetch articles:', res.status);
            }
        } catch (err) {
            console.error('Failed to fetch articles:', err);
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
                console.warn('Failed to add article:', res.status);
            }
        } catch (err) {
            console.error('Failed to add article:', err);
        }
    };

    const deleteArticle = async (id) => {
        try {
            const res = await fetch(`/api/articles?id=${id}`, { method: 'DELETE' });
            if (res.ok) {
                await fetchArticles();
            } else {
                console.warn('Failed to delete article:', res.status);
            }
        } catch (err) {
            console.error('Failed to delete article:', err);
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

