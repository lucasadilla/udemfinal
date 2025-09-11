import { useState, useEffect } from 'react';
import useUsers from '@/hooks/useUsers';
import RichTextEditor from '@/components/RichTextEditor';

export default function ArticleForm({ article, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    author: '',
    authorImage: '',
    image: '',
    date: new Date().toISOString().split('T')[0]
  });
  const { users } = useUsers();

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

  const handleAuthorChange = (e) => {
    const selectedName = e.target.value;
    const selectedUser = users.find(u => u.name === selectedName);
    setFormData(prev => ({
      ...prev,
      author: selectedName,
      authorImage: selectedUser ? selectedUser.profilePicture : ''
    }));
  };

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setFormData(prev => ({ ...prev, image: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl shadow-lg p-6 max-w-3xl mx-auto">
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
              name="author"
              value={formData.author}
              onChange={handleAuthorChange}
              className="border border-gray-300 p-2 rounded w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="">Select author</option>
              {users.map(user => (
                <option key={user.id} value={user.name}>{user.name}</option>
              ))}
            </select>
            {formData.authorImage && (
              <img
                src={formData.authorImage}
                alt="Author preview"
                className="w-12 h-12 rounded-full object-cover mt-2"
              />
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Cover Image
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="border border-gray-300 p-2 rounded w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          {formData.image && (
            <img
              src={formData.image}
              alt="Article preview"
              className="w-20 h-20 object-cover rounded mt-2"
            />
          )}
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
          <RichTextEditor
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
