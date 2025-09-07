import { MongoClient, ObjectId } from 'mongodb';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import Head from 'next/head';

export default function ArticlePage({ article }) {
  if (!article) {
    return (
      <div>
        <Navbar />
        <main className="p-8">
          <p>Article not found.</p>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div>
      <Head>
        <title>{article.title}</title>
      </Head>
      <Navbar />
      <main className="max-w-3xl mx-auto p-8">
        <h1 className="text-3xl font-bold mb-4">{article.title}</h1>
        <div className="flex items-center mb-4">
          {article.authorImage && (
            <img
              src={article.authorImage}
              alt={article.author}
              className="w-10 h-10 rounded-full mr-2 object-cover"
            />
          )}
          <span className="text-sm text-gray-600">{article.author}</span>
          <span className="ml-2 text-sm text-gray-500">{article.date}</span>
        </div>
        {article.image && (
          <img
            src={article.image}
            alt={article.title}
            className="mb-4 w-full max-h-96 object-cover rounded"
          />
        )}
        <p className="whitespace-pre-wrap">{article.content}</p>
      </main>
      <Footer />
    </div>
  );
}

export async function getServerSideProps({ params }) {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    return { props: { article: null } };
  }
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db();
  const doc = await db.collection('articles').findOne({ _id: new ObjectId(params.id) });
  await client.close();
  if (!doc) {
    return { props: { article: null } };
  }
  const article = {
    id: doc._id.toString(),
    title: doc.title,
    content: doc.content,
    author: doc.author,
    authorImage: doc.authorImage,
    image: doc.image,
    date: doc.date,
  };
  return { props: { article } };
}
