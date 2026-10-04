import { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

function RegisterPage() {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState(''); // ДОДАНО СТАН ДЛЯ ПОШТИ
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const navigate = useNavigate();

    const handleRegister = async (e) => {
        e.preventDefault();
        try {
            // ДОДАНО ВІДПРАВКУ ПОШТИ
            await axios.post('http://localhost:5000/api/auth/register', { username, email, password });
            setSuccess(true);
            setError('');
            setTimeout(() => navigate('/login'), 2000);
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
                    
                    <h2 style={{ color: '#2c3e50', marginBottom: '10px', fontSize: '28px', fontWeight: '800' }}>Новий акаунт</h2>
                    <p style={{ color: '#7f8c8d', marginBottom: '30px' }}>Приєднуйтесь до безпечного простору</p>

                    {error && <div style={{ backgroundColor: '#f8d7da', color: '#721c24', padding: '10px', borderRadius: '8px', marginBottom: '20px', fontSize: '14px' }}>{error}</div>}
                    {success && <div style={{ backgroundColor: '#d4edda', color: '#155724', padding: '10px', borderRadius: '8px', marginBottom: '20px', fontSize: '14px', fontWeight: 'bold' }}>✅ Реєстрація успішна! Переходимо до входу...</div>}

                    <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <input 
                            type="text" 
                            placeholder="Придумайте логін" 
                            value={username} 
                            onChange={(e) => setUsername(e.target.value)} 
                            required
                            style={{ padding: '15px 20px', borderRadius: '12px', border: '1px solid #ddd', fontSize: '16px', outline: 'none', backgroundColor: '#f9f9f9' }}
                        />
                        {/* ДОДАНО ПОЛЕ ДЛЯ ПОШТИ */}
                        <input 
                            type="email" 
                            placeholder="Електронна пошта" 
                            value={email} 
                            onChange={(e) => setEmail(e.target.value)} 
                            required
                            style={{ padding: '15px 20px', borderRadius: '12px', border: '1px solid #ddd', fontSize: '16px', outline: 'none', backgroundColor: '#f9f9f9' }}
                        />
                        <input 
                            type="password" 
                            placeholder="Придумайте надійний пароль" 
                            value={password} 
                            onChange={(e) => setPassword(e.target.value)} 
                            required
                            style={{ padding: '15px 20px', borderRadius: '12px', border: '1px solid #ddd', fontSize: '16px', outline: 'none', backgroundColor: '#f9f9f9' }}
                        />
                        <button 
                            type="submit" 
                            disabled={success}
                            style={{ padding: '15px', borderRadius: '12px', backgroundColor: '#28a745', color: 'white', border: 'none', fontSize: '16px', fontWeight: 'bold', cursor: success ? 'not-allowed' : 'pointer', boxShadow: '0 4px 10px rgba(40,167,69,0.3)', marginTop: '10px' }}
                        >
                            Зареєструватися
                        </button>
                    </form>

                    <div style={{ marginTop: '30px', fontSize: '14px', color: '#666' }}>
                        Вже маєте акаунт? <Link to="/login" style={{ color: '#007BFF', fontWeight: 'bold', textDecoration: 'none' }}>Увійти</Link>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default RegisterPage;