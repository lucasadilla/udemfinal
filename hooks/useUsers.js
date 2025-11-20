import { useEffect, useState } from 'react';

const USERS_CACHE_KEY = 'notre-comite-users';
const USERS_CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

function readCachedUsers() {
  if (typeof window === 'undefined') return null;

  try {
    const cachedValue = window.localStorage.getItem(USERS_CACHE_KEY);

    if (!cachedValue) return null;

    const cached = JSON.parse(cachedValue);

    if (!Array.isArray(cached?.users) || typeof cached?.timestamp !== 'number') {
      return null;
    }

    const isExpired = Date.now() - cached.timestamp > USERS_CACHE_TTL;
    if (isExpired) {
      window.localStorage.removeItem(USERS_CACHE_KEY);
      return null;
    }

    return cached.users;
  } catch (error) {
    console.warn('Impossible de lire le cache des membres :', error);
    return null;
  }
}

function writeCachedUsers(users) {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.setItem(
      USERS_CACHE_KEY,
      JSON.stringify({ users, timestamp: Date.now() })
    );
  } catch (error) {
    console.warn('Impossible de mettre en cache les membres :', error);
  }
}

export default function useUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = async ({ silent = false } = {}) => {
    if (!silent) {
      setLoading(true);
    }

    try {
      const res = await fetch('/api/users');
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
        writeCachedUsers(data);
      } else {
        console.warn('Impossible de récupérer les membres :', res.status);
      }
    } catch (err) {
      console.error('Impossible de récupérer les membres :', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const cachedUsers = readCachedUsers();
    if (cachedUsers) {
      setUsers(cachedUsers);
      setLoading(false);
    }

    fetchUsers({ silent: Boolean(cachedUsers) });
  }, []);

  const addUser = async (user) => {
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(user),
      });
      if (res.ok) {
        setLoading(true);
        await fetchUsers();
      } else {
        console.warn('Impossible d’ajouter le membre :', res.status);
      }
    } catch (err) {
      console.error('Impossible d’ajouter le membre :', err);
    }
  };

  const deleteUser = async (id) => {
    try {
      const res = await fetch(`/api/users?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setLoading(true);
        await fetchUsers();
      } else {
        console.warn('Impossible de supprimer le membre :', res.status);
      }
    } catch (err) {
      console.error('Impossible de supprimer le membre :', err);
    }
  };

  return { users, loading, addUser, deleteUser };
}
