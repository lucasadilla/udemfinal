import { useEffect, useState } from 'react';

const hasAdminCookie = () => {
  try {
    return typeof document !== 'undefined' && document.cookie.includes('admin-auth=true');
  } catch (err) {
    console.warn('Impossible de lire les cookies du navigateur :', err);
    return false;
  }
};

const hasAdminStorage = () => {
  try {
    return typeof window !== 'undefined' && window.localStorage.getItem('admin-auth') === 'true';
  } catch (err) {
    console.warn('Impossible d’accéder au stockage local :', err);
    return false;
  }
};

export default function useAdminStatus() {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const evaluate = () => {
      setIsAdmin(hasAdminCookie() || hasAdminStorage());
    };

    // Initial evaluation
    evaluate();
    
    // Listen for storage changes (localStorage)
    window.addEventListener('storage', evaluate);
    
    return () => {
      window.removeEventListener('storage', evaluate);
    };
  }, []);

  return isAdmin;
}

