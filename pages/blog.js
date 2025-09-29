// Blog page displaying recent articles. Administrators can add new posts
// directly via the `ArticleForm`; removing the obsolete `AdminLoginForm`
// resolves prior build errors.
import { useEffect, useState } from 'react';
import { useArticles } from '../context/ArticlesContext';
import ArticleCard from '../components/ArticleCard';
import Navbar from '../components/Navbar';
import ArticleForm from '../components/ArticleForm';
import Head from 'next/head';

function mergeArticles(primary = [], secondary = []) {
    const map = new Map();
    [...secondary, ...primary].forEach((item) => {
        const id = item?.id || item?._id;
        if (!id) return;
        map.set(id, item);
    });
    return Array.from(map.values());
}

export default function Blog() {
    const { articles, addArticle, deleteArticle } = useArticles();
    const [posts, setPosts] = useState([]);
    const [isAdmin, setIsAdmin] = useState(false);
    const [showForm, setShowForm] = useState(false);

    useEffect(() => {
        async function load() {
            const res = await fetch('/api/posts');
            if (res.ok) {
                const data = await res.json();
                setPosts(mergeArticles(articles, data));
            } else {
                setPosts(articles);
            }
        }
        load();
        setIsAdmin(document.cookie.includes('admin-auth=true'));
    }, [articles]);

    const handleDelete = async (id) => {
        if (!id) {
            return;
        }
        await deleteArticle(id);
        setPosts((prev) => prev.filter((article) => {
            const articleId = article?.id || article?._id;
            return articleId !== id;
        }));
    };

    return (
        <>
            <Head>
                <title>Blog</title>
                <meta name="description" content="Lisez des articles sur le féminisme intersectionnel et les événements communautaires à l'Université de Montréal."/>
                <meta name="keywords" content="féminisme, blog, articles, Université de Montréal, communauté"/>
            </Head>
            <div>
                <Navbar/>
                <main>
                <section className="recent-articles">
                    <div className="article-cards-container">
                        {posts.length === 0 ? (
                            <p>No articles found</p>
                        ) : (
                            posts.map((article) => (
                                <ArticleCard
                                    key={article.id || article._id}
                                    article={article}
                                    isAdmin={isAdmin}
                                    onDelete={handleDelete}
                                />
                            ))
                        )}
                    </div>
                </section>
                {isAdmin ? (
                    <div className="my-8">
                        {showForm ? (
                            <ArticleForm
                                onSubmit={async (data) => {
                                    await addArticle(data);
                                    setShowForm(false);
                                }}
                                onCancel={() => setShowForm(false)}
                            />
                        ) : (
                            <button
                                className="bg-green-500 text-white px-4 py-2 rounded"
                                onClick={() => setShowForm(true)}
                            >
                                Add Article
                            </button>
                        )}
                    </div>
                ) :
                null}
                </main>
            </div>
        </>
    );
}

