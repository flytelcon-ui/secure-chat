import { useState } from 'react';
import axios from 'axios';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import './AuthPage.css';

function LoginPage() {
    const [identifier, setIdentifier] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const location = useLocation();
    const navigate = useNavigate();
    const requestedNext = new URLSearchParams(location.search).get('next');
    const returnPath = requestedNext?.startsWith('/') && !requestedNext.startsWith('//') ? requestedNext : '/chat';
    const registerPath = requestedNext ? `/register?next=${encodeURIComponent(returnPath)}` : '/register';

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            const res = await axios.post('http://localhost:5000/api/auth/login', { identifier, password });
            
            // Зберігаємо токен і логін, які повернув бекенд
            localStorage.setItem('token', res.data.token);
            localStorage.setItem('username', res.data.username);
            
            navigate(returnPath, { replace: true });
        } catch (err) {
            setError(err.response?.data?.message || 'Помилка входу');
        }
    };

    return (
        <div className="auth-page">
            <header className="auth-header">
                <Link className="auth-brand" to="/">
                    <span className="auth-brand-mark" aria-hidden="true">S</span>
                    <span>SecureChat</span>
                </Link>
                <Link className="auth-home-link" to="/">На головну <span aria-hidden="true">↗</span></Link>
            </header>

            <main className="auth-layout">
                <section className="auth-story">
                    <p className="auth-eyebrow"><span /> РАДІ БАЧИТИ ЗНОВУ</p>
                    <h1>Продовжуйте розмову <em>звідси.</em></h1>
                    <p className="auth-story-copy">Ваші контакти й діалоги вже чекають. Увійдіть, щоб повернутися до листування та експериментів із простими шифрами.</p>
                    <div className="auth-chat-note" aria-label="Приклад повідомлень у чаті">
                        <span className="auth-note-label">З ВАШОГО ЧАТУ</span>
                        <p>«Привіт! Є хвилина поговорити?»</p>
                        <span className="auth-note-reply">Звісно. Я вже тут.</span>
                    </div>
                    <p className="auth-footnote">Навчальний проєкт із простими шифрами. Не використовуйте для чутливих даних.</p>
                </section>

                <section className="auth-form-panel" aria-labelledby="login-title">
                    <p className="auth-form-kicker">ВХІД ДО ПРОФІЛЮ <span>01 / 02</span></p>
                    <h2 id="login-title">З поверненням.</h2>
                    <p className="auth-form-intro">Введіть дані акаунта, щоб відкрити свої чати.</p>

                    {error && <div className="auth-alert auth-alert-error" role="alert">{error}</div>}

                    <form onSubmit={handleLogin} className="auth-form">
                        <label htmlFor="login-identifier">Електронна пошта або логін</label>
                        <input
                            id="login-identifier"
                            type="text"
                            autoComplete="username"
                            placeholder="Логін або name@example.com"
                            value={identifier}
                            onChange={(e) => setIdentifier(e.target.value)}
                            required
                        />
                        <label htmlFor="login-password">Пароль</label>
                        <input
                            id="login-password"
                            type="password"
                            autoComplete="current-password"
                            placeholder="Ваш пароль"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                        <button type="submit" className="auth-submit">Увійти в акаунт <span aria-hidden="true">↗</span></button>
                    </form>

                    <p className="auth-switch">Ще не маєте акаунта? <Link to={registerPath}>Створити профіль</Link></p>
                </section>
            </main>

            <footer className="auth-footer"><span>SecureChat</span><span>Розмови починаються з простого «привіт».</span></footer>
        </div>
    );
}

export default LoginPage;