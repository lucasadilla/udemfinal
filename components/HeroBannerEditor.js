import { useState } from 'react';

export default function HeroBannerEditor({ updateContent }) {
  const [image, setImage] = useState('');

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setImage(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!image) return;
    await updateContent('home', 'hero', 'hero_banner', image);
    setImage('');
  };

  return (
    <form onSubmit={handleSubmit} className="mt-4 space-y-2">
      <input type="file" accept="image/*" onChange={handleFileChange} />
      <button
        type="submit"
        className="bg-blue-600 text-white px-4 py-2 rounded"
      >
        Update Banner
      </button>
    </form>
  );
}
