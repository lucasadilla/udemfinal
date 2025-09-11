import { useEffect, useState } from 'react';
import { useArticles } from '../context/ArticlesContext';
import ArticleCard from '../components/ArticleCard';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import SponsorsBar from '../components/Sponsors';
import AdminLoginForm from '../components/AdminLoginForm';
import Head from 'next/head';

export default function Blog() {
    const { articles } = useArticles();
    const [posts, setPosts] = useState([]);
    const [isAdmin, setIsAdmin] = useState(false);

    useEffect(() => {
        async function load() {
            const res = await fetch('/api/posts');
            if (res.ok) {
                const data = await res.json();
                setPosts([...articles, ...data]);
            } else {
                setPosts(articles);
            }
        }
        load();
        setIsAdmin(document.cookie.includes('admin-auth=true'));
    }, [articles]);

    if (!posts || posts.length === 0) {
        return <p>No articles found</p>;
    }

    return (
        <div>
            <Head>
                <title>Blog</title>
                <meta name="description" content="Lisez des articles sur le féminisme intersectionnel et les événements communautaires à l'Université de Montréal."/>
                <meta name="keywords" content="féminisme, blog, articles, Université de Montréal, communauté"/>
            </Head>
            <Navbar/>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {posts.map((article) => (
                    <ArticleCard key={article.id || article._id} article={article} />
                ))}
            </div>
            {!isAdmin && (
                <div className="my-8">
                    <h2 className="text-xl font-bold mb-2">Admin Login</h2>
                    <AdminLoginForm />
                </div>
            )}
            <SponsorsBar />
            <Footer />
        </div>
    );
}

