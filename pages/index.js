// pages/index.js
import Navbar from '../components/Navbar';
import ArticleCard from '../components/ArticleCard';
import Head from 'next/head';
import React, { useState, useEffect } from "react";
import dynamic from 'next/dynamic';
import Image from 'next/image';
import { useArticles } from '../context/ArticlesContext';
import useContent from '../hooks/useContent';
import LoadingSpinner from '../components/LoadingSpinner';
import useAdminStatus from '../hooks/useAdminStatus';
// Lazy load ContactCard since it's below the fold and uses client-side hooks
const ContactCard = dynamic(() => import('../components/ContactCard'), {
  ssr: false, // Prevent SSR to avoid hydration issues with client-side hooks
  loading: () => <div className="min-h-[200px]" />, // Reserve space to prevent layout shift
});

const HeroBannerEditor = dynamic(() => import('../components/HeroBannerEditor'), {
  ssr: false, // Only load on client side since it's admin-only
});

export default function Home() {
    // Client-side only: Fetch data via hooks for instant page load
    const { articles: contextArticles, loading: articlesLoading } = useArticles();
    const { getTextContent: swrGetTextContent, getImageContent: swrGetImageContent, error: contentError, updateContent } = useContent();
    const isAdmin = useAdminStatus();
    
    // Use articles from context
    const articles = contextArticles || [];
    
    // Use SWR content directly
    const getTextContent = (section, subsection, key, fallback = '') => {
        return swrGetTextContent(section, subsection, key, fallback);
    };
    
    const getImageContent = (section, subsection, key, fallback = '') => {
        return swrGetImageContent(section, subsection, key, fallback);
    };
    
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

    // Show minimal loading state - page renders immediately
    const isLoading = articlesLoading;

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
                    <div className="banner" style={{ position: 'relative', width: '100%', height: '700px' }}>
                        <Image 
                          src={heroBanner} 
                          alt="Bannière" 
                          fill
                          style={{ objectFit: 'cover' }}
                          priority
                          sizes="100vw"
                        />
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
                            {topThreeArticles.length > 0 ? (
                                topThreeArticles.map((article) => (
                                    <ArticleCard key={article._id || article.id} article={article} />
                                ))
                            ) : null}
                        </div>
                    </section>
                    <ContactCard />
                </main>
            </div>
        </>
    );
}

// Client-side only: No getStaticProps for instant navigation
// Data will be fetched client-side via hooks
