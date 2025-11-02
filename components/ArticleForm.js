import { useState, useEffect } from 'react';
import useUsers from '@/hooks/useUsers';
import RichTextEditor from '@/components/RichTextEditor';

const MAX_FILE_SIZE = 6 * 1024 * 1024; // 6 MB (fits within the 8 MB API limit once encoded)
const MAX_BASE64_SIZE = 7.5 * 1024 * 1024; // 7.5 MB safety margin
const DEFAULT_MAX_WIDTH = 1200;
const DEFAULT_QUALITY = 0.7;

const readFileAsDataURL = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(reader.result);
  reader.onerror = reject;
  reader.readAsDataURL(file);
});

const compressImageFile = (file, maxWidth = DEFAULT_MAX_WIDTH, quality = DEFAULT_QUALITY) =>
  new Promise((resolve, reject) => {
    const image = new Image();
    const objectUrl = URL.createObjectURL(file);
    image.onload = () => {
      let { width, height } = image;

      if (width > maxWidth) {
        const ratio = maxWidth / width;
        width = maxWidth;
        height = Math.round(height * ratio);
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext('2d');
      if (!context) {
        reject(new Error("Impossible d'obtenir le contexte du canvas"));
        return;
      }
      context.drawImage(image, 0, 0, width, height);

      canvas.toBlob((blob) => {
        URL.revokeObjectURL(objectUrl);
        if (!blob) {
          reject(new Error("Échec de la compression de l'image"));
          return;
        }
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      }, 'image/jpeg', quality);
    };

    image.onerror = (err) => {
      URL.revokeObjectURL(objectUrl);
      reject(err);
    };
    image.src = objectUrl;
  });

const estimateBase64Size = (dataUrl = '') => {
  const base64 = dataUrl.split(',')[1] || '';
  return Math.ceil((base64.length * 3) / 4);
};

export default function ArticleForm({ article, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    author: '',
    authorImage: '',
    image: '',
    date: new Date().toISOString().split('T')[0]
  });
  const [imageError, setImageError] = useState('');
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

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageError('');

    try {
      const dataUrl = file.size > MAX_FILE_SIZE
        ? await compressImageFile(file)
        : await readFileAsDataURL(file);

      if (estimateBase64Size(dataUrl) > MAX_BASE64_SIZE) {
        setImageError("L’image sélectionnée est trop volumineuse. Choisissez une image plus petite (moins de 6 Mo).");
        return;
      }

      setFormData(prev => ({ ...prev, image: dataUrl }));
    } catch (error) {
      console.error("Erreur lors du traitement de l'image :", error);
      setImageError("Impossible d’utiliser cette image. Veuillez en choisir une autre.");
    }
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
          {imageError ? (
            <p className="mt-2 text-sm text-red-600">{imageError}</p>
          ) : (
            <p className="mt-2 text-xs text-gray-500">Images jusqu’à 6&nbsp;Mo. Les fichiers volumineux sont automatiquement compressés.</p>
          )}
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
