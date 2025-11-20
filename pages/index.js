// pages/index.js
import Navbar from '../components/Navbar';
import ContactCard from '../components/ContactCard';
import ArticleCard from '../components/ArticleCard';
import Head from 'next/head';
import React from "react";
import { useArticles } from '../context/ArticlesContext';
import useContent from '../hooks/useContent';
import HeroBannerEditor from '../components/HeroBannerEditor';
import useAdminStatus from '../hooks/useAdminStatus';
import { fetchContentFromDb } from '../lib/contentService';

export default function Home({ initialContent }) {
    const { articles } = useArticles();
    const { getTextContent, getImageContent, error: contentError, updateContent, revalidating } = useContent(initialContent);
    const isAdmin = useAdminStatus();
    
    // Get dynamic content with fallbacks
    const heroTitle = getTextContent('home', 'hero', 'hero_title', 'FEMMES & DROIT');
    const heroSubtitle = getTextContent('home', 'hero', 'hero_subtitle', 'Promotion du féminisme intersectionnel auprès de la communauté étudiante de l\'Université de Montréal');
    const heroBanner = getImageContent('home', 'hero', 'hero_banner', '/images/front.jpg');
    const recentArticlesTitle = getTextContent('home', 'articles', 'recent_articles_title', 'Articles Récents');
    
    
    // Meta information
    const pageTitle = getTextContent('home', 'meta', 'page_title', 'Accueil');
    const pageDescription = getTextContent('home', 'meta', 'page_description', 'Femme & Droit - Promotion du féminisme intersectionnel auprès de la communauté étudiante de l\'Université de Montréal.');
    const pageKeywords = getTextContent('home', 'meta', 'page_keywords', 'féminisme, intersectionnalité, Université de Montréal, communauté, féminisme étudiant');

    const topThreeArticles = articles ? articles.slice(0, 3) : [];

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
                        {revalidating && (
                            <p className="text-center text-sm text-gray-600">Mise à jour du contenu...</p>
                        )}
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
        const initialContent = await fetchContentFromDb();

        return {
            props: {
                initialContent,
            },
            revalidate: 300,
        };
    } catch (err) {
        console.error('Échec du chargement du contenu statique :', err);
        return {
            props: {
                initialContent: {},
            },
            revalidate: 300,
        };
    }
}

