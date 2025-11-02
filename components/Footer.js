import React, { useState } from 'react';
import { useRouter } from 'next/router';
import useAdminStatus from '../hooks/useAdminStatus';

export default function Footer() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const isAdmin = useAdminStatus();
    const router = useRouter();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        const res = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        if (res.ok) {
            try {
                window.localStorage.setItem('admin-auth', 'true');
            } catch (err) {
                console.warn("Impossible d’enregistrer l’état administrateur :", err);
            }
            router.reload();
        } else {
            setError('Identifiants invalides');
        }
    };

    const handleSignOut = () => {
        try {
            window.localStorage.removeItem('admin-auth');
        } catch (err) {
            console.warn("Impossible de réinitialiser l’état administrateur :", err);
        }
        document.cookie = 'admin-auth=; Path=/; Max-Age=0';
        router.reload();
    };

    return (
        <footer className="footer">
            <div className="footer-content flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <span className="footer-copy">©2024 Comité Femmes et Droit UdeM</span>
                {isAdmin ? (
                    <button
                        className="bg-blue-500 text-white px-3 py-1 mt-2 sm:mt-0 w-full sm:w-auto"
                        onClick={handleSignOut}
                    >
                        Déconnexion
                    </button>
                ) : (
                    <form onSubmit={handleSubmit} className="mt-2 sm:mt-0 flex flex-col sm:flex-row sm:space-x-2 gap-2 w-full sm:w-auto">
                        <input
                            className="border p-1 w-full sm:w-auto"
                            type="text"
                            placeholder="Nom d'utilisateur"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                        />
                        <input
                            className="border p-1 w-full sm:w-auto"
                            type="password"
                            placeholder="Mot de passe"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                        <button className="bg-blue-500 text-white px-3 py-1 w-full sm:w-auto" type="submit">
                            Connexion
                        </button>
                    </form>
                )}
            </div>
            {error && !isAdmin && <p className="text-red-500 text-sm mt-1">{error}</p>}
        </footer>
    );
}
