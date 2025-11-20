// pages/index.js
import Navbar from '../components/Navbar';
import ContactCard from '../components/ContactCard';
import ArticleCard from '../components/ArticleCard';
import Head from 'next/head';
import React from "react";
import { useArticles } from '../context/ArticlesContext';
import useContent from '../hooks/useContent';
import HeroBannerEditor from '../components/HeroBannerEditor';
import LoadingSpinner from '../components/LoadingSpinner';
import useAdminStatus from '../hooks/useAdminStatus';
import { getArticles } from '../lib/articlesDatabase';
import getMongoDb from '../lib/mongoClient';

export default function Home({ initialArticles, initialContent }) {
    const { articles } = useArticles();
    const { getTextContent, getImageContent, loading: contentLoading, error: contentError, updateContent } = useContent();
    const isAdmin = useAdminStatus();
    
    // Use initial data if available, otherwise fall back to context/hooks
    const displayArticles = initialArticles && initialArticles.length > 0 ? initialArticles : articles;
    const topThreeArticles = displayArticles ? displayArticles.slice(0, 3) : [];
    
    // Use initial content if available
    const content = initialContent || {};
    const getInitialTextContent = (section, subsection, key, fallback = '') => {
        return content?.[section]?.[subsection]?.[key] ?? fallback;
    };
    const getInitialImageContent = (section, subsection, key, fallback = '') => {
        return content?.[section]?.[subsection]?.[key] ?? fallback;
    };
    
    // Prefer initial content, fall back to hook
    const heroTitle = getInitialTextContent('home', 'hero', 'hero_title') || getTextContent('home', 'hero', 'hero_title', 'FEMMES & DROIT');
    const heroSubtitle = getInitialTextContent('home', 'hero', 'hero_subtitle') || getTextContent('home', 'hero', 'hero_subtitle', 'Promotion du féminisme intersectionnel auprès de la communauté étudiante de l\'Université de Montréal');
    const heroBanner = getInitialImageContent('home', 'hero', 'hero_banner') || getImageContent('home', 'hero', 'hero_banner', '/images/front.jpg');
    const recentArticlesTitle = getInitialTextContent('home', 'articles', 'recent_articles_title') || getTextContent('home', 'articles', 'recent_articles_title', 'Articles Récents');
    const pageTitle = getInitialTextContent('home', 'meta', 'page_title') || getTextContent('home', 'meta', 'page_title', 'Accueil');
    const pageDescription = getInitialTextContent('home', 'meta', 'page_description') || getTextContent('home', 'meta', 'page_description', 'Femme & Droit - Promotion du féminisme intersectionnel auprès de la communauté étudiante de l\'Université de Montréal.');
    const pageKeywords = getInitialTextContent('home', 'meta', 'page_keywords') || getTextContent('home', 'meta', 'page_keywords', 'féminisme, intersectionnalité, Université de Montréal, communauté, féminisme étudiant');

    // Show loading only if we don't have initial data and content is still loading
    if (!initialContent && contentLoading && !contentError) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <LoadingSpinner />
            </div>
        );
    }

    // If there's an error, still show the page with fallback content
    if (contentError) {
        console.warn('Erreur lors du chargement du contenu, utilisation du contenu de secours :', contentError);
    }

    return (
        <>
            <Head>
                <title>{pageTitle}</title>
                <meta name="description" content={pageDescription}/>
                <meta name="keywords" content={pageKeywords}/>
            </Head>
            <div>
                <Navbar/>

                <main className="relative">
                    <div className="banner">
                        <img src={heroBanner} alt="Bannière" className="w-full h-auto"/>
                        <div className="banner-text-box">
                            <h1 className="text-4xl text-center text-white">{heroTitle}</h1>
                            <h2 className="text-4xl text-center text-white mt-4">{heroSubtitle}</h2>
                        </div>
                    </div>
                    {isAdmin && (
                        <div className="max-w-6xl mx-auto px-4">
                            <HeroBannerEditor updateContent={updateContent} />
                        </div>
                    )}
                    <section className="recent-articles">
                        <h2 className="text-2xl text-center mt-8 mb-4">{recentArticlesTitle}</h2>
                        <div className="article-cards-container">
                            {topThreeArticles.map((article) => (
                                <ArticleCard key={article._id || article.id} article={article} />
                            ))}
                        </div>
                    </section>
                    <ContactCard />
                </main>
            </div>
        </>
    );
}

export async function getStaticProps() {
    try {
        // Fetch articles and content in parallel
        const [articles, contentDoc] = await Promise.all([
            getArticles().catch(() => []),
            (async () => {
                try {
                    const db = await getMongoDb();
                    const collection = db.collection('content');
                    const doc = await collection.findOne({ _id: 'content' }) || {};
                    const { _id, ...data } = doc;
                    return data;
                } catch (err) {
                    console.error('Error fetching content:', err);
                    return {};
                }
            })()
        ]);

        return {
            props: {
                initialArticles: articles || [],
                initialContent: contentDoc || {},
            },
            // Revalidate every 60 seconds - page will be regenerated in background if data changes
            revalidate: 60,
        };
    } catch (error) {
        console.error('Error in getStaticProps:', error);
        return {
            props: {
                initialArticles: [],
                initialContent: {},
            },
            revalidate: 60,
        };
    }
}

