import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { encryptMessage } from '../utils/ciphers';
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
        description: 'Текст записується у таблицю, а потім читається за стовпцями в ключовому порядку.',
        how: 'Ключ формує кількість стовпців і порядок їх читання. Слова можуть змінитися, але не втрати їх більше.',
        example: 'ПРИВІТ → ПВІРТ',
        color: 'green',
        icon: '↔'
    }
];

const stepData = [
    { number: '01', title: 'Ви обираєте тип', text: 'Ви можете використовувати звичайний текст або один з двох шифрів.' },
    { number: '02', title: 'Вказуєте ключ', text: 'Для Цезаря це зсув, для перестановки — слово або фраза.' },
    { number: '03', title: 'Текст шифрується', text: 'Відправник кодує повідомлення перед надішиттям.' },
    { number: '04', title: 'Получувач розшарфує', text: 'Відправлене повідомлення можна розшифрувати тільки за ключем.' }
];

function CiphersPage() {
    const [activeCipher, setActiveCipher] = useState('caesar');
    const [sampleText, setSampleText] = useState('Сьогодні перевірю шифр');
    const [keyValue, setKeyValue] = useState('3');
    const [isAnimating, setIsAnimating] = useState(false);

    const active = cipherDetails.find(item => item.id === activeCipher) || cipherDetails[0];
    const encryptedText = useMemo(
        () => encryptMessage(sampleText, activeCipher, keyValue),
        [sampleText, activeCipher, keyValue]
    );

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

            <header className="ciphers-header">
                <Link className="ciphers-brand" to="/">
                    <span aria-hidden="true">S</span>
                    SecureChat
                </Link>
                <nav aria-label="Навігація по шифрам">
                    <a href="#methods" onClick={event => scrollToSection(event, 'methods')}>Методи</a>
                    <a href="#how" onClick={event => scrollToSection(event, 'how')}>Як це працює</a>
                    <Link to="/register">Створити акаунт</Link>
                </nav>
            </header>

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
                            <p><strong>Важливо:</strong> Ці шифри — навчальні. Для чутливних даних не варто використовувати їх як заміну сучасного шифрування.</p>
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

                        <div className="ciphers-key-row">
                            <label htmlFor="cipher-key">Ключ</label>
                            <input
                                id="cipher-key"
                                type={activeCipher === 'caesar' ? 'number' : 'text'}
                                value={keyValue}
                                onChange={event => setKeyValue(event.target.value)}
                                disabled={activeCipher === 'none'}
                                placeholder={activeCipher === 'caesar' ? 'Зсув' : 'Слово'}
                            />
                            <button type="button" onClick={handleAnimate}>Анімувати</button>
                        </div>

                        <div className={`ciphers-output ${isAnimating ? 'is-animating' : ''}`}>
                            <span>ШИФРОТЕКСТ</span>
                            <p>{encryptedText || 'Введіть текст'}</p>
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
                        <h2>Три способи робити<br />з <span>текстом.</span></h2>
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
