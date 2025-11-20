import { useRouter } from 'next/router';
import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Navbar from '../../components/Navbar';
import { useArticles } from '../../context/ArticlesContext';
import { getArticleById, getArticles } from '../../lib/articlesDatabase';

export default function Article() {
  const router = useRouter();
  const { id } = router.query;
  const { articles, loading } = useArticles();
  const [post, setPost] = useState(null);
  const article = useMemo(() => articles.find((a) => String(a.id) === id), [articles, id]);

  useEffect(() => {
    if (!article && id && !loading) {
      fetch(`/api/articles?id=${id}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data) setPost(data);
        });
    }
  }, [article, id, loading]);

  const currentArticle = article || post;

  if (!currentArticle && loading) {
    return <p>Chargement de l’article...</p>;
  }

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
        <main className="article-page article-box">
          <button onClick={handleBack} className="back-button">
            ← Retour
          </button>
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
    </>
  );
}

export async function getStaticPaths() {
  try {
    const articles = await getArticles();
    const paths = articles.map((article) => ({
      params: { id: String(article.id || article._id) },
    }));
    return {
      paths,
      fallback: 'blocking',
    };
  } catch (err) {
    console.error('Impossible de générer les chemins statiques pour les articles :', err);
    return {
      paths: [],
      fallback: 'blocking',
    };
  }
}

export async function getStaticProps({ params }) {
  try {
    const article = await getArticleById(params?.id);
    if (!article) {
      return {
        notFound: true,
      };
    }
    return {
      props: {
        initialArticles: [article],
      },
      revalidate: 300,
    };
  } catch (err) {
    console.error('Impossible de charger l\'article côté serveur :', err);
    return {
      props: {
        initialArticles: [],
      },
      revalidate: 300,
    };
  }
}
