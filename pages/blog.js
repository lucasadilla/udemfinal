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
                    <section className="my-16 px-4 flex justify-center">
                        <div className="w-full max-w-5xl">
                            {showForm ? (
                                <ArticleForm
                                    onSubmit={async (data) => {
                                        await addArticle(data);
                                        setShowForm(false);
                                    }}
                                    onCancel={() => setShowForm(false)}
                                />
                            ) : (
                                <div className="bg-gradient-to-br from-purple-50 via-white to-blue-50 border border-purple-100 rounded-3xl shadow-xl px-6 py-12 sm:px-12 text-center">
                                    <h2 className="text-3xl font-semibold text-gray-900">Create New Article</h2>
                                    <p className="mt-3 text-sm text-gray-600 max-w-2xl mx-auto">
                                        Share the latest news, resources, and success stories with the community. Click below to open the editor and start writing.
                                    </p>
                                    <div className="mt-8 flex justify-center">
                                        <button
                                            className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-8 py-3 rounded-xl font-semibold shadow-md hover:from-green-600 hover:to-emerald-600 transition-colors focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                                            onClick={() => setShowForm(true)}
                                        >
                                            Start Writing
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </section>
                ) : null}
                </main>
            </div>
        </>
    );
}

