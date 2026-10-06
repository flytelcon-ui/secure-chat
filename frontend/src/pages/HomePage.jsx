import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import './HomePage.css';

const slides = [
    {
        label: '01 / СПРОБУЙТЕ ШИФРИ',
        title: 'Побачте, як працює кодування.',
        description: 'Перемикайтеся між шифром Цезаря, перестановкою та звичайним текстом. Це простий спосіб дослідити принципи шифрування просто під час розмови.',
        message: 'Сьогодні перевірю шифр Цезаря',
        mode: 'Шифр Цезаря',
        color: 'coral'
    },
    {
        label: '02 / ЗНАЙДІТЬ ЛЮДЕЙ',
        title: 'Почніть розмову з нового контакту.',
        description: 'Знайдіть користувача за іменем і відкрийте діалог. Контакти, з якими ви вже листувалися, залишаються у списку чатів.',
        message: 'Знайшов тебе в пошуку. На зв’язку?',
        mode: 'Новий діалог',
        color: 'green'
    },
    {
        label: '03 / КЕРУЙТЕ ДІАЛОГОМ',
        title: 'Повідомлення можна змінити.',
        description: 'Редагуйте або видаляйте власні повідомлення, надсилайте зображення та стежте за статусом співрозмовника.',
        message: 'Ось фото з нашої прогулянки',
        mode: 'Зображення готове',
        color: 'yellow'
    }
];

const features = [
    {
        number: '01',
        title: 'Алгоритми на практиці',
        text: 'Порівнюйте звичайний текст, шифр Цезаря та перестановку. Усі методи відкриті й зрозумілі для експериментів.'
    },
    {
        number: '02',
        title: 'Контакти та пошук',
        text: 'Знайдіть потрібне ім’я серед користувачів або поверніться до діалогів, у яких уже спілкувалися.'
    },
    {
        number: '03',
        title: 'Зручне листування',
        text: 'Діліться зображеннями, бачте статуси онлайн і друкування, редагуйте або видаляйте свої повідомлення.'
    }
];

