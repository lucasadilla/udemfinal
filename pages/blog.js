// Blog page displaying recent articles. Administrators can add new posts
// directly via the `ArticleForm`; removing the obsolete `AdminLoginForm`
// resolves prior build errors.
import { useMemo, useState } from 'react';
import { useArticles } from '../context/ArticlesContext';
import ArticleCard from '../components/ArticleCard';
import Navbar from '../components/Navbar';
import ArticleForm from '../components/ArticleForm';
import Head from 'next/head';
import useAdminStatus from '../hooks/useAdminStatus';
import { getArticles } from '../lib/articlesDatabase';

export default function Blog() {
    const { articles, loading, addArticle, deleteArticle } = useArticles();
    const posts = useMemo(() => articles || [], [articles]);
    const isAdmin = useAdminStatus();
    const [showForm, setShowForm] = useState(false);
    const [formError, setFormError] = useState('');

    const handleDelete = async (id) => {
        if (!id) {
            return;
        }
        await deleteArticle(id);
    };

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
                <section className="recent-articles">
                    <div className="article-cards-container">
                        {posts.length === 0 ? (
                            loading ? <p>Chargement des articles...</p> : <p>Aucun article trouvé</p>
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

export async function getStaticProps() {
    try {
        const initialArticles = await getArticles();

        return {
            props: {
                initialArticles,
            },
            revalidate: 300,
        };
    } catch (err) {
        console.error('Impossible de précharger les articles du blogue :', err);
        return {
            props: {
                initialArticles: [],
            },
            revalidate: 300,
        };
    }
}

