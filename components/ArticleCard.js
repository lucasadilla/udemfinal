import Link from 'next/link';

/**
 * Displays a preview of an article with an image, title, excerpt and author information.
 * Clicking the card navigates to the full article.
 *
 * Props:
 *  - article: {
 *      _id or id,
 *      title,
 *      content/body,
 *      image/imageUrl/coverImage,
 *      author or { name, profilePic } or authorName/authorImage,
 *      date,
 *      category/tag
 *    }
 *  - isLarge: renders a larger variant of the card when true
 */
export default function ArticleCard({ article = {}, isLarge = false }) {
    const id = article._id || article.id;
    const imageSrc =
        article.image ||
        article.imageUrl ||
        article.coverImage ||
        'https://placehold.co/600x400';
    const title = article.title || 'Untitled';
    const content = article.content || article.body || '';
    const authorName = article.author || (article.author && article.author.name) || article.authorName || 'Unknown';
    const authorImage =
         article.authorImage || (article.author && article.author.profilePic) ||
        'https://placehold.co/40';
    const date = article.date || '';
    const category = article.category || article.tag || '';

    const excerpt = content.length > 120 ? `${content.slice(0, 120)}...` : content;

    const cardWidth = isLarge ? 'w-80' : 'w-64';
    const imageHeight = isLarge ? 'h-48' : 'h-40';

    return (
        <Link href={`/articles/${id}`}>
            <article
                className={`${cardWidth} bg-white rounded-xl shadow-md overflow-hidden cursor-pointer transition-transform duration-200 hover:shadow-lg hover:-translate-y-1`}
            >
                <div className={`relative w-full ${imageHeight} overflow-hidden rounded-t-xl`}>
                    <img src={imageSrc} alt={title} className="absolute inset-0 w-full h-full object-cover" />
                    {category && (
                        <span className="absolute top-2 left-2 bg-blue-600 text-white text-xs font-medium px-3 py-1 rounded-full">
                            {category}
                        </span>
                    )}
                </div>
                <div className="p-5">
                    <h3 className="text-lg font-semibold mb-2">{title}</h3>
                    <p className="text-gray-600 text-sm mb-4">{excerpt}</p>
                    <div className="flex items-center">
                        <img
                            src={authorImage}
                            alt={authorName}
                            className="w-8 h-8 rounded-full mr-2 object-cover"
                        />
                        <div className="text-sm">
                            <p className="text-gray-900 leading-none">{authorName}</p>
                            {date && <p className="text-gray-500 text-xs">{date}</p>}
                        </div>
                    </div>
                </div>
            </article>
        </Link>
    );
}

