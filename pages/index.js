// pages/index.js
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ContactCard from '../components/ContactCard';
import ArticleCard from '../components/ArticleCard';
import SponsorsBar from "../components/Sponsors";
import Head from 'next/head';
import React, { useEffect, useState } from "react";
import { useArticles } from '../context/ArticlesContext';
import useContent from '../hooks/useContent';
import HeroBannerEditor from '../components/HeroBannerEditor';

export default function Home() {
    const { articles, loading: articlesLoading } = useArticles();
    const { getTextContent, getImageContent, loading: contentLoading, error: contentError, updateContent } = useContent();
    const [isAdmin, setIsAdmin] = useState(false);
    
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

    useEffect(() => {
        setIsAdmin(document.cookie.includes('admin-auth=true'));
    }, []);

    // Show loading only for a reasonable time, then show content with fallbacks
    if (contentLoading && !contentError) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-xl">Loading...</div>
            </div>
        );
    }

    // If there's an error, still show the page with fallback content
    if (contentError) {
        console.warn('Content loading error, using fallback content:', contentError);
    }

    return (
        <div className="flex flex-col min-h-screen">
            <Head>
                <title>{pageTitle}</title>
                <meta name="description" content={pageDescription}/>
                <meta name="keywords" content={pageKeywords}/>
            </Head>
            <Navbar/>

            <main className="relative flex-grow">
                <div className="banner">
                    <img src={heroBanner} alt="Banner" className="w-full h-auto"/>
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
                <SponsorsBar />
            </main>

            <Footer />
        </div>
    );
}

