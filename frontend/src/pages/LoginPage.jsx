import { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

function LoginPage() {
    const [email, setEmail] = useState(''); // Змінили username на email
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            // Відправляємо email замість username
            const res = await axios.post('http://localhost:5000/api/auth/login', { email, password });
            
            // Зберігаємо токен і логін, які повернув бекенд
            localStorage.setItem('token', res.data.token);
            localStorage.setItem('username', res.data.username);
            
            navigate('/chat');
        } catch (err) {
            setError(err.response?.data?.message || 'Помилка входу');
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: '#f4f7f6', fontFamily: '"Segoe UI", Roboto, sans-serif' }}>
            
            <div style={{ padding: '20px 40px', display: 'flex', justifyContent: 'flex-start' }}>
                <Link to="/" style={{ textDecoration: 'none' }}>
                    <h2 style={{ margin: 0, color: '#007BFF', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '24px' }}>🔒</span> SecureChat
                    </h2>
                </Link>
            </div>

            <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px' }}>
                <div style={{ backgroundColor: '#ffffff', padding: '40px', borderRadius: '20px', width: '100%', maxWidth: '400px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', textAlign: 'center' }}>
                    
                    <h2 style={{ color: '#2c3e50', marginBottom: '10px', fontSize: '28px', fontWeight: '800' }}>З поверненням!</h2>
                    <p style={{ color: '#7f8c8d', marginBottom: '30px' }}>Увійдіть, щоб продовжити спілкування</p>

                    {error && <div style={{ backgroundColor: '#f8d7da', color: '#721c24', padding: '10px', borderRadius: '8px', marginBottom: '20px', fontSize: '14px' }}>{error}</div>}

                    <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <input 
                            type="email" 
                            placeholder="Електронна пошта" 
                            value={email} 
                            onChange={(e) => setEmail(e.target.value)} 
                            required
                            style={{ padding: '15px 20px', borderRadius: '12px', border: '1px solid #ddd', fontSize: '16px', outline: 'none', backgroundColor: '#f9f9f9', transition: 'border 0.3s' }}
                        />
                        <input 
                            type="password" 
                            placeholder="Пароль" 
                            value={password} 
                            onChange={(e) => setPassword(e.target.value)} 
                            required
                            style={{ padding: '15px 20px', borderRadius: '12px', border: '1px solid #ddd', fontSize: '16px', outline: 'none', backgroundColor: '#f9f9f9', transition: 'border 0.3s' }}
                        />
                        <button 
                            type="submit" 
                            style={{ padding: '15px', borderRadius: '12px', backgroundColor: '#007BFF', color: 'white', border: 'none', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 10px rgba(0,123,255,0.3)', marginTop: '10px' }}
                        >
                            Увійти в акаунт
                        </button>
                    </form>

                    <div style={{ marginTop: '30px', fontSize: '14px', color: '#666' }}>
                        Немає акаунта? <Link to="/register" style={{ color: '#007BFF', fontWeight: 'bold', textDecoration: 'none' }}>Створити зараз</Link>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default LoginPage;