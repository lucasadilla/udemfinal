import Link from 'next/link';

/**
 * Displays a preview of an article. Clicking the card navigates to the full article.
 *
 * Props:
 *  - article: {
 *      _id or id,
 *      title,
 *      content/body,
 *      image/imageUrl/coverImage,
 *      author: { name, profilePic } or authorName/authorImage,
 *      date
 *    }
 */
export default function ArticleCard({ article = {} }) {
    const id = article._id || article.id;
    const imageSrc = article.image || article.imageUrl || article.coverImage || '/images/default-article.jpg';
    const title = article.title || 'Untitled';
    const content = article.content || article.body || '';
    const authorName = (article.author && article.author.name) || article.authorName || 'Unknown';
    const authorImage = (article.author && article.author.profilePic) || article.authorImage || '/images/default-avatar.png';
    const date = article.date || '';

    const excerpt = content.length > 100 ? `${content.slice(0, 100)}...` : content;

    return (
        <Link href={`/articles/${id}`}>
            <div className="max-w-sm mx-auto bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-transform duration-200 cursor-pointer hover:scale-[1.02]">
                <img src={imageSrc} alt={title} className="w-full h-24 object-cover" />
                <div className="p-4">
                    <h3 className="text-lg font-semibold mb-2">{title}</h3>
                    <p className="text-gray-700 text-sm mb-4">{excerpt}</p>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center">
                            <img
                                src={authorImage}
                                alt={authorName}
                                className="w-8 h-8 rounded-full mr-2 object-cover"
                            />
                            <span className="text-sm text-gray-600">{authorName}</span>
                        </div>
                        {date && <span className="text-xs text-gray-500">{date}</span>}
                    </div>
                </div>
            </div>
        </Link>
    );
}

