import { Link, useNavigate } from 'react-router-dom';
import './SiteHeader.css';

function SiteHeader() {
    const navigate = useNavigate();
    const token = localStorage.getItem('token');
    const username = localStorage.getItem('username');

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('username');
        navigate('/');
    };

    return (
        <header className="site-header">
            <Link className="site-header-brand" to="/" aria-label="SecureChat, головна сторінка">
                <span className="site-header-brand-mark" aria-hidden="true">S</span>
                <span>SecureChat</span>
            </Link>
            <nav className="site-header-nav" aria-label="Головна навігація">
                <Link className="site-header-feature-link" to="/#features">Можливості</Link>
                <Link to="/ciphers">Шифри</Link>
                {token ? (
                    <>
                        <Link to="/chat">Чат</Link>
                        <Link className="site-header-profile-link" to="/profile">Профіль{username ? ` · ${username}` : ''}</Link>
                        <button className="site-header-action" type="button" onClick={handleLogout}>Вийти</button>
                    </>
                ) : (
                    <>
                        <Link className="site-header-login-link" to="/login">Увійти</Link>
                        <Link className="site-header-action" to="/register">Створити акаунт</Link>
                    </>
                )}
            </nav>
        </header>
    );
}

export default SiteHeader;
