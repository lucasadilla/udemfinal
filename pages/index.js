// pages/index.js
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ContactCard from '../components/ContactCard';
import ArticleCard from '../components/ArticleCard';
import SponsorsBar from "../components/Sponsors";
import AdminLoginForm from '../components/AdminLoginForm';
import Head from 'next/head';
import React, { useEffect, useState } from "react";
import Link from 'next/link';
import useArticles from '../hooks/useArticles';
import useContent from '../hooks/useContent';

export default function Home() {
    const { articles, loading: articlesLoading } = useArticles();
    const { getTextContent, getImageContent, loading: contentLoading, error: contentError } = useContent();
    const [isAdmin, setIsAdmin] = useState(false);
    
    // Get dynamic content with fallbacks
    const heroTitle = getTextContent('home', 'hero', 'hero_title', 'FEMMES & DROIT');
    const heroSubtitle = getTextContent('home', 'hero', 'hero_subtitle', 'Promotion du féminisme intersectionnel auprès de la communauté étudiante de l\'Université de Montréal');
    const heroBanner = getImageContent('home', 'hero', 'hero_banner', '/images/front.jpg');
    const recentArticlesTitle = getTextContent('home', 'articles', 'recent_articles_title', 'Articles Récents');
    
    // Admin panel content
    const adminPanelTitle = getTextContent('home', 'admin', 'admin_panel_title', 'Admin Panel');
    const adminPanelSubtitle = getTextContent('home', 'admin', 'admin_panel_subtitle', 'You\'re logged in as an administrator');
    const manageHomeContentButton = getTextContent('home', 'admin', 'manage_home_content_button', 'Manage Home Content');
    const fullDashboardButton = getTextContent('home', 'admin', 'full_dashboard_button', 'Full Dashboard');
    const adminAccessTitle = getTextContent('home', 'admin', 'admin_access_title', 'Admin Access');
    const adminAccessDescription = getTextContent('home', 'admin', 'admin_access_description', 'Administrators can edit and manage the home page content from here.');
    
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
        <div>
            <Head>
                <title>{pageTitle}</title>
                <meta name="description" content={pageDescription}/>
                <meta name="keywords" content={pageKeywords}/>
            </Head>
            <Navbar/>
            
            {/* Admin Section */}
            {isAdmin && (
                <div className="bg-blue-50 border-b border-blue-200 py-4">
                    <div className="max-w-6xl mx-auto px-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-lg font-semibold text-blue-800">{adminPanelTitle}</h2>
                                <p className="text-blue-600 text-sm">{adminPanelSubtitle}</p>
                            </div>
                            <div className="flex space-x-3">
                                <Link 
                                    href="/admin-dashboard?page=home" 
                                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                    {manageHomeContentButton}
                                </Link>
                                <Link 
                                    href="/admin-dashboard" 
                                    className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
                                >
                                    {fullDashboardButton}
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            
            <main className="relative">
                <div className="banner">
                    <img src={heroBanner} alt="Banner" className="w-full h-auto"/>
                    <div className="banner-text-box">
                        <h1 className="text-4xl text-center text-white">{heroTitle}</h1>
                        <h2 className="text-4xl text-center text-white mt-4">{heroSubtitle}</h2>
                    </div>
                </div>
                <section className="recent-articles">
                    <h2 className="text-2xl text-center mt-8 mb-4">{recentArticlesTitle}</h2>
                    <div className="article-cards-container">
                        {topThreeArticles.map((article) => (
                            <ArticleCard key={article._id || article.id} article={article} isLarge={false} />
                        ))}
                    </div>
                </section>
                <ContactCard />
                <SponsorsBar />
            </main>
            
            {/* Admin Login for Non-Admins */}
            {!isAdmin && (
                <div className="max-w-6xl mx-auto px-4 py-8">
                    <div className="bg-gray-50 rounded-lg p-6">
                        <h2 className="text-xl font-bold mb-4 text-center">{adminAccessTitle}</h2>
                        <p className="text-gray-600 text-center mb-4">
                            {adminAccessDescription}
                        </p>
                        <div className="max-w-md mx-auto">
                            <AdminLoginForm />
                        </div>
                    </div>
                </div>
            )}
            
            <Footer />
        </div>
    );
}

