import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './SiteHeader.css';

function SiteHeader() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const navigate = useNavigate();
    const token = localStorage.getItem('token');
    const username = localStorage.getItem('username');

    useEffect(() => {
        const closeMenuOnEscape = (event) => {
            if (event.key === 'Escape') setIsMenuOpen(false);
        };
        const closeMenuOnDesktop = () => {
            if (window.matchMedia('(min-width: 761px)').matches) setIsMenuOpen(false);
        };
        window.addEventListener('keydown', closeMenuOnEscape);
        window.addEventListener('resize', closeMenuOnDesktop);
        return () => {
            window.removeEventListener('keydown', closeMenuOnEscape);
            window.removeEventListener('resize', closeMenuOnDesktop);
        };
    }, []);

    const closeMenu = () => setIsMenuOpen(false);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('username');
        closeMenu();
        navigate('/');
    };

    return (
        <header className="site-header">
            <Link className="site-header-brand" to="/" aria-label="SecureChat, головна сторінка" onClick={closeMenu}>
                <span className="site-header-brand-mark" aria-hidden="true">S</span>
                <span>SecureChat</span>
            </Link>
            <button
                className={`site-header-menu-toggle ${isMenuOpen ? 'is-open' : ''}`}
                type="button"
                aria-label={isMenuOpen ? 'Закрити меню' : 'Відкрити меню'}
                aria-expanded={isMenuOpen}
                aria-controls="site-header-navigation"
                onClick={() => setIsMenuOpen(open => !open)}
            >
                <span />
                <span />
                <span />
            </button>
            <nav id="site-header-navigation" className={`site-header-nav ${isMenuOpen ? 'is-open' : ''}`} aria-label="Головна навігація">
                <Link className="site-header-feature-link" to="/#features" onClick={closeMenu}>Можливості</Link>
                <Link to="/ciphers" onClick={closeMenu}>Шифри</Link>
                {token ? (
                    <>
                        <Link to="/chat" onClick={closeMenu}>Чат</Link>
                        <Link className="site-header-profile-link" to="/profile" onClick={closeMenu}>Профіль{username ? ` · ${username}` : ''}</Link>
                        <button className="site-header-action" type="button" onClick={handleLogout}>Вийти</button>
                    </>
                ) : (
                    <>
                        <Link className="site-header-login-link" to="/login" onClick={closeMenu}>Увійти</Link>
                        <Link className="site-header-action" to="/register" onClick={closeMenu}>Створити акаунт</Link>
                    </>
                )}
            </nav>
        </header>
    );
}

export default SiteHeader;
