import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import SiteHeader from '../components/SiteHeader';
import { encryptMessage } from '../utils/ciphers';
import { getCurrentLocation } from '../utils/location';
import './CiphersPage.css';

const cipherDetails = [
    {
        id: 'none',
        name: 'Без шифру',
        shortName: 'Текст',
        description: 'Повідомлення передається у вигляді звичайного тексту. Це варіант для простих, не конфіденційних повідомлень.',
        how: 'Текст залишається незміненим і не потребує ключа.',
        example: 'Привіт! Як у тебе все?',
        color: 'blue',
        icon: 'Aa'
    },
    {
        id: 'caesar',
        name: 'Шифр Цезаря',
        shortName: 'Цезарь',
        description: 'Кожна літера замінюється на іншу в алфавіті на певну кількість позицій. Ключ — це зсув.',
        how: 'Додаємо зсув до коду символу. На декодуванні цей зсув віднімаємо.',
        example: 'HELLO → KHOOR',
        color: 'coral',
        icon: 'C'
    },
    {
        id: 'transposition',
        name: 'Шифр перестановки',
        shortName: 'Перестановка',
        description: 'Текст перемішується за ключем із поточної країни та міста.',
        how: 'Для відновлення тексту потрібен той самий ключ країни й міста, визначений геолокацією.',
        example: 'Одна локація → один ключ',
        color: 'green',
        icon: '↔'
    },
    {
        id: 'sdes',
        name: 'S-DES (блоковий)',
        shortName: 'S-DES',
        description: 'Навчальний блоковий шифр: кожен байт UTF-8 обробляється окремо з 10-бітним ключем, а результат показується у Hex.',
        how: 'S-DES перетворює 8-бітний блок за допомогою підключів, отриманих із 10-бітного ключа. Тут кожен UTF-8 байт шифрується незалежно.',
        example: 'D7 → A8 (ключ 1010000010)',
        color: 'blue',
        icon: '▦'
    }
];

const stepData = [
    { number: '01', title: 'Ви обираєте тип', text: 'Ви можете використовувати звичайний текст або один із трьох шифрів.' },
    { number: '02', title: 'Визначаєте ключ', text: 'Для Цезаря це числовий зсув, для перестановки — країна й місто, для S-DES — 10 бітів.' },
    { number: '03', title: 'Текст шифрується', text: 'Відправник кодує повідомлення перед надішиттям.' },
    { number: '04', title: 'Отримувач розшифровує', text: 'Потрібен той самий ключ; для шифру перестановки — та сама країна й місто.' }
];

