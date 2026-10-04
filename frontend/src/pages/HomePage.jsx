import { Link } from 'react-router-dom';

function HomePage() {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', width: '100%' }}>
            
            {/* Верхня панель (Навігація) */}
            <nav style={{ 
                padding: '20px 5%', 
                backgroundColor: '#ffffff', 
                boxShadow: '0 2px 10px rgba(0,0,0,0.05)', 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '15px'
            }}>
                <h2 style={{ margin: 0, color: '#007BFF', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '24px' }}>🔒</span> SecureChat
                </h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <Link to="/login" style={{ textDecoration: 'none', color: '#555', fontWeight: 'bold', fontSize: '16px' }}>Увійти</Link>
                    <Link to="/register" style={{ padding: '10px 20px', backgroundColor: '#007BFF', color: '#ffffff', textDecoration: 'none', borderRadius: '8px', fontWeight: 'bold', boxShadow: '0 2px 5px rgba(0,123,255,0.3)', textAlign: 'center' }}>Створити акаунт</Link>
                </div>
            </nav>

            {/* Головний блок (Hero Section) */}
            <div style={{ 
                flex: 1, 
                display: 'flex', 
                flexDirection: 'column', 
                justifyContent: 'center', 
                alignItems: 'center', 
                padding: '60px 5%', 
                textAlign: 'center' 
            }}>
                {/* Використовуємо clamp для адаптивного розміру шрифту (від 32px до 56px) */}
                <h1 style={{ fontSize: 'clamp(32px, 5vw, 56px)', color: '#2c3e50', marginBottom: '20px', fontWeight: '900', lineHeight: '1.2', maxWidth: '900px' }}>
                    Ваші секрети під надійним <span style={{ color: '#007BFF' }}>захистом</span>
                </h1>
                
                <p style={{ fontSize: 'clamp(16px, 2vw, 20px)', color: '#666', maxWidth: '700px', lineHeight: '1.6', marginBottom: '40px' }}>
                    SecureChat — це месенджер, де ви самі контролюєте свою приватність. Шифруйте повідомлення за допомогою вбудованих алгоритмів перед відправкою, і ніхто, крім вашого співрозмовника, не зможе їх прочитати.
                </p>

                {/* Адаптивні кнопки */}
                <div style={{ display: 'flex', gap: '20px', marginBottom: '80px', flexWrap: 'wrap', justifyContent: 'center' }}>
                    <Link to="/register" style={{ padding: '15px 35px', backgroundColor: '#28a745', color: '#fff', textDecoration: 'none', borderRadius: '30px', fontSize: '1.1rem', fontWeight: 'bold', boxShadow: '0 4px 10px rgba(40,167,69,0.3)', minWidth: '220px' }}>Почати спілкування</Link>
                    <Link to="/login" style={{ padding: '15px 35px', backgroundColor: '#fff', color: '#333', textDecoration: 'none', borderRadius: '30px', fontSize: '1.1rem', fontWeight: 'bold', border: '1px solid #ccc', minWidth: '220px' }}>У мене є акаунт</Link>
                </div>

                {/* Адаптивні картки переваг */}
                <div style={{ display: 'flex', gap: '30px', justifyContent: 'center', flexWrap: 'wrap', width: '100%', maxWidth: '1200px' }}>
                    
                    <div style={{ backgroundColor: '#ffffff', padding: '30px', borderRadius: '15px', flex: '1 1 300px', maxWidth: '400px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', textAlign: 'left' }}>
                        <div style={{ fontSize: '40px', marginBottom: '15px' }}>🔏</div>
                        <h3 style={{ color: '#2c3e50', marginBottom: '10px' }}>Вибір шифру</h3>
                        <p style={{ color: '#7f8c8d', fontSize: '15px', lineHeight: '1.6' }}>Використовуйте Base64, Шифр Цезаря або пишіть без шифру. У базу даних потрапляє лише закодований текст.</p>
                    </div>

                    <div style={{ backgroundColor: '#ffffff', padding: '30px', borderRadius: '15px', flex: '1 1 300px', maxWidth: '400px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', textAlign: 'left' }}>
                        <div style={{ fontSize: '40px', marginBottom: '15px' }}>⚡</div>
                        <h3 style={{ color: '#2c3e50', marginBottom: '10px' }}>Живий чат</h3>
                        <p style={{ color: '#7f8c8d', fontSize: '15px', lineHeight: '1.6' }}>Бачте, коли ваші друзі онлайн, і спостерігайте за статусом "Друкує..." у реальному часі.</p>
                    </div>

                    <div style={{ backgroundColor: '#ffffff', padding: '30px', borderRadius: '15px', flex: '1 1 300px', maxWidth: '400px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', textAlign: 'left' }}>
                        <div style={{ fontSize: '40px', marginBottom: '15px' }}>🛠️</div>
                        <h3 style={{ color: '#2c3e50', marginBottom: '10px' }}>Повний контроль</h3>
                        <p style={{ color: '#7f8c8d', fontSize: '15px', lineHeight: '1.6' }}>Випадково відправили не те? Ви завжди можете відредагувати або назавжди видалити своє повідомлення.</p>
                    </div>

                </div>
            </div>
            
            {/* Футер */}
            <div style={{ textAlign: 'center', padding: '30px 20px', color: '#aaa', fontSize: '14px', backgroundColor: '#fff', borderTop: '1px solid #eaeaea' }}>
                © 2024 SecureChat. Усі права захищено. Створено з турботою про приватність.
            </div>
        </div>
    );
}

export default HomePage;