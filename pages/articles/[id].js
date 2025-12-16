import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import Navbar from '../../components/Navbar';
import { useArticles } from '../../context/ArticlesContext';
import LoadingSpinner from '../../components/LoadingSpinner';
import { useSWRData } from '../../hooks/useSWR';

export default function Article() {
  const router = useRouter();
  const { id } = router.query;
  const { articles, loading: articlesLoading } = useArticles();
  const [post, setPost] = useState(null);
  const [postLoading, setPostLoading] = useState(false);
  const article = articles.find((a) => String(a.id) === id);

  // Prefetch blog page for faster back navigation
  useEffect(() => {
    router.prefetch('/blog');
    router.prefetch('/');
  }, [router]);

  // Use SWR for better caching of individual articles
  // Fetch immediately without waiting for articlesLoading to avoid waterfall
  const { data: fetchedPost, isLoading: postLoadingSWR } = useSWRData(
    id ? `/api/articles?id=${id}` : null,
    {
      revalidateOnFocus: false,
      dedupingInterval: 5000, // Cache for 5 seconds
    }
  );

  useEffect(() => {
    // Always fetch full article when on detail page, even if we have it in the list
    // because list articles don't include full content
    if (id && fetchedPost) {
      setPost(fetchedPost);
    }
  }, [id, fetchedPost]);

  // Prefer the fetched post (has full content) over cached article (list view only)
  const currentArticle = post || fetchedPost || article;
  const isLoading = postLoading || postLoadingSWR || (articlesLoading && !currentArticle);

  if (isLoading) {
    return (
      <>
        <Navbar />
        <div className="flex justify-center items-center min-h-screen">
          <LoadingSpinner />
        </div>
      </>
    );
  }

  if (!currentArticle) {
    return (
      <>
        <Navbar />
        <div className="flex justify-center items-center min-h-screen">
          <p>Article introuvable</p>
        </div>
      </>
    );
  }

  const handleBack = (e) => {
    e.preventDefault();
    // Use window.history.back() for instant navigation, or fallback to blog page
    // This is faster than router.back() which may wait for page revalidation
    if (window.history.length > 1) {
      window.history.back();
    } else {
      router.push('/blog');
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator
        .share({
          title: currentArticle.title,
          text: currentArticle.content.substring(0, 100) + '...',
          url: window.location.href,
        })
        .then(() => {
          console.log("Article partagé avec succès");
        })
        .catch((error) => {
          console.error("Erreur lors du partage de l’article :", error);
        });
    } else {
      console.log("L’API de partage Web n’est pas prise en charge par ce navigateur");
    }
  };

  return (
    <>
      <div>
        <Navbar />
        <div className="article-container">
          <button onClick={handleBack} className="back-button">
            ← Retour
          </button>
          <main className="article-page article-box">
            <h1 className="article-title font-bold mb-4">{currentArticle.title}</h1>

        <div className="flex items-center mb-4">
          <Image
            src={currentArticle.authorImage}
            alt={currentArticle.author}
            width={60}
            height={60}
            className="author-image"
          />
          <div className="ml-2 author-details">
            <p className="text-sm text-gray-600 author-date">{currentArticle.date}</p>
            <p className="text-sm font-semibold author-name">{currentArticle.author}</p>
          </div>
        </div>

        <div
          className="article-content"
          dangerouslySetInnerHTML={{
            __html: (currentArticle.content || currentArticle.body || '').replace(/\n/g, '<br />'),
          }}
        />
            <button onClick={handleShare} className="share-button">
              Partagez cet article
            </button>
          </main>
        </div>
      </div>
    </>
  );
}
