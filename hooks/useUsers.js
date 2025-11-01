import { useEffect, useState } from 'react';

export default function useUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users');
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
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
    fetchUsers();
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
