import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

export default function Footer() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isAdmin, setIsAdmin] = useState(false);
    const router = useRouter();

    useEffect(() => {
        setIsAdmin(document.cookie.includes('admin-auth=true'));
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        const res = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        if (res.ok) {
            router.reload();
        } else {
            setError('Invalid credentials');
        }
    };

    const handleSignOut = () => {
        document.cookie = 'admin-auth=; Path=/; Max-Age=0';
        router.reload();
    };

    return (
        <footer className="footer">
            <div className="footer-content flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <span>©2024 Comité Femmes et Droit UdeM</span>
                {isAdmin ? (
                    <button
                        className="bg-blue-500 text-white px-3 py-1 mt-2 sm:mt-0"
                        onClick={handleSignOut}
                    >
                        Sign Out
                    </button>
                ) : (
                    <form onSubmit={handleSubmit} className="mt-2 sm:mt-0 flex space-x-2">
                        <input
                            className="border p-1"
                            type="text"
                            placeholder="Username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                        />
                        <input
                            className="border p-1"
                            type="password"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                        <button className="bg-blue-500 text-white px-3 py-1" type="submit">
                            Login
                        </button>
                    </form>
                )}
            </div>
            {error && !isAdmin && <p className="text-red-500 text-sm mt-1">{error}</p>}
        </footer>
    );
}
