import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Image from 'next/image';

export default function Navbar() {
    const [isOpen, setIsOpen] = useState(false);
    const router = useRouter();

    // Aggressively prefetch Blog and Accueil pages for instant navigation
    useEffect(() => {
        // Prefetch immediately
        router.prefetch('/');
        router.prefetch('/blog');
        
        // Also prefetch on hover for even faster navigation
        const handleMouseEnter = (path) => {
            router.prefetch(path);
        };
        
        // Store prefetch handlers for link hover events
        if (typeof window !== 'undefined') {
            const homeLink = document.querySelector('a[href="/"]');
            const blogLink = document.querySelector('a[href="/blog"]');
            
            if (homeLink) {
                homeLink.addEventListener('mouseenter', () => router.prefetch('/'), { once: true });
            }
            if (blogLink) {
                blogLink.addEventListener('mouseenter', () => router.prefetch('/blog'), { once: true });
            }
        }
    }, [router]);

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
                    <Image 
                      src="/images/logo femme et droit-Photoroom.png" 
                      alt="Logo de Femmes et Droit" 
                      className="logo w-10 h-10" 
                      width={40}
                      height={40}
                      priority
                    />
                </a>
            </div>
            <ul className={`nav-links ${isOpen ? 'open' : ''} md:flex-row md:flex space-x-4 w-full md:w-auto`}>
                <li>
                    <Link href="/" prefetch={true}>
                        <span className={`nav-link text-black ${isActive('/') ? 'font-bold' : ''}`}>Accueil</span>
                    </Link>
                </li>
                <li>
                    <Link href="/blog" prefetch={true}>
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
                <Image
                    src="/images/insta.png"
                    alt="Instagram de Femmes et Droit"
                    className="instagram-icon w-8 h-8"
                    width={32}
                    height={32}
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

