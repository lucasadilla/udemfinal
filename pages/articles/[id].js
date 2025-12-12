import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import Navbar from '../../components/Navbar';
import { useArticles } from '../../context/ArticlesContext';

export default function Article() {
  const router = useRouter();
  const { id } = router.query;
  const { articles } = useArticles();
  const [post, setPost] = useState(null);
  const article = articles.find((a) => String(a.id) === id);

  useEffect(() => {
    if (!article && id) {
      fetch(`/api/articles?id=${id}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data) setPost(data);
        });
    }
  }, [article, id]);

  const currentArticle = article || post;

  if (!currentArticle) {
    return <p>Article introuvable</p>;
  }

  const handleBack = () => {
    router.back();
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
            __html: currentArticle.content.replace(/\n/g, '<br />'),
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
