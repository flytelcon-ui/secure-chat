import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { encryptMessage, decryptMessage } from '../utils/ciphers';

function ChatPage() {
    const [users, setUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [cipherType, setCipherType] = useState('none');
    const [caesarShift, setCaesarShift] = useState(3);
    
    const [revealedMessages, setRevealedMessages] = useState({});
    const [editingMsgId, setEditingMsgId] = useState(null);
    const [activeMenu, setActiveMenu] = useState(null); 
    
    const messagesEndRef = useRef(null);
    const navigate = useNavigate();
    const myUsername = localStorage.getItem('username');
    const token = localStorage.getItem('token');

    useEffect(() => {
        if (!token) navigate('/login');
    }, [navigate, token]);

    useEffect(() => {
        const fetchAll = async () => {
            if (!token) return;
            axios.post('http://localhost:5000/api/messages/ping', {}, { headers: { Authorization: `Bearer ${token}` } }).catch(()=>{});
            try {
                const usersRes = await axios.get('http://localhost:5000/api/messages/users', { headers: { Authorization: `Bearer ${token}` } });
                setUsers(prev => JSON.stringify(prev) !== JSON.stringify(usersRes.data) ? usersRes.data : prev);

                if (selectedUser) {
                    const msgRes = await axios.get(`http://localhost:5000/api/messages/${selectedUser.id}`, { headers: { Authorization: `Bearer ${token}` } });
                    setMessages(prev => JSON.stringify(prev) !== JSON.stringify(msgRes.data) ? msgRes.data : prev);
                }
            } catch (err) {
                console.error(err);
            }
        };

        fetchAll();
        const interval = setInterval(fetchAll, 2000);
        return () => clearInterval(interval);
    }, [selectedUser, token]);

    useEffect(() => {
        if (!editingMsgId) messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, editingMsgId]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !selectedUser) return;

        const encryptedText = encryptMessage(newMessage, cipherType, caesarShift);

        try {
            if (editingMsgId) {
                await axios.put(`http://localhost:5000/api/messages/${editingMsgId}`, 
                    { encryptedText, cipherType },
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                setEditingMsgId(null);
            } else {
                await axios.post('http://localhost:5000/api/messages/send', 
                    { receiverId: selectedUser.id, encryptedText, cipherType },
                    { headers: { Authorization: `Bearer ${token}` } }
                );
            }
            const res = await axios.get(`http://localhost:5000/api/messages/${selectedUser.id}`, { headers: { Authorization: `Bearer ${token}` } });
            setMessages(res.data);
            setNewMessage('');
        } catch (err) {
            console.error(err);
        }
    };

    const handleDelete = async (msgId) => {
        if (!window.confirm('Ви впевнені, що хочете видалити повідомлення?')) return;
        try {
            await axios.delete(`http://localhost:5000/api/messages/${msgId}`, { headers: { Authorization: `Bearer ${token}` } });
            setMessages(messages.filter(m => m.id !== msgId));
        } catch (err) {
            console.error("Помилка видалення", err);
        }
    };

    const handleEditClick = (msg, decryptedText) => {
        setEditingMsgId(msg.id);
        setCipherType(msg.cipher_type);
        setNewMessage(decryptedText);
    };

    const handleTyping = (e) => {
        setNewMessage(e.target.value);
        if (selectedUser) {
            axios.post('http://localhost:5000/api/messages/typing', { receiverId: selectedUser.id }, { headers: { Authorization: `Bearer ${token}` } }).catch(()=>{});
        }
    };

    const toggleReveal = (msgId) => {
        setRevealedMessages(prev => ({ ...prev, [msgId]: !prev[msgId] }));
    };

    const handleLogout = () => {
        localStorage.clear();
        navigate('/login');
    };

    // ВИПРАВЛЕНО: Прибрали прогресивний цезар з перевірки поля "Ключ"
    const needsKey = ['caesar', 'transposition'].includes(cipherType);

    return (
        <div style={{ display: 'flex', height: '100vh', fontFamily: '"Segoe UI", Roboto, Helvetica, Arial, sans-serif', backgroundColor: '#f0f2f5' }}>
            
            <div style={{ width: '320px', backgroundColor: '#ffffff', display: 'flex', flexDirection: 'column', borderRight: '1px solid #ddd', boxShadow: '2px 0 5px rgba(0,0,0,0.05)', zIndex: 10 }}>
                <div style={{ padding: '20px', backgroundColor: '#f8f9fa', borderBottom: '1px solid #ddd', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <span style={{ fontSize: '14px', color: '#666' }}>Мій профіль</span>
                        <div style={{ fontWeight: 'bold', fontSize: '18px', color: '#333' }}>{myUsername}</div>
                    </div>
                    <button onClick={handleLogout} style={{ padding: '8px 12px', backgroundColor: '#ff4d4f', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
                        Вийти
                    </button>
                </div>
                
                <div style={{ flex: 1, overflowY: 'auto', padding: '10px' }}>
                    <h4 style={{ margin: '10px 10px 15px', color: '#888', textTransform: 'uppercase', fontSize: '12px', letterSpacing: '1px' }}>Чати</h4>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                        {users.map(u => {
                            const isActive = selectedUser?.id === u.id;
                            return (
                                <li key={u.id} onClick={() => setSelectedUser(u)}
                                    style={{ 
                                        padding: '15px', margin: '0 0 8px 0', cursor: 'pointer',
                                        backgroundColor: isActive ? '#e6f2ff' : 'transparent',
                                        borderRadius: '12px', display: 'flex', alignItems: 'center', position: 'relative'
                                    }}>
                                    
                                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: isActive ? '#007BFF' : '#ccc', color: 'white', display: 'flex', justifyContent: 'center', alignItems: 'center', fontWeight: 'bold', fontSize: '18px', marginRight: '15px', position: 'relative' }}>
                                        {u.username.charAt(0).toUpperCase()}
                                        {u.isOnline && <div style={{ position: 'absolute', bottom: 0, right: 0, width: '12px', height: '12px', backgroundColor: '#28a745', border: '2px solid white', borderRadius: '50%' }}></div>}
                                    </div>
                                    
                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                        <span style={{ fontWeight: isActive ? 'bold' : 'normal', color: isActive ? '#007BFF' : '#333', fontSize: '16px' }}>{u.username}</span>
                                        {u.isTyping && <span style={{ fontSize: '12px', color: '#007BFF', fontStyle: 'italic' }}>Друкує...</span>}
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                </div>
            </div>

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#e5ddd5', backgroundImage: 'url("https://www.transparenttextures.com/patterns/cubes.png")' }}>
                {selectedUser ? (
                    <>
                        <div style={{ padding: '20px', backgroundColor: '#ffffff', borderBottom: '1px solid #ddd', display: 'flex', alignItems: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                            <div style={{ width: '45px', height: '45px', borderRadius: '50%', backgroundColor: '#007BFF', color: 'white', display: 'flex', justifyContent: 'center', alignItems: 'center', fontWeight: 'bold', fontSize: '20px', marginRight: '15px' }}>
                                {selectedUser.username.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <h2 style={{ margin: 0, color: '#333', fontSize: '20px' }}>{selectedUser.username}</h2>
                                {selectedUser.isOnline ? <small style={{color: '#28a745'}}>В мережі</small> : <small style={{color: '#888'}}>Не в мережі</small>}
                            </div>
                        </div>
                        
                        <div style={{ flex: 1, overflowY: 'auto', padding: '30px 40px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            {messages.map(msg => {
                                const isMine = msg.sender_id !== selectedUser.id;
                                const isEncrypted = msg.cipher_type !== 'none';
                                
                                let displayText;
                                if (!isEncrypted || isMine) {
                                    displayText = decryptMessage(msg.encrypted_text, msg.cipher_type, caesarShift);
                                } else {
                                    displayText = revealedMessages[msg.id] 
                                        ? decryptMessage(msg.encrypted_text, msg.cipher_type, caesarShift) 
                                        : msg.encrypted_text;
                                }
                                
                                return (
                                    <div key={msg.id} style={{ display: 'flex', justifyContent: isMine ? 'flex-end' : 'flex-start' }}>
                                        <div style={{ 
                                            backgroundColor: isMine ? '#dcf8c6' : '#ffffff', color: '#333',
                                            padding: '12px 16px', borderRadius: isMine ? '15px 15px 0 15px' : '15px 15px 15px 0',
                                            maxWidth: '65%', position: 'relative', boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
                                        }}>
                                            <p style={{ margin: '0 0 5px 0', fontSize: '15px', wordWrap: 'break-word', fontFamily: (!isMine && isEncrypted && !revealedMessages[msg.id]) ? 'monospace' : 'inherit' }}>
                                                {displayText}
                                            </p>
                                            
                                            {!isMine && isEncrypted && (
                                                <button onClick={() => toggleReveal(msg.id)} style={{ marginTop: '5px', padding: '5px 10px', fontSize: '11px', backgroundColor: revealedMessages[msg.id] ? '#ddd' : '#007BFF', color: revealedMessages[msg.id] ? '#333' : '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
                                                    {revealedMessages[msg.id] ? '🔒 Приховати' : '🔓 Розшифрувати'}
                                                </button>
                                            )}

                                            {(msg.is_edited || isMine) && (
                                                <div style={{ borderTop: isMine ? '1px solid #c1dbad' : '1px solid #eee', paddingTop: '5px', marginTop: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <div>
                                                        {msg.is_edited && <small style={{ color: '#888', fontSize: '10px', fontStyle: 'italic', marginRight: '10px' }}>(відредаговано)</small>}
                                                    </div>
                                                    
                                                    {isMine && (
                                                        <div style={{ position: 'relative' }}>
                                                            <span 
                                                                onClick={() => setActiveMenu(activeMenu === msg.id ? null : msg.id)} 
                                                                style={{ fontSize: '18px', cursor: 'pointer', padding: '0 5px', color: '#666', userSelect: 'none', lineHeight: '1' }}
                                                            >
                                                                ⋮
                                                            </span>
                                                            
                                                            {activeMenu === msg.id && (
                                                                <div 
                                                                    onMouseLeave={() => setActiveMenu(null)}
                                                                    style={{ 
                                                                        position: 'absolute', right: '0', top: '22px', backgroundColor: '#fff', 
                                                                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)', borderRadius: '8px', zIndex: 100, 
                                                                        display: 'flex', flexDirection: 'column', width: '130px', overflow: 'hidden' 
                                                                    }}
                                                                >
                                                                    <button onClick={() => { handleEditClick(msg, displayText); setActiveMenu(null); }} style={{ padding: '10px', background: 'transparent', border: 'none', borderBottom: '1px solid #eee', cursor: 'pointer', textAlign: 'left', fontSize: '13px', color: '#333' }}>Редагувати</button>
                                                                    <button onClick={() => { handleDelete(msg.id); setActiveMenu(null); }} style={{ padding: '10px', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left', fontSize: '13px', color: '#d93025' }}>Видалити</button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                            <div ref={messagesEndRef} />
                        </div>

                        <div style={{ padding: '20px', backgroundColor: '#f0f0f0', display: 'flex', alignItems: 'center' }}>
                            <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '15px', flex: 1, alignItems: 'center' }}>
                                <select 
                                    value={cipherType} 
                                    onChange={(e) => setCipherType(e.target.value)} 
                                    disabled={editingMsgId} 
                                    style={{ padding: '12px 15px', borderRadius: '25px', border: '1px solid #ccc', backgroundColor: editingMsgId ? '#e0e0e0' : '#fff', color: '#333', outline: 'none', fontWeight: 'bold', cursor: 'pointer' }}
                                >
                                    <option value="none">Без шифру</option>
                                    <option value="caesar">Звичайний Цезар</option>
                                    {/* ВИПРАВЛЕНО: Прибрали опцію Прогресивного Цезаря */}
                                    <option value="transposition">Шифр перестановки</option>
                                </select>

                                {needsKey && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span style={{ fontSize: '14px', color: '#555', fontWeight: 'bold' }}>Ключ:</span>
                                        <input 
                                            type="number" 
                                            value={caesarShift} 
                                            onChange={(e) => setCaesarShift(e.target.value)} 
                                            disabled={editingMsgId}
                                            style={{ width: '70px', padding: '12px 10px', borderRadius: '25px', border: '1px solid #ccc', backgroundColor: editingMsgId ? '#e0e0e0' : '#fff', color: '#333', outline: 'none', fontSize: '15px', textAlign: 'center' }}
                                        />
                                    </div>
                                )}
                                
                                <input 
                                    type="text" 
                                    value={newMessage} 
                                    onChange={handleTyping} 
                                    placeholder={editingMsgId ? "Редагування повідомлення..." : "Напишіть повідомлення..."} 
                                    style={{ flex: 1, padding: '15px 20px', borderRadius: '25px', border: '1px solid #ccc', backgroundColor: '#fff', color: '#333', outline: 'none', fontSize: '15px' }} 
                                />
                                
                                {editingMsgId && (
                                    <button type="button" onClick={() => {setEditingMsgId(null); setNewMessage('');}} style={{ padding: '10px 15px', borderRadius: '25px', backgroundColor: '#6c757d', color: 'white', border: 'none', cursor: 'pointer' }}>Скасувати</button>
                                )}

                                <button type="submit" style={{ width: editingMsgId ? 'auto' : '50px', padding: editingMsgId ? '0 15px' : '0', height: '50px', borderRadius: '25px', backgroundColor: editingMsgId ? '#ffc107' : '#007BFF', color: editingMsgId ? '#000' : 'white', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>
                                    {editingMsgId ? 'Зберегти' : '➤'}
                                </button>
                            </form>
                        </div>
                    </>
                ) : (
                    <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}><h2 style={{ color: '#888' }}>Виберіть чат</h2></div>
                )}
            </div>
        </div>
    );
}

export default ChatPage;