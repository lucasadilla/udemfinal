import { useCallback, useEffect, useRef, useState } from 'react';
import { users as fallbackUsers } from '../lib/userDatabase';

const API_BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || '';

export default function useUsers() {
  const [users, setUsers] = useState(fallbackUsers);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const isMounted = useRef(true);

  useEffect(
    () => () => {
      isMounted.current = false;
    },
    [],
  );

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE_URL}/api/users`);
      if (!res.ok) {
        throw new Error(`Réponse inattendue du serveur (${res.status})`);
      }

      const data = await res.json();
      if (!Array.isArray(data)) {
        throw new Error('Format de données utilisateur invalide.');
      }

      if (isMounted.current) {
        setUsers(data);
      }
    } catch (err) {
      console.error('Impossible de récupérer les membres :', err);
      if (isMounted.current) {
        setError(err);
        setUsers((existing) => (existing?.length ? existing : fallbackUsers));
      }
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const addUser = useCallback(
    async (user) => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${API_BASE_URL}/api/users`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(user),
        });
        if (!res.ok) {
          throw new Error(`Impossible d’ajouter le membre : ${res.status}`);
        }
        await fetchUsers();
      } catch (err) {
        console.error('Impossible d’ajouter le membre :', err);
        if (isMounted.current) {
          setError(err);
        }
      } finally {
        if (isMounted.current) {
          setLoading(false);
        }
      }
    },
    [fetchUsers],
  );

  const deleteUser = useCallback(
    async (id) => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${API_BASE_URL}/api/users?id=${id}`, { method: 'DELETE' });
        if (!res.ok) {
          throw new Error(`Impossible de supprimer le membre : ${res.status}`);
        }
        await fetchUsers();
      } catch (err) {
        console.error('Impossible de supprimer le membre :', err);
        if (isMounted.current) {
          setError(err);
        }
      } finally {
        if (isMounted.current) {
          setLoading(false);
        }
      }
    },
    [fetchUsers],
  );

  return { users, loading, error, refresh: fetchUsers, addUser, deleteUser };
}
