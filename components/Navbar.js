import { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';

export default function Navbar() {
    const [isOpen, setIsOpen] = useState(false);
    const router = useRouter();

    const toggleMenu = () => {
        setIsOpen(!isOpen);
    };

    // Helper function to determine if a link is active
    const isActive = (path) => {
        if (!router) {
            return false;
        }

        const currentPath = router.asPath || router.pathname;

        return (
            currentPath === path ||
            currentPath.startsWith(`${path}/`) ||
            currentPath.startsWith(`${path}?`) ||
            router.pathname === path ||
            router.pathname.startsWith(`${path}/`)
        );
    };

    return (
        <nav className={`bg-[#f0efe9] p-4 w-full ${isOpen ? 'menu-open' : ''}`}>
            <div className="logo-container">
                <a href="/">
                    <img src="/images/logo femme et droit-Photoroom.png" alt="Logo de Femmes et Droit" className="logo w-10 h-10" />
                </a>
            </div>
            <ul className={`nav-links ${isOpen ? 'open' : ''} md:flex-row md:flex space-x-4 w-full md:w-auto`}>
                <li>
                    <Link href="/">
                        <span className={`nav-link text-black ${isActive('/') ? 'font-bold' : ''}`}>Accueil</span>
                    </Link>
                </li>
                <li>
                    <Link href="/blog">
                        <span className={`nav-link text-black ${isActive('/blog') ? 'font-bold' : ''}`}>Blog</span>
                    </Link>
                </li>
                <li>
                    <Link href="/podcasts">
                        <span className={`nav-link text-black ${isActive('/podcasts') ? 'font-bold' : ''}`}>Podcasts</span>
                    </Link>
                </li>
                <li>
                    <Link href="/contact">
                        <span className={`nav-link text-black ${isActive('/contact') ? 'font-bold' : ''}`}>Contact</span>
                    </Link>
                </li>
                <li>
                    <Link href="/evenements">
                        <span className={`nav-link text-black ${isActive('/evenements') ? 'font-bold' : ''}`}>Événements</span>
                    </Link>
                </li>
                <li>
                    <Link href="/notre-comite">
                        <span className={`nav-link text-black ${isActive('/notre-comite') ? 'font-bold' : ''}`}>Notre Comité</span>
                    </Link>
                </li>
                <li>
                    <Link href="/guide">
                        <span className={`nav-link text-black ${isActive('/guide') ? 'font-bold' : ''}`}>Guide des commanditaires</span>
                    </Link>
                </li>
            </ul>
            <a
                href="https://www.instagram.com/femmesetdroit/"
                target="_blank"
                rel="noopener noreferrer"
                className="instagram-link"
            >
                <img
                    src="/images/insta.png"
                    alt="Instagram de Femmes et Droit"
                    className="instagram-icon w-8 h-8"
                />
            </a>
            <button
                className={`hamburger-icon ${isOpen ? 'open' : ''}`}
                onClick={toggleMenu}
                aria-label="Toggle navigation menu"
                aria-expanded={isOpen}
            >
                <div>
                    <span className="block w-6 h-0.5 bg-black mb-1"></span>
                    <span className="block w-6 h-0.5 bg-black mb-1"></span>
                    <span className="block w-6 h-0.5 bg-black"></span>
                </div>
            </button>
        </nav>
    );
}

