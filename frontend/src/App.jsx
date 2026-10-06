import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import HomePage from './pages/HomePage'; // Підключаємо головну сторінку
import CiphersPage from './pages/CiphersPage';
import RegisterPage from './pages/RegisterPage';
import LoginPage from './pages/LoginPage';
import ChatPage from './pages/ChatPage';
import ProfilePage from './pages/ProfilePage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Головна сторінка */}
        <Route path="/" element={<HomePage />} />
        <Route path="/ciphers" element={<CiphersPage />} />
        
        {/* Сторінки авторизації та чату */}
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/chat" element={<ChatPage />} /> 
        <Route path="/profile" element={<ProfilePage />} />
        
        {/* Якщо ввели неіснуючу адресу - кидаємо на головну */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;