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
 *      author: { name, profilePic } or authorName/authorImage
 *    }
 *  - isLarge: optional boolean to adjust layout
 */
export default function ArticleCard({ article = {}, isLarge = false }) {
    const id = article._id || article.id;
    const imageSrc = article.image || article.imageUrl || article.coverImage || '/images/default-article.jpg';
    const title = article.title || 'Untitled';
    const content = article.content || article.body || '';
    const authorName = (article.author && article.author.name) || article.authorName || 'Unknown';
    const authorImage = (article.author && article.author.profilePic) || article.authorImage || '/images/default-avatar.png';

    const excerpt = content.length > 200 ? `${content.slice(0, 200)}...` : content;

    return (
        <Link href={`/articles/${id}`}>
            <div
                className={`bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-transform duration-200 cursor-pointer hover:scale-[1.02] ${isLarge ? 'md:flex' : ''}`}
            >
                <img
                    src={imageSrc}
                    alt={title}
                    className={`${isLarge ? 'md:w-1/3 md:h-full' : ''} w-full h-40 object-cover`}
                />
                <div className={`p-4 flex flex-col justify-between ${isLarge ? 'md:w-2/3' : ''}`}>
                    <h3 className="text-xl font-bold mb-2">{title}</h3>
                    <p className="text-gray-700 mb-4">{excerpt}</p>
                    <div className="flex items-center mt-auto">
                        <img
                            src={authorImage}
                            alt={authorName}
                            className="w-8 h-8 rounded-full mr-2 object-cover"
                        />
                        <span className="text-sm text-gray-600">{authorName}</span>
                    </div>
                </div>
            </div>
        </Link>
    );
}

