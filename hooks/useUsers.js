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
        console.warn('Failed to fetch users:', res.status);
      }
    } catch (err) {
      console.error('Failed to fetch users:', err);
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
        const { id } = await res.json();
        setUsers((prev) => [...prev, { ...user, id }]);
      } else {
        console.warn('Failed to add user:', res.status);
      }
    } catch (err) {
      console.error('Failed to add user:', err);
    }
  };

  const deleteUser = async (id) => {
    try {
      const res = await fetch(`/api/users?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setUsers((prev) => prev.filter((user) => user.id !== id));
      } else {
        console.warn('Failed to delete user:', res.status);
      }
    } catch (err) {
      console.error('Failed to delete user:', err);
    }
  };

  return { users, loading, addUser, deleteUser };
}
