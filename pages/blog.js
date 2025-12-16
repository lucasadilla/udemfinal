// Blog page displaying recent articles. Administrators can add new posts
// directly via the `ArticleForm`; removing the obsolete `AdminLoginForm`
// resolves prior build errors.
import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { useArticles } from '../context/ArticlesContext';
import ArticleCard from '../components/ArticleCard';
import Navbar from '../components/Navbar';
import Head from 'next/head';
import useAdminStatus from '../hooks/useAdminStatus';
import LoadingSpinner from '../components/LoadingSpinner';

// Lazy load components that aren't immediately needed
const ArticleForm = dynamic(() => import('../components/ArticleForm'), {
  ssr: false, // Only load on client side since it's admin-only and contains heavy TipTap editor
  loading: () => <LoadingSpinner />,
});

const Pagination = dynamic(() => import('../components/Pagination'), {
  loading: () => <div className="h-12" />, // Reserve space to prevent layout shift
});

function mergeArticles(primary = [], secondary = []) {
    const map = new Map();
    [...secondary, ...primary].forEach((item) => {
        const id = item?.id || item?._id;
        if (!id) return;
        map.set(id, item);
    });
    return Array.from(map.values());
}

const ITEMS_PER_PAGE = 20;

export default function Blog() {
    // Client-side only: Fetch data via hooks for instant page load
    const { articles: contextArticles, loading: articlesLoading, addArticle, deleteArticle } = useArticles();
    const [posts, setPosts] = useState([]);
    const [postsLoading, setPostsLoading] = useState(false);
    const isAdmin = useAdminStatus();
    const [showForm, setShowForm] = useState(false);
    const [formError, setFormError] = useState('');
    const [currentPage, setCurrentPage] = useState(1);

    // Update posts when articles load
    useEffect(() => {
        if (!articlesLoading && contextArticles.length > 0) {
            setPosts(contextArticles);
        }
    }, [contextArticles, articlesLoading]);

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

    // Calculate pagination
    const totalPages = Math.ceil(posts.length / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const paginatedPosts = posts.slice(startIndex, endIndex);

    // Reset to page 1 when posts change
    useEffect(() => {
        setCurrentPage(1);
    }, [posts.length]);

    return (
        <>
            <Head>
                <title>Blogue</title>
                <meta name="description" content="Lisez des articles sur le féminisme intersectionnel et les événements communautaires à l'Université de Montréal."/>
                <meta name="keywords" content="féminisme, blog, articles, Université de Montréal, communauté"/>
            </Head>
            <div>
                <Navbar/>
                <main>
                <h1 className="page-title text-center mb-8">Blog</h1>
                <section className="recent-articles">
                    <div className="article-cards-container">
                        {posts.length === 0 ? (
                            <p>Aucun article trouvé</p>
                        ) : (
                            paginatedPosts.map((article) => (
                                <ArticleCard
                                    key={article.id || article._id}
                                    article={article}
                                    isAdmin={isAdmin}
                                    onDelete={handleDelete}
                                />
                            ))
                        )}
                    </div>
                    {posts.length > 0 && (
                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={setCurrentPage}
                        />
                    )}
                </section>
                {isAdmin ? (
                    <section className="my-16 px-4 flex justify-center">
                        <div className="w-full max-w-5xl">
                            {showForm ? (
                                <ArticleForm
                                    errorMessage={formError}
                                    onSubmit={async (data) => {
                                        setFormError('');
                                        try {
                                            await addArticle(data);
                                            setShowForm(false);
                                        } catch (error) {
                                            setFormError(error?.message || 'Impossible de publier l’article.');
                                        }
                                    }}
                                    onCancel={() => {
                                        setFormError('');
                                        setShowForm(false);
                                    }}
                                />
                            ) : (
                                <div className="bg-gradient-to-br from-purple-50 via-white to-blue-50 border border-purple-100 rounded-3xl shadow-xl px-6 py-12 sm:px-12 text-center">
                                    <h2 className="text-3xl font-semibold text-gray-900">Créer un nouvel article</h2>
                                    <p className="mt-3 text-sm text-gray-600 max-w-2xl mx-auto">
                                        Partagez les dernières nouvelles, ressources et réussites avec la communauté. Cliquez ci-dessous pour ouvrir l’éditeur et commencer la rédaction.
                                    </p>
                                    <div className="mt-8 flex justify-center">
                                        <button
                                            className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-8 py-3 rounded-xl font-semibold shadow-md hover:from-green-600 hover:to-emerald-600 transition-colors focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                                            onClick={() => {
                                                setFormError('');
                                                setShowForm(true);
                                            }}
                                        >
                                            Commencer à écrire
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

// Client-side only: No getStaticProps for instant navigation
// Data will be fetched client-side via hooks
