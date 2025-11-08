import { useEffect, useState } from 'react';

const CHUNK_SIZE_BYTES = 2 * 1024 * 1024; // 2 MB

async function cancelUpload(uploadId) {
  if (!uploadId) {
    return;
  }

  try {
    await fetch('/api/podcasts/upload', {
      method: 'DELETE',
      headers: { 'X-Upload-Id': uploadId },
    });
  } catch (error) {
    console.warn('Annulation du téléversement échouée :', error);
  }
}

async function cleanupStoredPath(path) {
  if (!path) {
    return;
  }

  try {
    await fetch('/api/podcasts/upload', {
      method: 'DELETE',
      headers: { 'X-Upload-Path': path },
    });
  } catch (error) {
    console.warn('Impossible de supprimer le fichier téléversé :', error);
  }
}

async function uploadFileInChunks(file, type) {
  if (!file) {
    return { success: false, error: 'Aucun fichier à téléverser.' };
  }

  try {
    const initResponse = await fetch('/api/podcasts/upload', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Upload-Action': 'init',
      },
      body: JSON.stringify({
        fileName: file.name,
        mimeType: file.type,
        size: file.size,
        type,
      }),
    });

    if (!initResponse.ok) {
      let message = `Échec de l’initialisation du téléversement (code ${initResponse.status}).`;
      try {
        const payload = await initResponse.json();
        if (payload?.error) {
          message = payload.error;
        }
      } catch (error) {
        // Ignore JSON parsing errors.
      }
      return { success: false, error: message };
    }

    const { uploadId } = await initResponse.json();
    if (!uploadId) {
      return { success: false, error: 'Identifiant de téléversement manquant.' };
    }

    const totalChunks = Math.max(1, Math.ceil(file.size / CHUNK_SIZE_BYTES));

    for (let index = 0; index < totalChunks; index += 1) {
      const start = index * CHUNK_SIZE_BYTES;
      const end = Math.min(file.size, start + CHUNK_SIZE_BYTES);
      const chunk = file.slice(start, end);

      const chunkResponse = await fetch('/api/podcasts/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/octet-stream',
          'X-Upload-Action': 'chunk',
          'X-Upload-Id': uploadId,
          'X-Upload-Type': type,
          'X-Chunk-Index': String(index),
          'X-Chunk-Count': String(totalChunks),
        },
        body: chunk,
      });

      if (!chunkResponse.ok) {
        await cancelUpload(uploadId);
        let message = `Échec du téléversement du fragment ${index + 1} (code ${chunkResponse.status}).`;
        try {
          const payload = await chunkResponse.json();
          if (payload?.error) {
            message = payload.error;
          }
        } catch (error) {
          // Ignore JSON parsing errors.
        }
        return { success: false, error: message };
      }

      const payload = await chunkResponse.json().catch(() => ({}));

      if (index === totalChunks - 1) {
        if (!payload?.storedPath) {
          return { success: false, error: "Le serveur n'a pas renvoyé l'emplacement du fichier téléversé." };
        }
        return { success: true, storedPath: payload.storedPath };
      }
    }

    return { success: false, error: 'Téléversement incomplet.' };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Téléversement du fichier échoué.';
    return { success: false, error: message };
  }
}

export default function usePodcasts() {
  const [podcasts, setPodcasts] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchPodcasts = async () => {
    try {
      const res = await fetch('/api/podcasts');
      if (res.ok) {
        const data = await res.json();
        setPodcasts(data);
      } else {
        console.warn('Impossible de récupérer les balados :', res.status);
      }
    } catch (err) {
      console.error('Impossible de récupérer les balados :', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPodcasts();
  }, []);

  const addPodcast = async ({ title, date, media, mediaUrl, image, imageUrl, bio }) => {
    let uploadedMediaPath = '';
    let uploadedImagePath = '';

    try {
      const trimmedMediaUrl = (mediaUrl || '').trim();
      const trimmedImageUrl = (imageUrl || '').trim();

      if (!media && !trimmedMediaUrl) {
        throw new Error('Un fichier audio ou vidéo ou un lien externe doit être fourni.');
      }

      if (!image && !trimmedImageUrl) {
        throw new Error('Une image de couverture ou un lien d’image doit être fourni.');
      }

      if (media) {
        const mediaUpload = await uploadFileInChunks(media, 'video');
        if (!mediaUpload.success) {
          return { success: false, error: mediaUpload.error };
        }
        uploadedMediaPath = mediaUpload.storedPath;
      }

      if (image) {
        const imageUpload = await uploadFileInChunks(image, 'image');
        if (!imageUpload.success) {
          if (uploadedMediaPath) {
            await cleanupStoredPath(uploadedMediaPath);
          }
          return { success: false, error: imageUpload.error };
        }
        uploadedImagePath = imageUpload.storedPath;
      }

      const res = await fetch('/api/podcasts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          date,
          bio: bio || '',
          mediaUrl: trimmedMediaUrl,
          imageUrl: trimmedImageUrl,
          uploadedMediaPath,
          uploadedImagePath,
        }),
      });

      if (res.ok) {
        await fetchPodcasts();
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

      if (uploadedMediaPath) {
        await cleanupStoredPath(uploadedMediaPath);
        uploadedMediaPath = '';
      }
      if (uploadedImagePath) {
        await cleanupStoredPath(uploadedImagePath);
        uploadedImagePath = '';
      }

      console.warn('Impossible d’ajouter le balado :', errorMessage);
      return { success: false, error: errorMessage };
    } catch (err) {
      if (uploadedMediaPath) {
        await cleanupStoredPath(uploadedMediaPath);
        uploadedMediaPath = '';
      }
      if (uploadedImagePath) {
        await cleanupStoredPath(uploadedImagePath);
        uploadedImagePath = '';
      }
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
        await fetchPodcasts();
      } else {
        console.warn('Impossible de supprimer le balado :', res.status);
      }
    } catch (err) {
      console.error('Impossible de supprimer le balado :', err);
    }
  };

  return { podcasts, loading, addPodcast, deletePodcast };
}
