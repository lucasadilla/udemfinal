import Navbar from "../components/Navbar";
import Footer from '../components/Footer';
import Head from "next/head";
import React, { useEffect, useState } from "react";
import SponsorsBar from "../components/Sponsors";
import ArticleCard from "../components/ArticleCard";
import ArticleForm from "../components/ArticleForm";
import useArticles from "../hooks/useArticles";
import useUsers from "../hooks/useUsers";

export default function Blog() {
  const { articles, loading, addArticle, deleteArticle } = useArticles();
  const { users } = useUsers();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    setIsAdmin(document.cookie.includes('admin-auth=true'));
  }, []);

  return (
    <div>
      <Head>
        <title>Blog</title>
        <meta name="description" content="Articles et nouvelles" />
      </Head>
      <Navbar />
      <main className="p-8">
        <h1 className="page-title text-center mb-8">BLOG</h1>

        {loading ? (
          <p>Loading...</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {articles.map((article) => (
              <div key={article.id} className="relative">
                <ArticleCard article={article} />
                {isAdmin && (
                  <button
                    onClick={() => deleteArticle(article.id)}
                    className="absolute top-2 right-2 bg-red-600 text-white px-2 py-1 rounded"
                  >
                    Supprimer
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {isAdmin && (
          <div className="mt-12 max-w-3xl mx-auto">
            <h2 className="text-xl font-semibold text-center mb-4">Ajouter un article</h2>
            <ArticleForm onSubmit={addArticle} onCancel={() => {}} users={users} />
          </div>
        )}

        <SponsorsBar />
      </main>
      <Footer />
    </div>
  );
}
