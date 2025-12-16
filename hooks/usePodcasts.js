import { useSWRData } from './useSWR';

export default function usePodcasts() {
  const { data: podcasts = [], error, isLoading: loading, mutate } = useSWRData('/api/podcasts', {
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
    dedupingInterval: 2000, // Cache for 2 seconds
  });

  const addPodcast = async ({
    title,
    date,
    bio,
    mediaMode,
    media,
    mediaUrl,
    imageMode,
    image,
    imageUrl,
  }) => {
    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('date', date);
      formData.append('bio', bio || '');
      formData.append('mediaMode', mediaMode);
      formData.append('imageMode', imageMode);

      const trimmedMediaUrl = (mediaUrl || '').trim();
      const trimmedImageUrl = (imageUrl || '').trim();

      if (mediaMode === 'upload') {
        if (media) {
          formData.append('media', media);
        }
      } else if (trimmedMediaUrl) {
        formData.append('mediaUrl', trimmedMediaUrl);
      }

      if (imageMode === 'upload') {
        if (image) {
          formData.append('image', image);
        }
      } else if (trimmedImageUrl) {
        formData.append('imageUrl', trimmedImageUrl);
      }

      const res = await fetch('/api/podcasts', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        // Revalidate to get fresh data
        await mutate();
        return { success: true };
      }

      let errorMessage = `Impossible d’ajouter le balado (code ${res.status}).`;
      try {
        const payload = await res.json();
        if (payload?.error) {
          errorMessage = payload.error;
        }
      } catch (parseError) {
        // Ignore JSON parsing errors and use the default message.
      }

      console.warn('Impossible d’ajouter le balado :', errorMessage);
      return { success: false, error: errorMessage };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur inconnue lors de l’ajout du balado.';
      console.error('Impossible d’ajouter le balado :', err);
      return { success: false, error: message };
    }
  };

  const deletePodcast = async (id) => {
    try {
      const res = await fetch(`/api/podcasts?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        // Revalidate to get fresh data
        await mutate();
      } else {
        console.warn('Impossible de supprimer le balado :', res.status);
      }
    } catch (err) {
      console.error('Impossible de supprimer le balado :', err);
    }
  };

  return { podcasts, loading, addPodcast, deletePodcast };
}
