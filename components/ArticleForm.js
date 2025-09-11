import { useState, useEffect } from 'react';
import Tiptap from './Tiptap';

export default function ArticleForm({ article, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    author: '',
    authorImage: '',
    image: '',
    date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    if (article) {
      setFormData({
        title: article.title || '',
        content: article.content || '',
        author: article.author || '',
        authorImage: article.authorImage || '',
        image: article.image || '',
        date: article.date || new Date().toISOString().split('T')[0]
      });
    }
  }, [article]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

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
              Author Name *
            </label>
            <input
              type="text"
              name="author"
              value={formData.author}
              onChange={handleChange}
              className="border border-gray-300 p-2 rounded w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter author name"
              required
            />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Author Image URL
            </label>
            <input
              type="text"
              name="authorImage"
              value={formData.authorImage}
              onChange={handleChange}
              className="border border-gray-300 p-2 rounded w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., /images/author.jpg"
            />
            {formData.authorImage && (
              <img 
                src={formData.authorImage} 
                alt="Author preview" 
                className="w-12 h-12 rounded-full object-cover mt-2"
              />
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Article Image URL
            </label>
            <input
              type="text"
              name="image"
              value={formData.image}
              onChange={handleChange}
              className="border border-gray-300 p-2 rounded w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., /images/article.jpg"
            />
            {formData.image && (
              <img 
                src={formData.image} 
                alt="Article preview" 
                className="w-20 h-20 object-cover rounded mt-2"
              />
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
          <Tiptap
            value={formData.content}
            onChange={(val) =>
              setFormData((prev) => ({
                ...prev,
                content: val,
              }))
            }
          />
          <p className="text-sm text-gray-500 mt-1">
            {formData.content.replace(/<[^>]*>/g, '').length} characters
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
