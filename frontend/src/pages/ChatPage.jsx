import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useLocation, useNavigate } from 'react-router-dom';
import { encryptMessage, decryptMessage } from '../utils/ciphers';
import './ChatPage.css';

function ChatPage() {
    const [users, setUsers] = useState([]);
    const [activeSidebarTab, setActiveSidebarTab] = useState('chats');
    const [userSearch, setUserSearch] = useState('');
    const [userSearchState, setUserSearchState] = useState({ query: '', status: 'idle', users: [] });
    const [contactDialog, setContactDialog] = useState(null);
    const [contactError, setContactError] = useState('');
    const [contactStatus, setContactStatus] = useState('');
    const [isSavingContact, setIsSavingContact] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [sharedUserResult, setSharedUserResult] = useState({ requestKey: '', error: '' });
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [conversationStatus, setConversationStatus] = useState('');
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    
    const [cipherType, setCipherType] = useState('none');
    const [cipherKey, setCipherKey] = useState('3');
    
    const [revealedMessages, setRevealedMessages] = useState({});
    const [editingMsgId, setEditingMsgId] = useState(null);
    const [activeMenu, setActiveMenu] = useState(null); 
    const [isAttachMenuOpen, setIsAttachMenuOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
    
    const [isDragging, setIsDragging] = useState(false);
    const [pendingImageUrl, setPendingImageUrl] = useState(null);
    
    const messagesEndRef = useRef(null);
    const fileInputRef = useRef(null);
    const location = useLocation();
    const navigate = useNavigate();
    const requestedUserId = new URLSearchParams(location.search).get('user');
    const requestedInviteToken = new URLSearchParams(location.search).get('invite');
    const myUsername = localStorage.getItem('username');
    const token = localStorage.getItem('token');
    const sharedUserRequestKey = requestedInviteToken
        ? `invite:${requestedInviteToken}`
        : requestedUserId ? `user:${requestedUserId}` : '';
    const isLoadingSharedUser = Boolean(token && sharedUserRequestKey && sharedUserResult.requestKey !== sharedUserRequestKey);
    const sharedUserError = sharedUserResult.requestKey === sharedUserRequestKey ? sharedUserResult.error : '';

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth <= 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        if (!isProfileOpen && !contactDialog) return;
        const handleKeyDown = (event) => {
            if (event.key === 'Escape') {
                setIsProfileOpen(false);
                setContactDialog(null);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isProfileOpen, contactDialog]);

    useEffect(() => {
        if (!token) {
            const returnPath = `${location.pathname}${location.search}`;
            navigate(`/login?next=${encodeURIComponent(returnPath)}`, { replace: true });
        }
    }, [location.pathname, location.search, navigate, token]);

    useEffect(() => {
        if (!token || (!requestedInviteToken && !requestedUserId)) return;

        const controller = new AbortController();
        const requestKey = requestedInviteToken
            ? `invite:${requestedInviteToken}`
            : `user:${requestedUserId}`;
        const request = requestedInviteToken
            ? axios.post('http://localhost:5000/api/messages/invites/redeem', { token: requestedInviteToken }, {
                headers: { Authorization: `Bearer ${token}` },
                signal: controller.signal
            })
            : axios.get(`http://localhost:5000/api/messages/users/${encodeURIComponent(requestedUserId)}/profile`, {
                headers: { Authorization: `Bearer ${token}` },
                signal: controller.signal
            });

        request.then(response => {
            setSelectedUser(response.data);
            setSharedUserResult({ requestKey, error: '' });
        }).catch(error => {
            if (!axios.isCancel(error)) {
                const errorMessage = error.response?.status === 410
                    ? 'Посилання вже використали або воно прострочене. Попросіть надіслати нове.'
                    : error.response?.status === 404
                        ? 'Профіль за цим посиланням не знайдено.'
                        : 'Не вдалося відкрити чат за посиланням.';
                setSharedUserResult({ requestKey, error: errorMessage });
            }
        });

        return () => controller.abort();
    }, [requestedInviteToken, requestedUserId, token]);

    useEffect(() => {
        const fetchAll = async () => {
            if (!token) return;
            axios.post('http://localhost:5000/api/messages/ping', {}, { headers: { Authorization: `Bearer ${token}` } }).catch(()=>{});
            try {
                if (selectedUser) {
                    const msgRes = await axios.get(`http://localhost:5000/api/messages/${selectedUser.id}`, { headers: { Authorization: `Bearer ${token}` } });
                    setMessages(prev => JSON.stringify(prev) !== JSON.stringify(msgRes.data) ? msgRes.data : prev);
                }

                const usersRes = await axios.get('http://localhost:5000/api/messages/users', { headers: { Authorization: `Bearer ${token}` } });
                setUsers(prev => JSON.stringify(prev) !== JSON.stringify(usersRes.data) ? usersRes.data : prev);
            } catch (err) {
                console.error(err);
            }
        };

        fetchAll();
        const interval = setInterval(fetchAll, 2000);
        return () => clearInterval(interval);
    }, [selectedUser, token]);

    useEffect(() => {
        const query = userSearch.trim();
        if (activeSidebarTab !== 'chats' || !query || !token) return;

        const controller = new AbortController();
        const timeoutId = setTimeout(async () => {
            setUserSearchState({ query, status: 'loading', users: [] });
            try {
                const response = await axios.get('http://localhost:5000/api/messages/users/search', {
                    params: { q: query },
                    headers: { Authorization: `Bearer ${token}` },
                    signal: controller.signal
                });
                setUserSearchState({ query, status: 'success', users: response.data });
            } catch (err) {
                if (!axios.isCancel(err)) {
                    console.error(err);
                    setUserSearchState({ query, status: 'error', users: [] });
                }
            }
        }, 250);

        return () => {
            clearTimeout(timeoutId);
            controller.abort();
        };
    }, [activeSidebarTab, userSearch, token]);

    useEffect(() => {
        if (!editingMsgId) messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, editingMsgId]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !selectedUser) return;
        const encryptedText = encryptMessage(newMessage, cipherType, cipherKey);
        await sendDataToServer(encryptedText);
    };

    const handleFileSelection = (file) => {
        if (!file || !selectedUser) return;
        if (!file.type.startsWith('image/')) {
            alert('Можна відправляти лише зображення!');
            return;
        }
        if (file.size > 500 * 1024) {
            alert('Будь ласка, використовуйте картинки до 500 КБ, інакше браузер зависне під час шифрування!');
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => setPendingImageUrl(event.target.result);
        reader.readAsDataURL(file);
    };

    const confirmSendImage = () => {
        if (!pendingImageUrl) return;

        const img = new Image();
        img.onload = async () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = 15; 
            canvas.height = 15;
            ctx.drawImage(img, 0, 0, 15, 15);
            const thumbnailBase64 = canvas.toDataURL('image/jpeg', 0.5);

            const encryptedFullImage = encryptMessage(pendingImageUrl, cipherType, cipherKey);
            const payload = `IMG:::${thumbnailBase64}:::${encryptedFullImage}`;
            
            await sendDataToServer(payload);
            cancelSendImage(); 
        };
        img.src = pendingImageUrl;
    };

    const cancelSendImage = () => {
        setPendingImageUrl(null);
        if (fileInputRef.current) fileInputRef.current.value = null;
    };

    const sendDataToServer = async (encryptedText) => {
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
            console.error("Деталі помилки:", err);
            const serverErrorMessage = err.response?.data?.message || err.message;
            alert(`Помилка відправки: ${serverErrorMessage}`);
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

    const handleDeleteConversation = async () => {
        if (!selectedUser || messages.length === 0) return;

        const confirmed = window.confirm(
            `Видалити всю переписку з «${selectedUser.username}» для обох учасників? Контакт залишиться.`
        );
        if (!confirmed) return;

        const userId = selectedUser.id;
        try {
            await axios.delete(`http://localhost:5000/api/messages/conversation/${userId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setMessages([]);
            setSelectedUser(null);
            setConversationStatus('Переписку видалено. Контакт залишився у списку.');
            const usersResponse = await axios.get('http://localhost:5000/api/messages/users', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setUsers(usersResponse.data);
            setUserSearchState(current => ({
                ...current,
                users: current.users.filter(user => user.id !== userId)
            }));
        } catch (err) {
            setConversationStatus(err.response?.data?.message || 'Не вдалося видалити переписку');
        }
    };

    const handleEditClick = (msg, decryptedText, isImage) => {
        setEditingMsgId(msg.id);
        setCipherType(msg.cipher_type);
        if (isImage) {
            setNewMessage('');
        } else {
            setNewMessage(decryptedText);
        }
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

    const refreshContactData = async (userId, wasDeleted = false) => {
        const headers = { Authorization: `Bearer ${token}` };
        const query = userSearch.trim();
        const [usersResponse, searchResponse] = await Promise.all([
            axios.get('http://localhost:5000/api/messages/users', { headers }),
            query
                ? axios.get('http://localhost:5000/api/messages/users/search', { params: { q: query }, headers })
                : Promise.resolve(null)
        ]);

        setUsers(usersResponse.data);
        const refreshedUser = usersResponse.data.find(user => user.id === userId);
        setSelectedUser(current => {
            if (current?.id !== userId) return current;
            if (refreshedUser) return refreshedUser;
            return wasDeleted ? { ...current, username: current.profile_name || current.username, is_contact: false } : current;
        });

        if (searchResponse) {
            setUserSearchState({ query, status: 'success', users: searchResponse.data });
        }
    };

    const openContactDialog = (user) => {
        setContactError('');
        setContactDialog({
            user,
            customName: user.is_contact
                ? user.username
                : user.is_name_encrypted ? '' : (user.profile_name || user.username)
        });
    };

    const handleContactSave = async (event) => {
        event.preventDefault();
        if (!contactDialog) return;

        const customName = contactDialog.customName.trim();
        if ((contactDialog.user.is_contact && !customName) || customName.length > 100) {
            setContactError('Ім’я контакту має містити від 1 до 100 символів');
            return;
        }

        setIsSavingContact(true);
        setContactError('');
        try {
            const { user } = contactDialog;
            const headers = { Authorization: `Bearer ${token}` };
            if (user.is_contact) {
                await axios.put(`http://localhost:5000/api/messages/contacts/${user.id}`, { customName }, { headers });
            } else {
                await axios.post('http://localhost:5000/api/messages/contacts', { contactId: user.id, customName }, { headers });
            }
            await refreshContactData(user.id);
            setContactDialog(null);
            setContactStatus(user.is_contact ? 'Ім’я контакту змінено' : 'Контакт додано');
        } catch (err) {
            setContactError(err.response?.data?.message || 'Не вдалося зберегти контакт');
        } finally {
            setIsSavingContact(false);
        }
    };

    const handleContactDelete = async (user) => {
        if (!window.confirm(`Видалити контакт «${user.username}»? Історія чату залишиться.`)) return;

        try {
            await axios.delete(`http://localhost:5000/api/messages/contacts/${user.id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            await refreshContactData(user.id, true);
            setContactStatus('Контакт видалено. Історію чату збережено.');
        } catch (err) {
            setContactStatus(err.response?.data?.message || 'Не вдалося видалити контакт');
        }
    };

    const switchSidebarTab = (tab) => {
        setActiveSidebarTab(tab);
        setUserSearch('');
        setUserSearchState({ query: '', status: 'idle', users: [] });
        setContactStatus('');
    };

    const handleDragEnter = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (selectedUser) setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.currentTarget.contains(e.relatedTarget)) return;
        setIsDragging(false);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (selectedUser) setIsDragging(true);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        if (selectedUser && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleFileSelection(e.dataTransfer.files[0]);
        }
    };

    const needsKey = ['caesar', 'transposition'].includes(cipherType);
    const searchQuery = userSearch.trim();
    const currentSearch = userSearchState.query === searchQuery ? userSearchState : null;
    const displayedUsers = activeSidebarTab === 'chats'
        ? searchQuery ? (currentSearch?.users ?? []) : users.filter(user => user.has_chat)
        : users.filter(user => user.is_contact);
    const isUserSearchLoading = activeSidebarTab === 'chats' && Boolean(searchQuery) && (!currentSearch || currentSearch.status === 'loading');
    const showSidebar = !isMobile || !selectedUser;
    const showChat = !isMobile || selectedUser;

    return (
        <div className="chat-page" style={{ display: 'flex', height: '100vh', fontFamily: '"Segoe UI", Roboto, Helvetica, Arial, sans-serif', backgroundColor: '#f0f2f5', overflow: 'hidden' }}>
            
            {pendingImageUrl && (
                <div className="chat-image-overlay" style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <div className="chat-image-dialog" style={{ backgroundColor: '#fff', padding: '25px', borderRadius: '15px', maxWidth: '400px', width: '90%', textAlign: 'center', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
                        <h3 style={{ marginTop: 0, marginBottom: '15px', color: '#333' }}>
                            {editingMsgId ? 'Оновити зображення?' : 'Відправити фото?'}
                        </h3>
                        <div className="chat-image-preview" style={{ width: '100%', height: '250px', backgroundColor: '#e9ecef', borderRadius: '10px', overflow: 'hidden', marginBottom: '20px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                            <img src={pendingImageUrl} alt="Preview" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                        </div>
                        <p style={{ fontSize: '14px', color: '#666', marginBottom: '20px' }}>
                            Буде зашифровано як: <strong>{cipherType === 'none' ? 'Без шифру' : (cipherType === 'caesar' ? 'Цезар' : 'Перестановка')}</strong>
                        </p>
                        <div className="chat-image-actions" style={{ display: 'flex', gap: '10px' }}>
                            <button onClick={cancelSendImage} style={{ flex: 1, padding: '12px', borderRadius: '25px', border: 'none', backgroundColor: '#f1f1f1', color: '#333', fontWeight: 'bold', cursor: 'pointer' }}>Скасувати</button>
                            <button onClick={confirmSendImage} style={{ flex: 1, padding: '12px', borderRadius: '25px', border: 'none', backgroundColor: '#007BFF', color: '#fff', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 10px rgba(0,123,255,0.3)' }}>
                                {editingMsgId ? 'Зберегти' : 'Відправити'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {isProfileOpen && selectedUser && (
                <div className="chat-profile-overlay" onClick={() => setIsProfileOpen(false)}>
                    <section
                        className="chat-profile-dialog"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="chat-profile-name"
                        onClick={(event) => event.stopPropagation()}
                    >
                        <button className="chat-profile-close" type="button" aria-label="Закрити профіль" onClick={() => setIsProfileOpen(false)}>×</button>
                        <div className="chat-profile-avatar">
                            {selectedUser.avatar
                                ? <img src={selectedUser.avatar} alt={`Аватар ${selectedUser.username}`} />
                                : selectedUser.username.charAt(0).toUpperCase()}
                        </div>
                        <h2 id="chat-profile-name">{selectedUser.username}</h2>
                        <p className="chat-profile-bio">{selectedUser.bio?.trim() || 'Опис не додано.'}</p>
                    </section>
                </div>
            )}

            {contactDialog && (
                <div className="chat-profile-overlay" onClick={() => setContactDialog(null)}>
                    <section
                        className="chat-profile-dialog chat-contact-dialog"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="contact-dialog-title"
                        onClick={(event) => event.stopPropagation()}
                    >
                        <button className="chat-profile-close" type="button" aria-label="Закрити" onClick={() => setContactDialog(null)}>×</button>
                        <p className="chat-contact-dialog-kicker">{contactDialog.user.is_contact ? 'КОНТАКТ' : 'НОВИЙ КОНТАКТ'}</p>
                        <h2 id="contact-dialog-title">{contactDialog.user.username}</h2>
                        <p className="chat-contact-dialog-hint">
                            {!contactDialog.user.is_contact && contactDialog.user.is_name_encrypted
                                ? 'Залиште порожнім, щоб бачити справжнє ім’я лише у своїх контактах.'
                                : 'Цей підпис бачите лише ви.'}
                        </p>
                        <form onSubmit={handleContactSave}>
                            <label htmlFor="contact-custom-name">Ім’я контакту</label>
                            <input
                                id="contact-custom-name"
                                type="text"
                                value={contactDialog.customName}
                                onChange={(event) => setContactDialog(current => ({ ...current, customName: event.target.value }))}
                                maxLength={100}
                                placeholder="Ім’я за замовчуванням"
                                autoFocus
                                required={contactDialog.user.is_contact}
                            />
                            {contactError && <p className="chat-contact-error" role="alert">{contactError}</p>}
                            <div className="chat-contact-dialog-actions">
                                <button type="button" onClick={() => setContactDialog(null)}>Скасувати</button>
                                <button type="submit" disabled={isSavingContact}>{isSavingContact ? 'Збереження…' : 'Зберегти'}</button>
                            </div>
                        </form>
                    </section>
                </div>
            )}

            <div className="chat-sidebar" style={{ width: isMobile ? '100%' : '320px', display: showSidebar ? 'flex' : 'none', flexDirection: 'column', backgroundColor: '#ffffff', borderRight: '1px solid #ddd', zIndex: 10 }}>
                <div className="chat-sidebar-header" style={{ padding: '20px', backgroundColor: '#f8f9fa', borderBottom: '1px solid #ddd', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <span style={{ fontSize: '14px', color: '#666' }}>Мій профіль</span>
                        <div style={{ fontWeight: 'bold', fontSize: '18px', color: '#333' }}>{myUsername}</div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button className="chat-home-button" onClick={() => navigate('/')} style={{ padding: '8px 10px', backgroundColor: '#e6f2ff', color: '#007BFF', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>Головна</button>
                        <button className="chat-profile-button" onClick={() => navigate('/profile')}>Профіль</button>
                        <button className="chat-logout-button" onClick={handleLogout} style={{ padding: '8px 12px', backgroundColor: '#ff4d4f', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>Вийти</button>
                    </div>
                </div>
                
                <div className="chat-sidebar-content" style={{ flex: 1, overflowY: 'auto', padding: '10px' }}>
                    <div className="chat-sidebar-tabs" role="tablist" aria-label="Розділи чату">
                        <button
                            type="button"
                            role="tab"
                            aria-selected={activeSidebarTab === 'chats'}
                            className={activeSidebarTab === 'chats' ? 'is-active' : ''}
                            onClick={() => switchSidebarTab('chats')}
                        >
                            Чати <span>{users.filter(user => user.has_chat).length}</span>
                        </button>
                        <button
                            type="button"
                            role="tab"
                            aria-selected={activeSidebarTab === 'contacts'}
                            className={activeSidebarTab === 'contacts' ? 'is-active' : ''}
                            onClick={() => switchSidebarTab('contacts')}
                        >
                            Контакти <span>{users.filter(user => user.is_contact).length}</span>
                        </button>
                    </div>
                    {activeSidebarTab === 'chats' && (
                        <input
                            className="chat-search-input"
                            type="search"
                            value={userSearch}
                            onChange={(event) => setUserSearch(event.target.value)}
                            placeholder="Ім’я, шифротекст або ID..."
                            aria-label="Знайти чат або користувача за ім’ям, шифротекстом чи ID"
                        />
                    )}
                    {contactStatus && <p className="chat-contact-status" role="status">{contactStatus}</p>}
                    <ul className="chat-contact-list" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                        {displayedUsers.map(u => {
                            const isActive = selectedUser?.id === u.id;
                            return (
                                <li className={`chat-contact-item ${isActive ? 'is-active' : ''}`} key={u.id}>
                                    <button className="chat-contact-select" type="button" onClick={() => { setSelectedUser(u); setContactStatus(''); }}>
                                        <span className="chat-contact-avatar">
                                            {u.avatar ? <img src={u.avatar} alt="" /> : u.username.charAt(0).toUpperCase()}
                                            {u.isOnline && <span className="chat-contact-online" />}
                                        </span>
                                        <span className="chat-contact-user-copy">
                                            <strong>{u.username}</strong>
                                            {u.isTyping && <small>Друкує...</small>}
                                        </span>
                                    </button>
                                    <div className="chat-contact-actions">
                                        {u.unread_count > 0 && (
                                            <span className="chat-contact-unread" aria-label={`${u.unread_count} непрочитаних повідомлень`}>
                                                {u.unread_count > 99 ? '99+' : u.unread_count}
                                            </span>
                                        )}
                                        {activeSidebarTab === 'contacts' && u.is_contact ? (
                                            <>
                                                <button type="button" onClick={() => openContactDialog(u)} aria-label={`Змінити ім’я контакту ${u.username}`} title="Змінити ім’я">Змінити</button>
                                                <button type="button" onClick={() => handleContactDelete(u)} aria-label={`Видалити контакт ${u.username}`} title="Видалити контакт">×</button>
                                            </>
                                        ) : !u.is_contact && (
                                            <button type="button" onClick={() => openContactDialog(u)}>Додати</button>
                                        )}
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                    {!searchQuery && displayedUsers.length === 0 && (
                        <p className="chat-sidebar-empty">
                            {activeSidebarTab === 'contacts' ? 'Контактів ще немає. Знайдіть користувача вище.' : 'Тут з’являться ваші розмови.'}
                        </p>
                    )}
                    {activeSidebarTab === 'chats' && searchQuery && isUserSearchLoading && (
                        <p style={{ margin: '16px 10px', color: '#888', fontSize: '14px' }}>Пошук...</p>
                    )}
                    {activeSidebarTab === 'chats' && searchQuery && !isUserSearchLoading && currentSearch?.status === 'error' && (
                        <p style={{ margin: '16px 10px', color: '#d93025', fontSize: '14px' }}>Не вдалося виконати пошук</p>
                    )}
                    {activeSidebarTab === 'chats' && searchQuery && !isUserSearchLoading && currentSearch?.status === 'success' && currentSearch.users.length === 0 && (
                        <p style={{ margin: '16px 10px', color: '#888', fontSize: '14px' }}>За цим ім’ям, шифротекстом або ID нікого не знайдено.</p>
                    )}
                </div>
            </div>

            <div
                className="chat-main"
                style={{ flex: 1, display: showChat ? 'flex' : 'none', flexDirection: 'column', backgroundColor: '#e5ddd5', backgroundImage: 'url("https://www.transparenttextures.com/patterns/cubes.png")', width: '100%', position: 'relative' }}
                onDragEnter={handleDragEnter}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
            >
                {conversationStatus && <p className="chat-conversation-notice" role="status">{conversationStatus}</p>}
                {isDragging && selectedUser && (
                    <div className="chat-drop-overlay" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,123,255,0.85)', zIndex: 50, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', color: 'white', border: '4px dashed rgba(255,255,255,0.5)', margin: '10px', borderRadius: '20px', pointerEvents: 'none' }}>
                        <span style={{ fontSize: '60px', marginBottom: '20px' }}>📸</span>
                        <h2 style={{ margin: 0 }}>Відпустіть зображення тут</h2>
                        <p style={{ marginTop: '10px', opacity: 0.8 }}>Воно буде зашифровано перед відправкою</p>
                    </div>
                )}

                {selectedUser ? (
                    <>
                        <div className="chat-conversation-header" style={{ padding: '15px 20px', backgroundColor: '#ffffff', borderBottom: '1px solid #ddd', display: 'flex', alignItems: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', zIndex: 5 }}>
                            {isMobile && (
                                <button className="chat-back-button" onClick={() => setSelectedUser(null)} style={{ background: 'none', border: 'none', fontSize: '24px', marginRight: '15px', cursor: 'pointer', color: '#007BFF' }}>←</button>
                            )}
                            <button className="chat-user-profile-trigger" type="button" onClick={() => setIsProfileOpen(true)} aria-label={`Відкрити профіль: ${selectedUser.username}`}>
                                <span className="chat-conversation-avatar">
                                    {selectedUser.avatar ? <img src={selectedUser.avatar} alt="" /> : selectedUser.username.charAt(0).toUpperCase()}
                                </span>
                                <span className="chat-user-profile-copy">
                                    <strong>{selectedUser.username}</strong>
                                    {selectedUser.isOnline ? <small>В мережі</small> : <small>Не в мережі</small>}
                                </span>
                            </button>
                            {messages.length > 0 && (
                                <button
                                    className="chat-delete-conversation-button"
                                    type="button"
                                    onClick={handleDeleteConversation}
                                    title="Видалити переписку для обох учасників"
                                    aria-label={`Видалити всю переписку з ${selectedUser.username}`}
                                >
                                    Видалити чат
                                </button>
                            )}
                        </div>
                        
                        <div className="chat-conversation-messages" style={{ flex: 1, overflowY: 'auto', padding: isMobile ? '15px' : '30px 40px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            {messages.map(msg => {
                                const isMine = msg.sender_id !== selectedUser.id;
                                const isEncrypted = msg.cipher_type !== 'none';
                                
                                let isImageMessage = false;
                                let rawPayload = msg.encrypted_text;
                                let thumbnail = null;

                                // НОВЕ: 100% надійне витягування мініатюри (ігнорує ":::" всередині шифру)
                                if (msg.encrypted_text.startsWith('IMG:::')) {
                                    isImageMessage = true;
                                    const firstSep = 6; // довжина 'IMG:::'
                                    // Шукаємо тільки перший наступний роздільник
                                    const secondSep = msg.encrypted_text.indexOf(':::', firstSep);
                                    
                                    if (secondSep !== -1) {
                                        thumbnail = msg.encrypted_text.substring(firstSep, secondSep); 
                                        rawPayload = msg.encrypted_text.substring(secondSep + 3); 
                                    } else {
                                        rawPayload = msg.encrypted_text.substring(6); 
                                    }
                                } else if (msg.encrypted_text.startsWith('data:image/')) {
                                    isImageMessage = true;
                                    rawPayload = msg.encrypted_text;
                                }
                                
                                let displayText;
                                if (!isEncrypted || isMine) {
                                    displayText = decryptMessage(rawPayload, msg.cipher_type, cipherKey);
                                } else {
                                    displayText = revealedMessages[msg.id] ? decryptMessage(rawPayload, cipherType, cipherKey) : rawPayload;
                                }

                                const isSuccessfullyDecryptedImage = isImageMessage && typeof displayText === 'string' && displayText.startsWith('data:image/');
                                const showActualImage = !isEncrypted || isSuccessfullyDecryptedImage;
                                
                                const showLongCipher = !isMine && isEncrypted && !revealedMessages[msg.id];
                                const displayCipherText = (showLongCipher && displayText.length > 300) 
                                    ? displayText.substring(0, 300) + '... [Блок даних]' : displayText;

                                return (
                                    <div className={`chat-message-row ${isMine ? 'is-mine' : 'is-other'}`} key={msg.id} style={{ display: 'flex', justifyContent: isMine ? 'flex-end' : 'flex-start' }}>
                                        <div className={`chat-message-bubble ${isMine ? 'is-mine' : 'is-other'} ${isImageMessage ? 'is-image' : ''}`} style={{ 
                                            backgroundColor: (isImageMessage && !showActualImage) ? 'transparent' : (isMine ? '#dcf8c6' : '#ffffff'), 
                                            color: '#333', padding: isImageMessage ? '6px' : '10px 14px', 
                                            borderRadius: isMine ? '15px 15px 0 15px' : '15px 15px 15px 0',
                                            maxWidth: isMobile ? '85%' : '65%', position: 'relative', 
                                            boxShadow: (isImageMessage && !showActualImage) ? 'none' : '0 1px 2px rgba(0,0,0,0.1)'
                                        }}>
                                            
                                            {isImageMessage ? (
                                                <div style={{ position: 'relative', borderRadius: '10px', overflow: 'hidden', minWidth: isMobile ? '200px' : '260px', minHeight: '160px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                                    
                                                    {showActualImage ? (
                                                        <img src={displayText} alt="Секретне фото" style={{ maxWidth: '100%', maxHeight: '300px', display: 'block', borderRadius: '5px' }} />
                                                    ) : (
                                                        <>
                                                            <div style={{ position: 'absolute', width: '100%', height: '100%', overflow: 'hidden', borderRadius: '10px', backgroundColor: '#e9ecef', border: '1px solid #ddd' }}>
                                                                {thumbnail ? (
                                                                    <div style={{ width: '100%', height: '100%', backgroundImage: `url(${thumbnail})`, backgroundSize: 'cover', backgroundPosition: 'center', filter: 'blur(10px)', transform: 'scale(1.2)' }}></div>
                                                                ) : (
                                                                    <div style={{ width: '100%', height: '100%', background: 'repeating-linear-gradient(45deg, #cccccc, #cccccc 10px, #dddddd 10px, #dddddd 20px)', filter: 'blur(3px)' }}></div>
                                                                )}
                                                                <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(255,255,255,0.4)' }}></div>
                                                            </div>
                                                            
                                                            <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', padding: '15px', backgroundColor: 'rgba(255,255,255,0.85)', borderRadius: '15px', textAlign: 'center', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }}>
                                                                {isMine ? (
                                                                    <>
                                                                        <span style={{ fontSize: '24px' }}>🔒</span>
                                                                        <span style={{ color: '#007BFF', fontWeight: 'bold', fontSize: '14px' }}>Зашифровано</span>
                                                                        <span style={{ color: '#666', fontSize: '11px', marginTop: '-5px' }}>Введіть ваш ключ внизу</span>
                                                                    </>
                                                                ) : (
                                                                    revealedMessages[msg.id] ? (
                                                                        <>
                                                                            <span style={{ fontSize: '24px' }}>❌</span>
                                                                            <span style={{ color: '#d93025', fontWeight: 'bold', fontSize: '14px' }}>Помилка</span>
                                                                            <span style={{ color: '#666', fontSize: '11px', marginTop: '-5px' }}>Невірний шифр/пароль</span>
                                                                            <button onClick={() => toggleReveal(msg.id)} style={{ padding: '6px 10px', fontSize: '11px', backgroundColor: '#fff', border: '1px solid #ccc', borderRadius: '5px' }}>Сховати</button>
                                                                        </>
                                                                    ) : (
                                                                        <>
                                                                            <span style={{ fontSize: '28px' }}>🔒</span>
                                                                            <button onClick={() => toggleReveal(msg.id)} style={{ padding: '8px 12px', fontSize: '13px', fontWeight: 'bold', backgroundColor: '#007BFF', color: '#fff', border: 'none', borderRadius: '20px', boxShadow: '0 4px 10px rgba(0,123,255,0.3)' }}>Розшифрувати</button>
                                                                        </>
                                                                    )
                                                                )}
                                                            </div>
                                                        </>
                                                    )}
                                                </div>
                                            ) : (
                                                <>
                                                    <p style={{ margin: '0 0 5px 0', fontSize: '15px', wordWrap: 'break-word', fontFamily: showLongCipher ? 'monospace' : 'inherit' }}>{displayCipherText}</p>
                                                    {!isMine && isEncrypted && (
                                                        <button onClick={() => toggleReveal(msg.id)} style={{ marginTop: '5px', padding: '5px 10px', fontSize: '11px', backgroundColor: revealedMessages[msg.id] ? '#ddd' : '#007BFF', color: revealedMessages[msg.id] ? '#333' : '#fff', border: 'none', borderRadius: '5px' }}>
                                                            {revealedMessages[msg.id] ? '🔒 Приховати' : '🔓 Розшифрувати'}
                                                        </button>
                                                    )}
                                                </>
                                            )}

                                            {(msg.is_edited || isMine) && (
                                                <div style={{ borderTop: isMine ? '1px solid #c1dbad' : '1px solid #eee', paddingTop: '5px', marginTop: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <div>{msg.is_edited && <small style={{ color: '#888', fontSize: '10px', fontStyle: 'italic', marginRight: '10px' }}>(відредаговано)</small>}</div>
                                                    
                                                    {isMine && (
                                                        <div style={{ position: 'relative' }}>
                                                            <button
                                                                type="button"
                                                                onClick={() => setActiveMenu(activeMenu === msg.id ? null : msg.id)}
                                                                aria-label="Дії з повідомленням"
                                                                style={{ width: '26px', height: '26px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, border: 'none', borderRadius: '50%', background: 'transparent', color: '#666', fontSize: '18px', lineHeight: 1, cursor: 'pointer' }}
                                                            >⋮</button>
                                                            {activeMenu === msg.id && (
                                                                <div onMouseLeave={() => setActiveMenu(null)} style={{ position: 'absolute', right: '0', top: '22px', backgroundColor: isMine ? '#dcf8c6' : '#fff', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', borderRadius: '8px', zIndex: 100, display: 'flex', flexDirection: 'column', gap: '4px', width: '130px', padding: '6px', overflow: 'hidden' }}>
                                                                    <button 
                                                                        onClick={() => { handleEditClick(msg, displayText, isImageMessage); setActiveMenu(null); }} 
                                                                        style={{ padding: '10px', border: 'none', borderBottom: '1px solid #eee', background: 'transparent', textAlign: 'left', fontSize: '13px', cursor: 'pointer' }}
                                                                    >
                                                                        Редагувати
                                                                    </button>
                                                                    <button 
                                                                        onClick={() => { handleDelete(msg.id); setActiveMenu(null); }} 
                                                                        style={{ padding: '10px', border: 'none', background: 'transparent', color: '#d93025', textAlign: 'left', fontSize: '13px', cursor: 'pointer' }}
                                                                    >
                                                                        Видалити
                                                                    </button>
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

                        <div className="chat-composer" style={{ padding: isMobile ? '10px' : '20px', backgroundColor: '#f0f0f0', display: 'flex', alignItems: 'center', zIndex: 5 }}>
                            <form className="chat-composer-form" onSubmit={handleSendMessage} style={{ display: 'flex', gap: '10px', flex: 1, alignItems: 'center', flexWrap: isMobile ? 'wrap' : 'nowrap' }}>
                                <div style={{ display: 'flex', gap: '10px', width: isMobile ? '100%' : 'auto', flex: isMobile ? 'none' : '0 0 auto' }}>
                                    <select
                                        className="chat-cipher-select"
                                        value={cipherType} 
                                        onChange={(e) => setCipherType(e.target.value)} 
                                        disabled={editingMsgId} 
                                        style={{ flex: 1, padding: '10px 15px', borderRadius: '25px', border: '1px solid #ccc', backgroundColor: editingMsgId ? '#e0e0e0' : '#fff', color: '#333', outline: 'none', fontWeight: 'bold' }}
                                    >
                                        <option value="none">Без шифру</option>
                                        <option value="caesar">Шифр Цезаря</option>
                                        <option value="transposition">Шифр перестановки</option>
                                    </select>

                                    {needsKey && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flex: 1 }}>
                                            <span style={{ fontSize: '14px', color: '#555', fontWeight: 'bold' }}>{cipherType === 'transposition' ? 'Пароль:' : 'Зсув:'}</span>
                                            <input 
                                                type={cipherType === 'caesar' ? 'number' : 'text'} 
                                                value={cipherKey} 
                                                onChange={(e) => setCipherKey(e.target.value)} 
                                                placeholder={cipherType === 'transposition' ? 'Слово' : '3'}
                                                disabled={editingMsgId}
                                                style={{ width: '100%', minWidth: '60px', padding: '10px', borderRadius: '25px', border: '1px solid #ccc', backgroundColor: editingMsgId ? '#e0e0e0' : '#fff', color: '#333', outline: 'none', fontSize: '14px', textAlign: 'center' }}
                                            />
                                        </div>
                                    )}
                                </div>
                                
                                <div style={{ display: 'flex', gap: '10px', flex: 1, width: isMobile ? '100%' : 'auto', alignItems: 'center' }}>
                                    <input type="file" accept="image/*" style={{ display: 'none' }} ref={fileInputRef} onChange={(e) => handleFileSelection(e.target.files[0])} />
                                    
                                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                                        <button 
                                            type="button" 
                                            onClick={() => setIsAttachMenuOpen(!isAttachMenuOpen)} 
                                            disabled={editingMsgId}
                                            style={{ 
                                                background: '#e0e0e0', border: 'none', borderRadius: '50%', width: '40px', height: '40px', 
                                                display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: editingMsgId ? 'not-allowed' : 'pointer', 
                                                opacity: editingMsgId ? 0.5 : 1, color: '#555', transition: 'background 0.2s' 
                                            }}
                                            onMouseEnter={(e) => e.currentTarget.style.background = '#d0d0d0'}
                                            onMouseLeave={(e) => e.currentTarget.style.background = '#e0e0e0'}
                                        >
                                            <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
                                                <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"></path>
                                            </svg>
                                        </button>

                                        {isAttachMenuOpen && (
                                            <div 
                                                onMouseLeave={() => setIsAttachMenuOpen(false)}
                                                style={{ 
                                                    position: 'absolute', bottom: '50px', left: '0', backgroundColor: '#fff', 
                                                    boxShadow: '0 4px 15px rgba(0,0,0,0.15)', borderRadius: '12px', zIndex: 100, 
                                                    display: 'flex', flexDirection: 'column', width: '170px', overflow: 'hidden', padding: '8px 0' 
                                                }}
                                            >
                                                <button 
                                                    type="button" onClick={() => { fileInputRef.current.click(); setIsAttachMenuOpen(false); }}
                                                    style={{ padding: '12px 15px', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left', fontSize: '14px', color: '#333', display: 'flex', alignItems: 'center', gap: '10px' }}
                                                >
                                                    <span style={{ fontSize: '18px' }}>📸</span> Зображення
                                                </button>
                                                <button 
                                                    type="button" onClick={() => { alert('Відправка файлів ще в розробці!'); setIsAttachMenuOpen(false); }}
                                                    style={{ padding: '12px 15px', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left', fontSize: '14px', color: '#888', display: 'flex', alignItems: 'center', gap: '10px' }}
                                                >
                                                    <span style={{ fontSize: '18px', opacity: 0.7 }}>📄</span> Файл <small style={{fontSize: '10px'}}>(Скоро)</small>
                                                </button>
                                                <button 
                                                    type="button" onClick={() => { alert('Відправка відео ще в розробці!'); setIsAttachMenuOpen(false); }}
                                                    style={{ padding: '12px 15px', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left', fontSize: '14px', color: '#888', display: 'flex', alignItems: 'center', gap: '10px' }}
                                                >
                                                    <span style={{ fontSize: '18px', opacity: 0.7 }}>🎥</span> Відео <small style={{fontSize: '10px'}}>(Скоро)</small>
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                    
                                    <input
                                        className="chat-message-input"
                                        type="text" 
                                        value={newMessage} 
                                        onChange={handleTyping} 
                                        placeholder={editingMsgId ? (newMessage === '' ? "Введіть текст або прикріпіть фото..." : "Редагування...") : "Повідомлення..."} 
                                        style={{ flex: 1, padding: '12px 15px', borderRadius: '25px', border: '1px solid #ccc', backgroundColor: '#fff', color: '#333', outline: 'none', fontSize: '15px' }} 
                                    />
                                    
                                    {editingMsgId && <button type="button" onClick={() => {setEditingMsgId(null); setNewMessage('');}} style={{ padding: '10px', borderRadius: '25px', backgroundColor: '#6c757d', color: 'white', border: 'none', cursor: 'pointer' }}>Скасувати</button>}
                                    <button type="submit" style={{ width: editingMsgId ? 'auto' : '45px', padding: editingMsgId ? '0 15px' : '0', height: '45px', borderRadius: '25px', backgroundColor: editingMsgId ? '#ffc107' : '#007BFF', color: editingMsgId ? '#000' : 'white', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}>{editingMsgId ? 'Зберегти' : '➤'}</button>
                                </div>
                            </form>
                        </div>
                    </>
                ) : (
                    <div className="chat-empty-state" style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', textAlign: 'center', padding: '20px' }}>
                        <h2 style={{ color: '#888' }}>
                            {sharedUserError || (isLoadingSharedUser
                                ? 'Відкриваємо чат за посиланням…'
                                : isMobile ? 'Виберіть чат у списку контактів' : 'Виберіть чат для початку спілкування')}
                        </h2>
                    </div>
                )}
            </div>
        </div>
    );
}

export default ChatPage;