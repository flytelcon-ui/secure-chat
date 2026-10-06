import { useState } from 'react';
import axios from 'axios';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import './AuthPage.css';

function RegisterPage() {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState(''); // ДОДАНО СТАН ДЛЯ ПОШТИ
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();
    const requestedNext = new URLSearchParams(location.search).get('next');
    const returnPath = requestedNext?.startsWith('/') && !requestedNext.startsWith('//') ? requestedNext : '/chat';
    const loginPath = requestedNext ? `/login?next=${encodeURIComponent(returnPath)}` : '/login';

    const handleRegister = async (e) => {
        e.preventDefault();
        try {
            // ДОДАНО ВІДПРАВКУ ПОШТИ
            await axios.post('http://localhost:5000/api/auth/register', { username, email, password });
            setSuccess(true);
            setError('');
            setTimeout(() => navigate(loginPath), 2000);
        } catch (err) {
            if (err.response?.data?.message) {
                setError(err.response.data.message);
            } else {
                setError('Помилка реєстрації. Перевірте, чи не зайнятий логін або пошта.');
            }
            setSuccess(false);
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

            <main className="auth-layout auth-layout-register">
                <section className="auth-story">
                    <p className="auth-eyebrow"><span /> ВАША РОЗМОВА ПОЧИНАЄТЬСЯ ТУТ</p>
                    <h1>Нове ім’я. <em>Нові діалоги.</em></h1>
                    <p className="auth-story-copy">Створіть профіль, знайдіть співрозмовників і досліджуйте, як працюють прості шифри в чаті.</p>
                    <div className="auth-chat-note" aria-label="Приклад повідомлень у чаті">
                        <span className="auth-note-label">ПЕРШЕ ПОВІДОМЛЕННЯ</span>
                        <p>«Привіт! Радий познайомитись.»</p>
                        <span className="auth-note-reply">І я! Про що поговоримо?</span>
                    </div>
                    <p className="auth-footnote">Навчальний проєкт із простими шифрами. Не використовуйте для чутливих даних.</p>
                </section>

                <section className="auth-form-panel" aria-labelledby="register-title">
                    <p className="auth-form-kicker">НОВИЙ ПРОФІЛЬ <span>02 / 02</span></p>
                    <h2 id="register-title">Приєднуйтеся.</h2>
                    <p className="auth-form-intro">Заповніть дані, щоб створити акаунт.</p>

                    {error && <div className="auth-alert auth-alert-error" role="alert">{error}</div>}
                    {success && <div className="auth-alert auth-alert-success" role="status">Реєстрація успішна! Переходимо до входу...</div>}

                    <form onSubmit={handleRegister} className="auth-form">
                        <label htmlFor="register-username">Ім’я користувача</label>
                        <input
                            id="register-username"
                            type="text"
                            autoComplete="username"
                            placeholder="Як до вас звертатися?"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                        />
                        <label htmlFor="register-email">Електронна пошта</label>
                        <input
                            id="register-email"
                            type="email"
                            autoComplete="email"
                            placeholder="name@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                        <label htmlFor="register-password">Пароль</label>
                        <input
                            id="register-password"
                            type="password"
                            autoComplete="new-password"
                            placeholder="Придумайте пароль"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                        <button type="submit" className="auth-submit" disabled={success}>Створити акаунт <span aria-hidden="true">↗</span></button>
                    </form>

                    <p className="auth-switch">Вже маєте акаунт? <Link to={loginPath}>Увійти</Link></p>
                </section>
            </main>

            <footer className="auth-footer"><span>SecureChat</span><span>Розмови починаються з простого «привіт».</span></footer>
        </div>
    );
}

export default RegisterPage;