import useSWRLite from '../lib/useSWRLite';

const fetcher = async (url) => {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error('Impossible de récupérer le contenu');
  }
  return res.json();
};

export default function useContent(initialData = {}) {
  const {
    data,
    error,
    isLoading,
    isValidating,
    mutate,
  } = useSWRLite('/api/content', fetcher, {
    fallbackData: initialData,
    revalidateOnFocus: false,
  });

  const content = data || {};

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

  const updateContent = async (section, subsection, key, value) => {
    try {
      const res = await fetch('/api/content', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ section, subsection, key, value }),
      });
      if (res.ok) {
        const data = await res.json();
        mutate(data, { revalidate: false });
      } else {
        console.warn('Impossible de mettre à jour le contenu :', res.status);
      }
    } catch (err) {
      console.error('Impossible de mettre à jour le contenu :', err);
    }
  };

  return {
    getTextContent,
    getImageContent,
    loading: isLoading && !data,
    revalidating: isValidating,
    error,
    updateContent,
    content,
  };
}
