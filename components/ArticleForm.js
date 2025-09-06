import { useEffect, useState } from 'react';

/**
 * Form to create or edit an article.
 * Requires a list of users to select the author from.
 */
export default function ArticleForm({ article, onSubmit, onCancel, users = [] }) {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    authorId: '',
    image: '',
    images: [],
    date: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    if (article) {
      setFormData({
        title: article.title || '',
        content: article.content || '',
        authorId: article.authorId || '',
        image: article.image || '',
        images: article.images || [],
        date: article.date || new Date().toISOString().split('T')[0],
      });
    }
  }, [article]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleMainImage = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData(prev => ({ ...prev, image: reader.result.toString() }));
    };
    reader.readAsDataURL(file);
  };

  const handleImages = (e) => {
    const files = Array.from(e.target.files || []);
    Promise.all(
      files.map(file => new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result.toString());
        reader.onerror = reject;
        reader.readAsDataURL(file);
      }))
    ).then(images => {
      setFormData(prev => ({ ...prev, images }));
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const author = users.find(u => u.id === formData.authorId);
    onSubmit({
      title: formData.title,
      content: formData.content,
      authorId: formData.authorId,
      authorName: author?.name || '',
      authorImage: author?.profilePicture || '',
      image: formData.image,
      images: formData.images,
      date: formData.date,
    });
  };

  const selectedAuthor = users.find(u => u.id === formData.authorId);

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h3 className="text-xl font-semibold mb-4">
        {article ? 'Edit Article' : 'Create New Article'}
      </h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Article Title *
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="border border-gray-300 p-2 rounded w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter article title"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Author *
            </label>
            <select
              name="authorId"
              value={formData.authorId}
              onChange={handleChange}
              className="border border-gray-300 p-2 rounded w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="">Select author</option>
              {users.map(user => (
                <option key={user.id} value={user.id}>{user.name}</option>
              ))}
            </select>
            {selectedAuthor && (
              <div className="flex items-center mt-2">
                <img
                  src={selectedAuthor.profilePicture}
                  alt={selectedAuthor.name}
                  className="w-8 h-8 rounded-full mr-2 object-cover"
                />
                <span className="text-sm text-gray-600">{selectedAuthor.name}</span>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Main Image
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleMainImage}
              className="border border-gray-300 p-2 rounded w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            {formData.image && (
              <img
                src={formData.image}
                alt="Main"
                className="w-20 h-20 object-cover rounded mt-2"
              />
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Additional Images
            </label>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleImages}
              className="border border-gray-300 p-2 rounded w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            {formData.images.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.images.map((img, idx) => (
                  <img key={idx} src={img} alt={`img-${idx}`} className="w-12 h-12 object-cover rounded" />
                ))}
              </div>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Publication Date *
          </label>
          <input
            type="date"
            name="date"
            value={formData.date}
            onChange={handleChange}
            className="border border-gray-300 p-2 rounded w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Article Content *
          </label>
          <textarea
            name="content"
            value={formData.content}
            onChange={handleChange}
            className="border border-gray-300 p-2 rounded w-full h-32 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Write your article content here..."
            required
          />
          <p className="text-sm text-gray-500 mt-1">
            {formData.content.length} characters
          </p>
        </div>

        <div className="flex space-x-3 pt-4">
          <button
            type="submit"
            className="bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600 transition-colors focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
          >
            {article ? 'Update Article' : 'Create Article'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600 transition-colors focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
