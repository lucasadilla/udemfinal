import React, { useState } from 'react';
import { useRouter } from 'next/router';
import useAdminStatus from '../hooks/useAdminStatus';

export default function Footer() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoggingOut, setIsLoggingOut] = useState(false);
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

    const handleSignOut = async () => {
        if (isLoggingOut) return; // Prevent double-clicks
        
        setIsLoggingOut(true);
        
        try {
            // Clear localStorage first
            try {
                window.localStorage.removeItem('admin-auth');
            } catch (err) {
                console.warn("Impossible de réinitialiser l'état administrateur :", err);
            }
            
            // Clear all possible cookie configurations client-side
            const hostname = window.location.hostname;
            const domain = hostname.includes('.') && !hostname.startsWith('localhost') && !/^\d+\.\d+\.\d+\.\d+$/.test(hostname)
                ? `.${hostname.replace(/^www\./, '')}`
                : null;
            
            const cookiesToDelete = [
                'admin-auth=; Path=/; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT',
                'admin-auth=; Path=/; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Secure',
            ];
            
            if (domain) {
                cookiesToDelete.push(`admin-auth=; Path=/; Domain=${domain}; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT`);
                cookiesToDelete.push(`admin-auth=; Path=/; Domain=${domain}; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Secure`);
            }
            
            // Delete cookies with all possible configurations
            cookiesToDelete.forEach(cookie => {
                try {
                    document.cookie = cookie;
                } catch (err) {
                    console.warn("Erreur lors de la suppression d'un cookie :", err);
                }
            });
            
            // Also call logout API to ensure server-side cookie clearing
            try {
                await fetch('/api/logout', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                });
            } catch (err) {
                console.warn("Erreur lors de l'appel à l'API de déconnexion :", err);
                // Continue anyway - we've cleared client-side storage
            }
            
            // Force reload after a small delay to ensure cookies are cleared
            setTimeout(() => {
                window.location.href = '/'; // Use window.location.href for a hard reload
            }, 150);
        } catch (err) {
            console.error("Erreur lors de la déconnexion :", err);
            setIsLoggingOut(false);
        }
    };

    return (
        <footer className="footer">
            <div className="footer-content flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <span className="footer-copy">©2024 Comité Femmes et Droit UdeM</span>
                {isAdmin ? (
                    <button
                        className="bg-blue-500 text-white px-3 py-1 mt-2 sm:mt-0 w-full sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={handleSignOut}
                        disabled={isLoggingOut}
                    >
                        {isLoggingOut ? 'Déconnexion...' : 'Déconnexion'}
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
