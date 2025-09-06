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
            <div className={`rounded overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-200 ${isLarge ? 'md:flex' : ''} cursor-pointer`}>
                <img
                    src={imageSrc}
                    alt={title}
                    className={`${isLarge ? 'w-full md:w-1/3 h-48 object-cover' : 'w-full h-48 object-cover'}`}
                />
                <div className="p-4">
                    <h3 className="text-xl font-bold mb-2">{title}</h3>
                    <p className="text-gray-700 mb-4">{excerpt}</p>
                    <div className="flex items-center">
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

