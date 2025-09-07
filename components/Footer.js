import React from 'react';
import Link from 'next/link';

export default function Footer() {
    return (
        <footer className="footer">
            <div className="footer-content">
                <span>©2024 Comité Femmes et Droit UdeM</span>
                <Link href="/admin" className="admin-login">
                    Admin Login
                </Link>
            </div>
        </footer>
    );
}
