import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';

const NAV_ITEMS = [
    { href: '/', label: 'Accueil' },
    { href: '/blog', label: 'Blog' },
    { href: '/podcasts', label: 'Podcasts' },
    { href: '/contact', label: 'Contact' },
    { href: '/evenements', label: 'Événements' },
    { href: '/notre-comite', label: 'Notre Comité' },
    { href: '/guide', label: 'Guide des commanditaires' },
];

export default function Navbar() {
    const [isOpen, setIsOpen] = useState(false);
    const router = useRouter();

    useEffect(() => {
        setIsOpen(false);
    }, [router.asPath]);

    const toggleMenu = () => {
        setIsOpen((prev) => !prev);
    };

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
        <header className="site-header">
            <nav className="site-navbar" aria-label="Navigation principale">
                <div className="site-navbar__inner">
                    <Link href="/" className="site-navbar__brand" aria-label="Retour à l’accueil">
                        <img
                            src="/images/logo femme et droit-Photoroom.png"
                            alt="Femmes & Droit UdeM"
                            className="site-navbar__logo"
                        />
                    </Link>

                    <div className="site-navbar__actions">
                        <a
                            href="https://www.instagram.com/femmesetdroit/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="site-navbar__social"
                        >
                            <span className="sr-only">Instagram</span>
                            <img src="/images/insta.png" alt="" aria-hidden="true" className="site-navbar__social-icon" />
                        </a>
                        <button
                            type="button"
                            className={`site-navbar__toggle ${isOpen ? 'is-open' : ''}`}
                            onClick={toggleMenu}
                            aria-expanded={isOpen}
                            aria-controls="primary-navigation"
                        >
                            <span className="sr-only">Menu</span>
                            <span className="site-navbar__toggle-bars">
                                <span className="site-navbar__toggle-bar" />
                                <span className="site-navbar__toggle-bar" />
                                <span className="site-navbar__toggle-bar" />
                            </span>
                        </button>
                    </div>
                </div>

                <ul
                    id="primary-navigation"
                    className={`site-navbar__links ${isOpen ? 'is-open' : ''}`}
                >
                    {NAV_ITEMS.map(({ href, label }) => (
                        <li key={href} className="site-navbar__item">
                            <Link
                                href={href}
                                className={`site-navbar__link ${isActive(href) ? 'site-navbar__link--active' : ''}`}
                                onClick={() => setIsOpen(false)}
                                aria-current={isActive(href) ? 'page' : undefined}
                            >
                                {label}
                            </Link>
                        </li>
                    ))}
                </ul>
            </nav>
        </header>
    );
}

