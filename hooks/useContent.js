import { useEffect, useState } from 'react';

export default function useContent() {
  const [content, setContent] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchContent() {
      try {
        const res = await fetch('/api/content');
        if (res.ok) {
          const data = await res.json();
          setContent(data);
        } else {
          setError(new Error('Failed to fetch content'));
        }
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    }

    fetchContent();
  }, []);

  const getNested = (keys, fallback) => {
    let result = content;
    for (const key of keys) {
      if (result && typeof result === 'object' && key in result) {
        result = result[key];
      } else {
        return fallback;
      }
    }
    return result ?? fallback;
  };

  const getTextContent = (section, subsection, key, fallback = '') => {
    return getNested([section, subsection, key], fallback);
  };

  const getImageContent = (section, subsection, key, fallback = '') => {
    return getNested([section, subsection, key], fallback);
  };

  return { getTextContent, getImageContent, loading, error };
}
