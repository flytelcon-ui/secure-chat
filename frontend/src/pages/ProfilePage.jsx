import { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import SiteHeader from '../components/SiteHeader';
import { encryptMessage } from '../utils/ciphers';
import { getCurrentLocation } from '../utils/location';
import './AuthPage.css';
import './ProfilePage.css';

const authHeaders = (token) => ({ Authorization: `Bearer ${token}` });

function ProfilePage() {
    const [profile, setProfile] = useState(null);
    const [username, setUsername] = useState('');
    const [avatar, setAvatar] = useState(null);
    const [bio, setBio] = useState('');
    const [isNameEncrypted, setIsNameEncrypted] = useState(false);
    const [nameCipherType, setNameCipherType] = useState('caesar');
    const [nameCipherKey, setNameCipherKey] = useState('3');
    const [nameSDESKey, setNameSDESKey] = useState('1010101010');
    const [nameCountry, setNameCountry] = useState('');
    const [nameCity, setNameCity] = useState('');
    const [isNameLocationVerified, setIsNameLocationVerified] = useState(false);
    const [isLocatingName, setIsLocatingName] = useState(false);
    const [nameLocationError, setNameLocationError] = useState('');
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [profileError, setProfileError] = useState('');
    const [profileSuccess, setProfileSuccess] = useState('');
    const [profileShareStatus, setProfileShareStatus] = useState('');
    const [profileInviteUrl, setProfileInviteUrl] = useState('');
    const [isCreatingInvite, setIsCreatingInvite] = useState(false);
    const [passwordError, setPasswordError] = useState('');
    const [passwordSuccess, setPasswordSuccess] = useState('');
    const [isSavingProfile, setIsSavingProfile] = useState(false);
    const [isSavingPassword, setIsSavingPassword] = useState(false);
    const navigate = useNavigate();
    const token = localStorage.getItem('token');

    useEffect(() => {
        if (!token) {
            navigate('/login');
            return;
        }

        const loadProfile = async () => {
            try {
                const response = await axios.get('http://localhost:5000/api/auth/profile', { headers: authHeaders(token) });
                setProfile(response.data);
                setUsername(response.data.username);
                setAvatar(response.data.avatar);
                setBio(response.data.bio || '');
                setIsNameEncrypted(response.data.is_name_encrypted);
                if (['caesar', 'transposition', 'sdes'].includes(response.data.name_cipher_type)) {
                    setNameCipherType(response.data.name_cipher_type);
                }
            } catch (err) {
                if (err.response?.status === 401) {
                    localStorage.clear();
                    navigate('/login');
                    return;
                }
                setProfileError(err.response?.data?.message || 'Не вдалося завантажити профіль');
            }
        };

        loadProfile();
    }, [navigate, token]);

    const handleAvatarSelection = (event) => {
        const file = event.target.files?.[0];
        if (!file) return;
        if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
            setProfileError('Оберіть зображення PNG, JPEG або WebP');
            event.target.value = '';
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            setProfileError('Розмір зображення має бути до 5 МБ');
            event.target.value = '';
            return;
        }

        const reader = new FileReader();
        reader.onload = () => {
            const image = new Image();
            image.onload = () => {
                const scale = Math.min(1, 256 / Math.max(image.width, image.height));
                const canvas = document.createElement('canvas');
                canvas.width = Math.max(1, Math.round(image.width * scale));
                canvas.height = Math.max(1, Math.round(image.height * scale));
                const context = canvas.getContext('2d');
                if (!context) {
                    setProfileError('Не вдалося обробити зображення');
                    return;
                }
                context.fillStyle = '#fff';
                context.fillRect(0, 0, canvas.width, canvas.height);
                context.drawImage(image, 0, 0, canvas.width, canvas.height);
                setAvatar(canvas.toDataURL('image/jpeg', 0.82));
                setProfileError('');
                setProfileSuccess('');
            };
            image.onerror = () => setProfileError('Не вдалося обробити зображення');
            image.src = reader.result;
        };
        reader.onerror = () => setProfileError('Не вдалося прочитати зображення');
        reader.readAsDataURL(file);
    };

    const handleProfileSave = async (event) => {
        event.preventDefault();
        setProfileError('');
        setProfileSuccess('');
        if (isNameEncrypted && nameCipherType === 'transposition' && !isNameLocationVerified) {
            setProfileError('Визначте поточну геолокацію перед шифруванням імені.');
            return;
        }
        if (isNameEncrypted && nameCipherType === 'sdes' && !/^[01]{10}$/.test(nameSDESKey)) {
            setProfileError('Ключ S-DES має містити рівно 10 цифр: 0 або 1.');
            return;
        }
        setIsSavingProfile(true);

        try {
            const nameEncryptionKey = nameCipherType === 'transposition'
                ? `${nameCountry}${nameCity}`.toLowerCase().replace(/\s+/g, '')
                : nameCipherType === 'sdes' ? nameSDESKey : nameCipherKey;
            const encryptedName = isNameEncrypted
                ? encryptMessage(username.trim(), nameCipherType, nameEncryptionKey)
                : null;
            const response = await axios.put('http://localhost:5000/api/auth/profile', {
                username: username.trim(),
                avatar,
                bio: bio.trim(),
                is_name_encrypted: isNameEncrypted,
                encrypted_name: encryptedName,
                name_cipher_type: isNameEncrypted ? nameCipherType : 'none'
            }, { headers: authHeaders(token) });

            setProfile(response.data.user);
            setUsername(response.data.user.username);
            setBio(response.data.user.bio || '');
            localStorage.setItem('username', response.data.user.username);
            setProfileSuccess('Профіль збережено');
        } catch (err) {
            setProfileError(err.response?.data?.message || 'Не вдалося зберегти профіль');
        } finally {
            setIsSavingProfile(false);
        }
    };

    const handleNameLocation = async () => {
        setIsLocatingName(true);
        setIsNameLocationVerified(false);
        setNameLocationError('');
        try {
            const currentLocation = await getCurrentLocation();
            setNameCountry(currentLocation.country);
            setNameCity(currentLocation.city);
            setIsNameLocationVerified(true);
        } catch (error) {
            setNameLocationError(error.code === 1
                ? 'Надайте браузеру дозвіл на геолокацію.'
                : error.code === 'UNSUPPORTED'
                    ? 'Браузер не підтримує геолокацію.'
                    : 'Не вдалося визначити країну й місто.');
        } finally {
            setIsLocatingName(false);
        }
    };

    const handlePasswordChange = async (event) => {
        event.preventDefault();
        setPasswordError('');
        setPasswordSuccess('');
        if (newPassword !== confirmPassword) {
            setPasswordError('Нові паролі не збігаються');
            return;
        }

        setIsSavingPassword(true);
        try {
            await axios.put('http://localhost:5000/api/auth/password', {
                currentPassword,
                newPassword
            }, { headers: authHeaders(token) });
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
            setPasswordSuccess('Пароль змінено');
        } catch (err) {
            setPasswordError(err.response?.data?.message || 'Не вдалося змінити пароль');
        } finally {
            setIsSavingPassword(false);
        }
    };

    const handleShareProfile = async () => {
        setIsCreatingInvite(true);
        setProfileInviteUrl('');
        setProfileShareStatus('');
        try {
            const response = await axios.post('http://localhost:5000/api/messages/invites', {}, {
                headers: authHeaders(token)
            });
            const inviteUrl = new URL(`/chat?invite=${encodeURIComponent(response.data.token)}`, window.location.origin).toString();
            setProfileInviteUrl(inviteUrl);
            try {
                await navigator.clipboard.writeText(inviteUrl);
                setProfileShareStatus('Одноразове посилання створено та скопійовано');
            } catch {
                setProfileShareStatus('Посилання створено. Скопіюйте його з поля нижче.');
            }
        } catch (err) {
            setProfileShareStatus(err.response?.data?.message || 'Не вдалося створити посилання');
        } finally {
            setIsCreatingInvite(false);
        }
    };

    const handleCopyInvite = async () => {
        try {
            await navigator.clipboard.writeText(profileInviteUrl);
            setProfileShareStatus('Посилання скопійовано');
        } catch {
            setProfileShareStatus('Не вдалося скопіювати. Виділіть посилання в полі вручну.');
        }
    };

    return (
        <div className="auth-page profile-page">
            <SiteHeader />

            <main className="profile-layout">
                <section className="auth-form-panel profile-panel" aria-labelledby="profile-title">
                    <p className="auth-form-kicker">НАЛАШТУВАННЯ <span>ПРОФІЛЬ</span></p>
                    <h2 id="profile-title">Особисті дані.</h2>
                    <p className="auth-form-intro">Зміни логіну застосуються до наступного входу.</p>

                    {!profile && !profileError && <p className="profile-loading" role="status">Завантаження профілю...</p>}
                    {profileError && <div className="auth-alert auth-alert-error" role="alert">{profileError}</div>}

                    {profile && (
                        <>
                            <div className="profile-share-actions">
                                <button className="profile-share-button" type="button" onClick={handleShareProfile} disabled={isCreatingInvite}>
                                    {isCreatingInvite ? 'Створення посилання...' : 'Створити одноразове посилання'}
                                    {!isCreatingInvite && <span aria-hidden="true">↗</span>}
                                </button>
                                {profileInviteUrl && (
                                    <div className="profile-share-link">
                                        <input
                                            type="text"
                                            value={profileInviteUrl}
                                            readOnly
                                            aria-label="Одноразове посилання для чату"
                                            onFocus={(event) => event.target.select()}
                                        />
                                        <button type="button" onClick={handleCopyInvite}>Копіювати</button>
                                    </div>
                                )}
                                <p className="profile-share-note">Одноразове посилання дійсне 7 днів.</p>
                                {profileShareStatus && <p role="status">{profileShareStatus}</p>}
                            </div>
                            <form className="auth-form profile-form" onSubmit={handleProfileSave}>
                                <label htmlFor="profile-username">Логін</label>
                                <input
                                    id="profile-username"
                                    type="text"
                                    autoComplete="username"
                                    minLength="2"
                                    maxLength="32"
                                    value={username}
                                    onChange={(event) => setUsername(event.target.value)}
                                    required
                                />

                                <label htmlFor="profile-email">Електронна пошта</label>
                                <input id="profile-email" type="email" value={profile.email} readOnly />

                                <label htmlFor="profile-bio">Опис</label>
                                <textarea
                                    id="profile-bio"
                                    value={bio}
                                    onChange={(event) => setBio(event.target.value)}
                                    maxLength={240}
                                    rows={4}
                                    placeholder="Коротко розкажіть про себе"
                                />

                                <label htmlFor="profile-avatar">Аватар (зображення до 5 МБ)</label>
                                <div className="profile-avatar-actions">
                                    <input id="profile-avatar" type="file" accept="image/png,image/jpeg,image/webp" onChange={handleAvatarSelection} />
                                    {avatar && <button type="button" className="profile-remove-avatar" onClick={() => setAvatar(null)}>Видалити аватар</button>}
                                </div>

                                <label className="profile-encryption-option" htmlFor="profile-encrypt-name">
                                    <input
                                        id="profile-encrypt-name"
                                        type="checkbox"
                                        checked={isNameEncrypted}
                                        onChange={(event) => setIsNameEncrypted(event.target.checked)}
                                    />
                                    <span>Показувати іншим зашифроване ім’я</span>
                                </label>

                                {isNameEncrypted && (
                                    <div className="profile-cipher-settings">
                                        <label htmlFor="profile-name-cipher">Метод шифрування</label>
                                        <select
                                            id="profile-name-cipher"
                                            value={nameCipherType}
                                            onChange={(event) => {
                                                setNameCipherType(event.target.value);
                                                setIsNameLocationVerified(false);
                                                setNameLocationError('');
                                            }}
                                        >
                                            <option value="caesar">Шифр Цезаря</option>
                                            <option value="transposition">Шифр перестановки</option>
                                            <option value="sdes">S-DES (блоковий)</option>
                                        </select>
                                        {nameCipherType === 'caesar' ? (
                                            <>
                                                <label htmlFor="profile-name-key">Зсув</label>
                                                <input
                                                    id="profile-name-key"
                                                    type="number"
                                                    value={nameCipherKey}
                                                    onChange={(event) => setNameCipherKey(event.target.value)}
                                                    required
                                                />
                                                <p>Зсув не зберігається. Інші користувачі бачитимуть лише шифротекст.</p>
                                            </>
                                        ) : nameCipherType === 'sdes' ? (
                                            <>
                                                <label htmlFor="profile-name-sdes-key">10-бітний ключ S-DES</label>
                                                <input
                                                    id="profile-name-sdes-key"
                                                    className="profile-sdes-key"
                                                    type="text"
                                                    inputMode="numeric"
                                                    autoComplete="off"
                                                    spellCheck="false"
                                                    value={nameSDESKey}
                                                    onChange={(event) => setNameSDESKey(event.target.value.replace(/[^01]/g, '').slice(0, 10))}
                                                    maxLength={10}
                                                    pattern="[01]{10}"
                                                    placeholder="1010101010"
                                                    required
                                                />
                                                <p>Ім’я буде показане іншим як Hex-шифротекст. Ключ не зберігається у профілі: збережіть його окремо й передайте тим, хто має розшифрувати ім’я.</p>
                                            </>
                                        ) : (
                                            <div className="profile-name-location">
                                                <div className="profile-name-location-fields">
                                                    <label htmlFor="profile-name-country">
                                                        Країна
                                                        <input
                                                            id="profile-name-country"
                                                            type="text"
                                                            value={nameCountry}
                                                            onChange={(event) => {
                                                                setNameCountry(event.target.value);
                                                                setIsNameLocationVerified(false);
                                                                setNameLocationError('');
                                                            }}
                                                            maxLength={40}
                                                            placeholder="Україна"
                                                            disabled={isLocatingName || isSavingProfile}
                                                        />
                                                    </label>
                                                    <label htmlFor="profile-name-city">
                                                        Місто
                                                        <input
                                                            id="profile-name-city"
                                                            type="text"
                                                            value={nameCity}
                                                            onChange={(event) => {
                                                                setNameCity(event.target.value);
                                                                setIsNameLocationVerified(false);
                                                                setNameLocationError('');
                                                            }}
                                                            maxLength={40}
                                                            placeholder="Київ"
                                                            disabled={isLocatingName || isSavingProfile}
                                                        />
                                                    </label>
                                                </div>
                                                <button
                                                    className="profile-name-location-button"
                                                    type="button"
                                                    onClick={handleNameLocation}
                                                    disabled={isLocatingName || isSavingProfile}
                                                >
                                                    {isLocatingName ? 'Визначаємо локацію…' : '📍 Моя локація'}
                                                </button>
                                                {nameLocationError && <p className="profile-name-location-error" role="alert">{nameLocationError}</p>}
                                                <p>Ім’я зможуть розшифрувати лише користувачі з тією самою країною та містом.</p>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {profileSuccess && <div className="auth-alert auth-alert-success" role="status">{profileSuccess}</div>}
                                <button className="auth-submit" type="submit" disabled={isSavingProfile || isLocatingName}>
                                    {isSavingProfile ? 'Збереження...' : 'Зберегти профіль'} <span aria-hidden="true">↗</span>
                                </button>
                            </form>

                            <div className="profile-divider" />
                            <form className="auth-form profile-form" onSubmit={handlePasswordChange}>
                                <div className="profile-password-heading">
                                    <h3>Зміна пароля</h3>
                                    <p>Підтвердіть поточний пароль, щоб установити новий.</p>
                                </div>
                                {passwordError && <div className="auth-alert auth-alert-error" role="alert">{passwordError}</div>}
                                {passwordSuccess && <div className="auth-alert auth-alert-success" role="status">{passwordSuccess}</div>}
                                <label htmlFor="profile-current-password">Поточний пароль</label>
                                <input
                                    id="profile-current-password"
                                    type="password"
                                    autoComplete="current-password"
                                    value={currentPassword}
                                    onChange={(event) => setCurrentPassword(event.target.value)}
                                    required
                                />
                                <label htmlFor="profile-new-password">Новий пароль</label>
                                <input
                                    id="profile-new-password"
                                    type="password"
                                    autoComplete="new-password"
                                    minLength="8"
                                    value={newPassword}
                                    onChange={(event) => setNewPassword(event.target.value)}
                                    required
                                />
                                <label htmlFor="profile-confirm-password">Повторіть новий пароль</label>
                                <input
                                    id="profile-confirm-password"
                                    type="password"
                                    autoComplete="new-password"
                                    minLength="8"
                                    value={confirmPassword}
                                    onChange={(event) => setConfirmPassword(event.target.value)}
                                    required
                                />
                                <button className="auth-submit profile-password-submit" type="submit" disabled={isSavingPassword}>
                                    {isSavingPassword ? 'Збереження...' : 'Змінити пароль'} <span aria-hidden="true">↗</span>
                                </button>
                            </form>
                        </>
                    )}
                </section>
            </main>

            <footer className="auth-footer"><span>SecureChat</span><span>Налаштування вашого профілю</span></footer>
        </div>
    );
}

export default ProfilePage;