function HomePage() {
    const [activeSlide, setActiveSlide] = useState(0);
    const slide = slides[activeSlide];

    useEffect(() => {
        const timer = window.setInterval(() => {
            setActiveSlide(current => (current + 1) % slides.length);
        }, 7000);

        return () => window.clearInterval(timer);
    }, []);

    const showSlide = (index) => {
        setActiveSlide((index + slides.length) % slides.length);
    };

    return (
        <div className="home-page">
            <div className="home-ambient" aria-hidden="true">
                <span className="home-orb home-orb-one" />
                <span className="home-orb home-orb-two" />
                <span className="home-orb home-orb-three" />
                <span className="home-grid-glow" />
            </div>

            <header className="home-header">
                <Link className="home-brand" to="/" aria-label="SecureChat, головна сторінка">
                    <span className="home-brand-mark" aria-hidden="true">S</span>
                    <span>SecureChat</span>
                </Link>
                <nav className="home-nav" aria-label="Головна навігація">
                    <a href="#features">Можливості</a>
                    <a href="#how-it-works">Як це працює</a>
                    <Link className="home-nav-ciphers" to="/ciphers">Шифри</Link>
                    <Link className="home-login" to="/login">Увійти</Link>
                    <Link className="home-nav-cta" to="/register">Створити акаунт</Link>
                </nav>
            </header>

            <main>
                <section className="home-hero" aria-labelledby="home-title">
                    <div className="home-hero-copy">
                        <p className="home-eyebrow"><span /> МЕСЕНДЖЕР І ПІСОЧНИЦЯ ШИФРІВ</p>
                        <h1 id="home-title">SecureChat<span> для розмов із цікавістю.</span></h1>
                        <p className="home-intro">Спілкуйтеся, знаходьте нові контакти та досліджуйте прості шифри в дії. Оберіть режим повідомлення й подивіться, як змінюється ваша розмова.</p>

                        <div className="home-actions">
                            <Link className="home-primary-cta" to="/register">Спробувати SecureChat <span aria-hidden="true">↗</span></Link>
                            <a className="home-text-link" href="#features">Переглянути можливості <span aria-hidden="true">↓</span></a>
                        </div>
                        <p className="home-disclaimer">Навчальний проєкт із простими шифрами. Не використовуйте його для передавання чутливих даних.</p>
                    </div>

                    <div className={`home-showcase home-showcase-${slide.color}`} aria-label="Слайдер можливостей SecureChat">
                        <div className="showcase-topline">
                            <span>ДЕМО РОЗМОВИ</span>
                            <span className="showcase-live"><i /> ЗАРАЗ У ЧАТІ</span>
                        </div>

                        <div className="showcase-chat">
                            <div className="showcase-contact">
                                <div className="showcase-avatar">М</div>
                                <div><strong>Марія</strong><span>у мережі</span></div>
                                <span className="showcase-dots" aria-hidden="true">•••</span>
                            </div>
                            <div className="showcase-date">СЬОГОДНІ, 14:32</div>
                            <div className="showcase-bubble showcase-incoming">Привіт! Що нового тестуєш?</div>
                            <div className="showcase-bubble showcase-outgoing" key={activeSlide}>
                                {slide.message}
                                <span>14:33&nbsp; ✓✓</span>
                            </div>
                            <div className="showcase-mode"><span className="showcase-mode-mark">↗</span><span>РЕЖИМ</span><strong>{slide.mode}</strong></div>
                        </div>

                        <div className="showcase-caption">
                            <span>ІНТЕРАКТИВНИЙ ОГЛЯД</span>
                            <span>{String(activeSlide + 1).padStart(2, '0')} <i>/</i> {String(slides.length).padStart(2, '0')}</span>
                        </div>

                        <div className="showcase-controls">
                            <div className="showcase-dots-nav" aria-label="Вибрати слайд">
                                {slides.map((item, index) => (
                                    <button
                                        key={item.label}
                                        type="button"
                                        className={activeSlide === index ? 'is-active' : ''}
                                        onClick={() => showSlide(index)}
                                        aria-label={`Слайд ${index + 1}: ${item.title}`}
                                        aria-current={activeSlide === index ? 'true' : undefined}
                                    />
                                ))}
                            </div>
                            <span className="showcase-slide-label">{slide.label}</span>
                            <div className="showcase-arrows">
                                <button type="button" onClick={() => showSlide(activeSlide - 1)} aria-label="Попередній слайд">←</button>
                                <button type="button" onClick={() => showSlide(activeSlide + 1)} aria-label="Наступний слайд">→</button>
                            </div>
                        </div>

                        <div className="showcase-story" aria-live="polite" aria-atomic="true">
                            <h2 key={slide.title}>{slide.title}</h2>
                            <p>{slide.description}</p>
                        </div>
                    </div>
                </section>

                <section className="home-marquee" aria-label="Текстовий слайдер">
                    <div className="home-marquee-track">
                        <div className="home-marquee-group">
                            <span>ШИФР ЦЕЗАРЯ</span><i>✦</i>
                            <span>ПЕРЕСТАНОВКА</span><i>✦</i>
                            <span>ЗВИЧАЙНИЙ ТЕКСТ</span><i>✦</i>
                            <span>ПРИВАТНА РОЗМОВА</span><i>✦</i>
                        </div>
                        <div className="home-marquee-group" aria-hidden="true">
                            <span>ШИФР ЦЕЗАРЯ</span><i>✦</i>
                            <span>ПЕРЕСТАНОВКА</span><i>✦</i>
                            <span>ЗВИЧАЙНИЙ ТЕКСТ</span><i>✦</i>
                            <span>ПРИВАТНА РОЗМОВА</span><i>✦</i>
                        </div>
                    </div>
                </section>

                <section className="home-features" id="features" aria-labelledby="features-title">
                    <div className="section-heading">
                        <p className="home-eyebrow"><span /> НЕ ЛИШЕ ПОВІДОМЛЕННЯ</p>
                        <h2 id="features-title">Усе потрібне для <em>цікавої розмови.</em></h2>
                        <p>Від першого пошуку до останнього редагування — основні інструменти зібрані в одному чаті.</p>
                    </div>
                    <div className="feature-list">
                        {features.map(feature => (
                            <article className="feature-item" key={feature.number}>
                                <span className="feature-number">{feature.number}</span>
                                <div><h3>{feature.title}</h3><p>{feature.text}</p></div>
                                <span className="feature-arrow" aria-hidden="true">↗</span>
                            </article>
                        ))}
                    </div>
                </section>

                <section className="home-how" id="how-it-works" aria-labelledby="how-title">
                    <div className="how-heading">
                        <p className="home-eyebrow"><span /> ТРИ ПРОСТІ КРОКИ</p>
                        <h2 id="how-title">Розмова починається тут.</h2>
                    </div>
                    <ol className="how-steps">
                        <li><span>01</span><h3>Створіть акаунт</h3><p>Зареєструйтеся, щоб відкрити власні чати.</p></li>
                        <li><span>02</span><h3>Знайдіть контакт</h3><p>Шукайте користувачів за іменем і починайте діалог.</p></li>
                        <li><span>03</span><h3>Оберіть режим</h3><p>Пишіть звичайним текстом або досліджуйте доступні шифри.</p></li>
                    </ol>
                </section>

                <section className="home-bottom-cta">
                    <div><p className="home-eyebrow"><span /> ВАША ЧЕРГА</p><h2>Почнімо з «привіт»?</h2></div>
                    <Link className="home-primary-cta" to="/register">Створити акаунт <span aria-hidden="true">↗</span></Link>
                </section>
            </main>

            <footer className="home-footer">
                <Link className="home-brand" to="/">
                    <span className="home-brand-mark" aria-hidden="true">S</span>
                    <span>SecureChat</span>
                </Link>
                <p>Навчальний чат для знайомства з простими шифрами.</p>
                <span>© {new Date().getFullYear()} SecureChat</span>
            </footer>
        </div>
    );
}

export default HomePage;