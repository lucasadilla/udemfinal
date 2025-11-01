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
    <div className="bg-white/90 backdrop-blur rounded-3xl shadow-xl border border-purple-100 p-8 sm:p-10 max-w-4xl mx-auto">
      <div className="text-center">
        <h3 className="text-3xl font-semibold text-gray-900">
          {article ? 'Modifier l’article' : 'Créer un nouvel article'}
        </h3>
        <p className="mt-2 text-sm text-gray-500">
          Remplissez les informations ci-dessous afin de partager une nouvelle histoire avec la communauté.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="mt-8 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Titre de l’article *
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="border border-gray-200 h-12 px-4 rounded-xl w-full text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
              placeholder="Saisissez le titre de l’article"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Autrice ou auteur *
            </label>
            <select
              name="author"
              value={formData.author}
              onChange={handleAuthorChange}
              className="border border-gray-200 h-12 px-4 rounded-xl w-full text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
              required
            >
              <option value="">Sélectionnez une autrice ou un auteur</option>
              {users.map(user => (
                <option key={user.id} value={user.name}>{user.name}</option>
              ))}
            </select>
            {/* Author preview removed as per new requirements */}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Image de couverture
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="border border-dashed border-gray-300 w-full rounded-xl bg-white px-4 py-4 text-sm text-gray-600 hover:border-blue-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          {/* Article preview removed as per new requirements */}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Date de publication *
          </label>
          <input
            type="date"
            name="date"
            value={formData.date}
            onChange={handleChange}
            className="border border-gray-200 h-12 px-4 rounded-xl w-full text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Contenu de l’article *
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
            {formData.content.replace(/<[^>]*>/g, '').length} caractères
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-6">
          <button
            type="submit"
            className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-8 py-3 rounded-xl font-semibold shadow-md hover:from-green-600 hover:to-emerald-600 transition-colors focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
          >
            {article ? 'Mettre à jour l’article' : 'Publier l’article'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="bg-gray-200 text-gray-700 px-8 py-3 rounded-xl font-semibold shadow-sm hover:bg-gray-300 transition-colors focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
          >
            Annuler
          </button>
        </div>
      </form>
    </div>
  );
}
