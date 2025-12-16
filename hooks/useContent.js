import { useSWRData } from './useSWR';

export default function useContent() {
  const { data: content = {}, error, isLoading: loading, mutate } = useSWRData('/api/content', {
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
    dedupingInterval: 5000, // Cache for 5 seconds
  });

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
        // Update SWR cache with new data
        await mutate(data, false); // false = don't revalidate, we already have the data
      } else {
        console.warn('Impossible de mettre à jour le contenu :', res.status);
      }
    } catch (err) {
      console.error('Impossible de mettre à jour le contenu :', err);
    }
  };

  return { getTextContent, getImageContent, loading, error, updateContent };
}
