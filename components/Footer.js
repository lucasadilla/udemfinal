import React, { useState } from 'react';
import { useRouter } from 'next/router';

export default function Footer() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
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
            router.push('/admin');
        } else {
            setError('Invalid credentials');
        }
    };

    return (
        <footer className="footer">
            <div className="footer-content flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <span>©2024 Comité Femmes et Droit UdeM</span>
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
            </div>
            {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
        </footer>
    );
}