function CiphersPage() {
    const [activeCipher, setActiveCipher] = useState('caesar');
    const [sampleText, setSampleText] = useState('Сьогодні перевірю шифр');
    const [keyValue, setKeyValue] = useState('3');
    const [sdesKeyValue, setSdesKeyValue] = useState('1010101010');
    const [isAnimating, setIsAnimating] = useState(false);
    const [country, setCountry] = useState('');
    const [city, setCity] = useState('');
    const [isLocationVerified, setIsLocationVerified] = useState(false);
    const [isLocating, setIsLocating] = useState(false);
    const [locationError, setLocationError] = useState('');

    const active = cipherDetails.find(item => item.id === activeCipher) || cipherDetails[0];
    const transpositionKey = `${country}${city}`.toLowerCase().replace(/\s+/g, '');
    const demoKey = activeCipher === 'transposition'
        ? transpositionKey
        : activeCipher === 'sdes' ? sdesKeyValue : keyValue;
    const hasValidSDESKey = /^[01]{10}$/.test(sdesKeyValue);
    const hasTranspositionKey = Boolean(country.trim() && city.trim() && transpositionKey.replace(/[^\p{L}]/gu, ''));
    const encryptedText = useMemo(
        () => (activeCipher === 'transposition' && !isLocationVerified) || (activeCipher === 'sdes' && !hasValidSDESKey)
            ? ''
            : encryptMessage(sampleText, activeCipher, demoKey),
        [sampleText, activeCipher, demoKey, isLocationVerified, hasValidSDESKey]
    );

    const handleUseMyLocation = async () => {
        setIsLocating(true);
        setIsLocationVerified(false);
        setLocationError('');
        try {
            const currentLocation = await getCurrentLocation();
            setCountry(currentLocation.country);
            setCity(currentLocation.city);
            setIsLocationVerified(true);
        } catch (error) {
            setLocationError(error.code === 1
                ? 'Надайте браузеру дозвіл на геолокацію.'
                : error.code === 'UNSUPPORTED'
                    ? 'Браузер не підтримує геолокацію.'
                    : 'Не вдалося визначити країну й місто.');
        } finally {
            setIsLocating(false);
        }
    };

    const handleAnimate = () => {
        setIsAnimating(true);
        window.setTimeout(() => setIsAnimating(false), 700);
    };

    const scrollToSection = (event, sectionId) => {
        event.preventDefault();
        document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    return (
        <div className="ciphers-page">
            <div className="ciphers-ambient" aria-hidden="true">
                <span className="ciphers-orb ciphers-orb-one" />
                <span className="ciphers-orb ciphers-orb-two" />
                <span className="ciphers-orb ciphers-orb-three" />
            </div>

            <SiteHeader />

            <main>
                <section className="ciphers-hero">
                    <div className="ciphers-hero-copy">
                        <p className="ciphers-eyebrow"><span /> ТЕХНІКИ ТА ШИФРИ</p>
                        <h1>Розумійте,<br /><em>як працює</em> шифрування.</h1>
                        <p className="ciphers-hero-intro">SecureChat використовує прості способи перетворення тексту. Тут можна побачити, як вони працюють, і протестувати їх на власному прикладі.</p>
                        <div className="ciphers-hero-actions">
                            <a href="#methods" className="ciphers-primary-link" onClick={event => scrollToSection(event, 'methods')}>Показати шифри <span>↓</span></a>
                            <Link to="/chat" className="ciphers-secondary-link">Перейти до чата</Link>
                        </div>
                        <div className="ciphers-safety-note">
                            <span>!</span>
                            <p><strong>Важливо:</strong> Шифри навчальні, а браузерну геолокацію можна підмінити. Не використовуйте їх для захисту чутливих даних.</p>
                        </div>
                    </div>

                    <div className="ciphers-demo-card">
                        <div className="ciphers-demo-top">
                            <div><span className="ciphers-demo-dot" /> LIVE DEMO</div>
                            <span>ВІДПРАВЛЕНИЙ ТЕКСТ</span>
                        </div>
                        <div className="ciphers-demo-tabs" role="tablist" aria-label="Вибрати шифр">
                            {cipherDetails.map(item => (
                                <button
                                    type="button"
                                    key={item.id}
                                    className={activeCipher === item.id ? 'is-active' : ''}
                                    onClick={() => setActiveCipher(item.id)}
                                    role="tab"
                                    aria-selected={activeCipher === item.id}
                                >
                                    <span>{item.icon}</span>{item.shortName}
                                </button>
                            ))}
                        </div>

                        <label className="ciphers-input-label" htmlFor="cipher-source-text">Вхідний текст</label>
                        <textarea
                            id="cipher-source-text"
                            value={sampleText}
                            onChange={event => setSampleText(event.target.value)}
                            placeholder="Введіть текст для шифрування"
                        />

                        {activeCipher === 'caesar' && (
                            <div className="ciphers-key-row ciphers-caesar-key">
                                <label htmlFor="cipher-key">Зсув</label>
                                <input
                                    id="cipher-key"
                                    type="number"
                                    value={keyValue}
                                    onChange={event => setKeyValue(event.target.value)}
                                    placeholder="3"
                                />
                                <button type="button" onClick={handleAnimate}>Анімувати</button>
                            </div>
                        )}

                        {activeCipher === 'sdes' && (
                            <div className="ciphers-key-row ciphers-sdes-key">
                                <label htmlFor="cipher-sdes-key">Ключ S-DES</label>
                                <input
                                    id="cipher-sdes-key"
                                    type="text"
                                    inputMode="numeric"
                                    autoComplete="off"
                                    spellCheck="false"
                                    value={sdesKeyValue}
                                    onChange={event => setSdesKeyValue(event.target.value.replace(/[^01]/g, '').slice(0, 10))}
                                    maxLength={10}
                                    placeholder="1010101010"
                                    aria-describedby="cipher-sdes-key-hint"
                                />
                                <p id="cipher-sdes-key-hint" role={hasValidSDESKey ? undefined : 'status'}>
                                    {hasValidSDESKey
                                        ? 'Введіть рівно 10 бітів (0 або 1). S-DES є навчальним шифром.'
                                        : 'Для результату введіть рівно 10 бітів (0 або 1).'}
                                </p>
                                <button type="button" onClick={handleAnimate} disabled={!hasValidSDESKey}>Анімувати</button>
                            </div>
                        )}

                        {activeCipher === 'transposition' && (
                            <div className="ciphers-transposition-key">
                                <div className="ciphers-location-fields">
                                    <label htmlFor="cipher-country">
                                        Країна
                                        <input
                                            id="cipher-country"
                                            type="text"
                                            value={country}
                                            onChange={event => { setCountry(event.target.value); setIsLocationVerified(false); setLocationError(''); }}
                                            maxLength={40}
                                            placeholder="Україна"
                                            disabled={isLocating}
                                        />
                                    </label>
                                    <label htmlFor="cipher-city">
                                        Місто
                                        <input
                                            id="cipher-city"
                                            type="text"
                                            value={city}
                                            onChange={event => { setCity(event.target.value); setIsLocationVerified(false); setLocationError(''); }}
                                            maxLength={40}
                                            placeholder="Київ"
                                            disabled={isLocating}
                                        />
                                    </label>
                                </div>
                                <button type="button" onClick={handleUseMyLocation} disabled={isLocating}>
                                    {isLocating ? 'Визначаємо локацію…' : '📍 Моя локація'}
                                </button>
                                {locationError && <p role="alert">{locationError}</p>}
                                {!isLocationVerified && !locationError && <p>Спершу підтвердіть геолокацію, щоб побачити результат.</p>}
                                {isLocationVerified && hasTranspositionKey && <button type="button" onClick={handleAnimate}>Анімувати</button>}
                            </div>
                        )}
                        {activeCipher === 'none' && (
                            <div className="ciphers-no-key-actions">
                                <button type="button" onClick={handleAnimate}>Анімувати</button>
                            </div>
                        )}

                        <div className={`ciphers-output ${isAnimating ? 'is-animating' : ''}`}>
                            <span>ШИФРОТЕКСТ</span>
                            <p>{encryptedText || (
                                activeCipher === 'transposition' && !isLocationVerified
                                    ? 'Очікується підтвердження локації'
                                    : activeCipher === 'sdes' && !hasValidSDESKey
                                        ? 'Введіть коректний 10-бітний ключ'
                                        : 'Введіть текст'
                            )}</p>
                        </div>
                        <div className="ciphers-demo-foot">
                            <span>{active.name}</span>
                            <span className="ciphers-demo-signal"><i /> ВІДПРАВЛЕНО</span>
                        </div>
                    </div>
                </section>

                <section className="ciphers-methods" id="methods">
                    <div className="ciphers-section-heading">
                        <p className="ciphers-eyebrow"><span /> КОЖДИЙ МЕТОД</p>
                        <h2>Чотири способи працювати<br />з <span>текстом.</span></h2>
                    </div>

                    <div className="cipher-cards">
                        {cipherDetails.map((item, index) => (
                            <article className={`cipher-card cipher-${item.color}`} key={item.id}>
                                <div className="cipher-card-top">
                                    <span className="cipher-index">0{index + 1}</span>
                                    <span className="cipher-symbol">{item.icon}</span>
                                </div>
                                <h3>{item.name}</h3>
                                <p>{item.description}</p>
                                <div className="cipher-example">
                                    <span>ПРИКЛАД</span>
                                    <strong>{item.example}</strong>
                                </div>
                                <div className="cipher-how">
                                    <span>ЯК ЧЕ ПОПРАЦЮВАТИ</span>
                                    <p>{item.how}</p>
                                </div>
                                <button type="button" onClick={() => setActiveCipher(item.id)}>
                                    Спробувати цей метод <span>→</span>
                                </button>
                            </article>
                        ))}
                    </div>
                </section>

                <section className="ciphers-flow" id="how">
                    <div className="ciphers-flow-copy">
                        <p className="ciphers-eyebrow"><span /> ПОКРОК СЬЮМ</p>
                        <h2>Від тексту<br />до <em>зашифрованого</em><br />повідомлення.</h2>
                        <p>Відправник виконує перетворення. Получувач має ключ, щоб виконати зворотне перетворення.</p>
                    </div>
                    <ol className="ciphers-flow-steps">
                        {stepData.map(step => (
                            <li key={step.number}>
                                <span>{step.number}</span>
                                <div><h3>{step.title}</h3><p>{step.text}</p></div>
                            </li>
                        ))}
                    </ol>
                </section>

                <section className="ciphers-cta">
                    <div>
                        <p className="ciphers-eyebrow"><span /> ГОТОВІ ДО ЕКСПЕРИМЕНТУ?</p>
                        <h2>Пробуйте шифр<br />у власному чате.</h2>
                    </div>
                    <Link to="/chat">Відкрити чат <span>↗</span></Link>
                </section>
            </main>

            <footer className="ciphers-footer">
                <Link className="ciphers-brand" to="/"><span aria-hidden="true">S</span> SecureChat</Link>
                <p>Навчальний демонстраційний проєкт.</p>
                <Link to="/">Назад на головну</Link>
            </footer>
        </div>
    );
}

export default CiphersPage;
