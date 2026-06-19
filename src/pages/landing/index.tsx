import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './landing.scss';

// ── Market ticker ─────────────────────────────────────────────────────────────
type TickerItem = { symbol: string; price: string; change: number; decimals: number };

const INITIAL_MARKETS: TickerItem[] = [
    { symbol: 'Vol 100 (1s)', price: '4218.34', change: +1.24, decimals: 2 },
    { symbol: 'Vol 75 (1s)', price: '892.51', change: -0.67, decimals: 2 },
    { symbol: 'Vol 50 (1s)', price: '513.88', change: +0.43, decimals: 2 },
    { symbol: 'Vol 25 (1s)', price: '211.72', change: +0.19, decimals: 2 },
    { symbol: 'Vol 10 (1s)', price: '94.36', change: -0.11, decimals: 2 },
    { symbol: 'EUR / USD', price: '1.08742', change: +0.03, decimals: 5 },
    { symbol: 'GBP / USD', price: '1.27180', change: -0.08, decimals: 5 },
    { symbol: 'USD / JPY', price: '157.423', change: +0.14, decimals: 3 },
    { symbol: 'AUD / USD', price: '0.65318', change: -0.05, decimals: 5 },
    { symbol: 'XAU / USD', price: '2331.60', change: +0.55, decimals: 2 },
    { symbol: 'WTI Oil', price: '78.24', change: -0.32, decimals: 2 },
    { symbol: 'Vol 100', price: '6741.29', change: +0.88, decimals: 2 },
];

const MarketTicker = () => {
    const [markets, setMarkets] = useState<TickerItem[]>(INITIAL_MARKETS);
    const intervalRef = useRef<ReturnType<typeof setInterval>>();

    useEffect(() => {
        intervalRef.current = setInterval(() => {
            setMarkets(prev =>
                prev.map(m => {
                    const delta = (Math.random() - 0.49) * parseFloat(m.price) * 0.0004;
                    const newPrice = Math.max(0.01, parseFloat(m.price) + delta);
                    const newChange = m.change + (Math.random() - 0.5) * 0.05;
                    return { ...m, price: newPrice.toFixed(m.decimals), change: parseFloat(newChange.toFixed(2)) };
                })
            );
        }, 1200);
        return () => clearInterval(intervalRef.current);
    }, []);

    const items = [...markets, ...markets]; // duplicate for seamless loop

    return (
        <div className='lp__ticker'>
            <div className='lp__ticker-track'>
                {items.map((m, i) => (
                    <div key={i} className='lp__ticker-item'>
                        <span className='lp__ticker-symbol'>{m.symbol}</span>
                        <span className='lp__ticker-price'>{m.price}</span>
                        <span className={`lp__ticker-change lp__ticker-change--${m.change >= 0 ? 'up' : 'down'}`}>
                            {m.change >= 0 ? '▲' : '▼'} {Math.abs(m.change).toFixed(2)}%
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
};

// ── Feature card ──────────────────────────────────────────────────────────────
const Feature = ({
    icon,
    color,
    title,
    desc,
    align = 'left',
}: {
    icon: React.ReactNode;
    color: 'teal' | 'purple' | 'orange';
    title: string;
    desc: string;
    align?: 'left' | 'right';
}) => (
    <div className={`lp__feature lp__feature--${align}`}>
        <div className={`lp__feature-icon lp__feature-icon--${color}`}>{icon}</div>
        <div className='lp__feature-body'>
            <h3 className={`lp__feature-title lp__feature-title--${color}`}>{title}</h3>
            <p className='lp__feature-desc'>{desc}</p>
        </div>
    </div>
);

// ── Pillar ────────────────────────────────────────────────────────────────────
const Pillar = ({
    icon,
    color,
    label,
}: {
    icon: React.ReactNode;
    color: 'teal' | 'purple' | 'orange';
    label: string;
}) => (
    <div className='lp__pillar'>
        <div className={`lp__pillar-icon lp__pillar-icon--${color}`}>{icon}</div>
        <span className={`lp__pillar-label lp__pillar-label--${color}`}>{label}</span>
    </div>
);

// ── Holographic chart ─────────────────────────────────────────────────────────
const HoloChart = () => (
    <div className='lp__holo'>
        <svg className='lp__holo-svg' viewBox='0 0 220 200' fill='none' xmlns='http://www.w3.org/2000/svg'>
            <defs>
                <filter id='glow-teal' x='-40%' y='-40%' width='180%' height='180%'>
                    <feGaussianBlur stdDeviation='4' result='blur' />
                    <feMerge>
                        <feMergeNode in='blur' />
                        <feMergeNode in='SourceGraphic' />
                    </feMerge>
                </filter>
                <filter id='glow-strong' x='-60%' y='-60%' width='220%' height='220%'>
                    <feGaussianBlur stdDeviation='8' result='blur' />
                    <feMerge>
                        <feMergeNode in='blur' />
                        <feMergeNode in='SourceGraphic' />
                    </feMerge>
                </filter>
                <radialGradient id='platform-glow' cx='50%' cy='50%' r='50%'>
                    <stop offset='0%' stopColor='#0bc4a6' stopOpacity='0.6' />
                    <stop offset='100%' stopColor='#0bc4a6' stopOpacity='0' />
                </radialGradient>
                <linearGradient id='bar-grad' x1='0' y1='0' x2='0' y2='1'>
                    <stop offset='0%' stopColor='#00f5d4' />
                    <stop offset='100%' stopColor='#0bc4a6' stopOpacity='0.6' />
                </linearGradient>
                <linearGradient id='arrow-grad' x1='0' y1='1' x2='1' y2='0'>
                    <stop offset='0%' stopColor='#0bc4a6' />
                    <stop offset='100%' stopColor='#00ff88' />
                </linearGradient>
            </defs>

            {/* Platform glow base */}
            <ellipse cx='110' cy='175' rx='80' ry='12' fill='url(#platform-glow)' />
            <ellipse
                cx='110'
                cy='175'
                rx='60'
                ry='8'
                fill='none'
                stroke='#0bc4a6'
                strokeWidth='1'
                strokeOpacity='0.5'
            />
            <ellipse
                cx='110'
                cy='175'
                rx='40'
                ry='5'
                fill='none'
                stroke='#0bc4a6'
                strokeWidth='0.8'
                strokeOpacity='0.7'
            />
            <ellipse
                cx='110'
                cy='175'
                rx='20'
                ry='3'
                fill='none'
                stroke='#0bc4a6'
                strokeWidth='0.6'
                strokeOpacity='0.9'
            />

            {/* Bars */}
            <rect
                className='lp__holo-bar lp__holo-bar--1'
                x='30'
                y='148'
                width='22'
                height='28'
                rx='3'
                fill='url(#bar-grad)'
                filter='url(#glow-teal)'
            />
            <rect
                className='lp__holo-bar lp__holo-bar--2'
                x='62'
                y='120'
                width='22'
                height='56'
                rx='3'
                fill='url(#bar-grad)'
                filter='url(#glow-teal)'
            />
            <rect
                className='lp__holo-bar lp__holo-bar--3'
                x='94'
                y='85'
                width='22'
                height='91'
                rx='3'
                fill='url(#bar-grad)'
                filter='url(#glow-teal)'
            />
            <rect
                className='lp__holo-bar lp__holo-bar--4'
                x='126'
                y='106'
                width='22'
                height='70'
                rx='3'
                fill='url(#bar-grad)'
                filter='url(#glow-teal)'
            />
            <rect
                className='lp__holo-bar lp__holo-bar--5'
                x='158'
                y='130'
                width='22'
                height='46'
                rx='3'
                fill='url(#bar-grad)'
                filter='url(#glow-teal)'
            />

            {/* Rising arrow */}
            <path
                className='lp__holo-arrow'
                d='M 40 155 L 105 50'
                stroke='url(#arrow-grad)'
                strokeWidth='2.5'
                strokeLinecap='round'
                filter='url(#glow-teal)'
            />
            <path
                className='lp__holo-arrow'
                d='M 85 38 L 105 50 L 93 70'
                stroke='url(#arrow-grad)'
                strokeWidth='2.5'
                strokeLinecap='round'
                strokeLinejoin='round'
                filter='url(#glow-teal)'
            />
        </svg>

        {/* Outer glow ring */}
        <div className='lp__holo-ring lp__holo-ring--outer' />
        <div className='lp__holo-ring lp__holo-ring--inner' />
    </div>
);

// ── Icons ─────────────────────────────────────────────────────────────────────
const IconTarget = () => (
    <svg
        width='26'
        height='26'
        viewBox='0 0 24 24'
        fill='none'
        stroke='currentColor'
        strokeWidth='1.8'
        strokeLinecap='round'
    >
        <circle cx='12' cy='12' r='10' />
        <circle cx='12' cy='12' r='6' />
        <circle cx='12' cy='12' r='2' />
        <line x1='12' y1='2' x2='12' y2='6' />
        <line x1='12' y1='18' x2='12' y2='22' />
        <line x1='2' y1='12' x2='6' y2='12' />
        <line x1='18' y1='12' x2='22' y2='12' />
    </svg>
);
const IconChart = () => (
    <svg
        width='26'
        height='26'
        viewBox='0 0 24 24'
        fill='none'
        stroke='currentColor'
        strokeWidth='1.8'
        strokeLinecap='round'
    >
        <line x1='18' y1='20' x2='18' y2='10' />
        <line x1='12' y1='20' x2='12' y2='4' />
        <line x1='6' y1='20' x2='6' y2='14' />
        <line x1='2' y1='20' x2='22' y2='20' />
    </svg>
);
const IconBell = () => (
    <svg
        width='26'
        height='26'
        viewBox='0 0 24 24'
        fill='none'
        stroke='currentColor'
        strokeWidth='1.8'
        strokeLinecap='round'
    >
        <path d='M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9' />
        <path d='M13.73 21a2 2 0 0 1-3.46 0' />
    </svg>
);
const IconLock = () => (
    <svg
        width='26'
        height='26'
        viewBox='0 0 24 24'
        fill='none'
        stroke='currentColor'
        strokeWidth='1.8'
        strokeLinecap='round'
    >
        <rect x='3' y='11' width='18' height='11' rx='2' ry='2' />
        <path d='M7 11V7a5 5 0 0 1 10 0v4' />
    </svg>
);
const IconKnight = () => (
    <svg
        width='28'
        height='28'
        viewBox='0 0 24 24'
        fill='none'
        stroke='currentColor'
        strokeWidth='1.6'
        strokeLinecap='round'
    >
        <path d='M8 16c0-4 2-6 5-8l2 2c1-1 2-1 3 0-1 2-2 3-2 6H8z' />
        <path d='M6 20h12' />
        <path d='M8 16v4' />
        <path d='M16 16v4' />
        <circle cx='14' cy='6' r='1.5' fill='currentColor' />
    </svg>
);
const IconCrown = () => (
    <svg
        width='28'
        height='28'
        viewBox='0 0 24 24'
        fill='none'
        stroke='currentColor'
        strokeWidth='1.8'
        strokeLinecap='round'
        strokeLinejoin='round'
    >
        <path d='M2 17 L5 7 L10 13 L12 5 L14 13 L19 7 L22 17 Z' />
        <line x1='2' y1='20' x2='22' y2='20' />
    </svg>
);
const IconGrowth = () => (
    <svg
        width='28'
        height='28'
        viewBox='0 0 24 24'
        fill='none'
        stroke='currentColor'
        strokeWidth='1.8'
        strokeLinecap='round'
    >
        <polyline points='22 7 13.5 15.5 8.5 10.5 2 17' />
        <polyline points='16 7 22 7 22 13' />
    </svg>
);
const IconShield = () => (
    <svg
        width='28'
        height='28'
        viewBox='0 0 24 24'
        fill='none'
        stroke='currentColor'
        strokeWidth='1.8'
        strokeLinecap='round'
    >
        <path d='M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z' />
        <polyline points='9 12 11 14 15 10' />
    </svg>
);

// ── Page ──────────────────────────────────────────────────────────────────────
const LandingPage = () => {
    const navigate = useNavigate();

    return (
        <div className='lp'>
            {/* Background layers */}
            <div className='lp__bg'>
                <div className='lp__bg-img' style={{ backgroundImage: "url('/assets/images/landing-bg.png')" }} />
                <div className='lp__bg-grid' />
                <div className='lp__bg-glow lp__bg-glow--teal' />
                <div className='lp__bg-glow lp__bg-glow--purple' />
                <svg className='lp__bg-arrow' viewBox='0 0 400 400' fill='none'>
                    <path d='M 20 380 L 370 30' stroke='url(#arrow-bg)' strokeWidth='3' strokeLinecap='round' />
                    <path
                        d='M 330 10 L 375 30 L 355 75'
                        stroke='url(#arrow-bg)'
                        strokeWidth='3'
                        strokeLinecap='round'
                        strokeLinejoin='round'
                    />
                    <defs>
                        <linearGradient id='arrow-bg' x1='0' y1='1' x2='1' y2='0'>
                            <stop offset='0%' stopColor='#0bc4a6' stopOpacity='0' />
                            <stop offset='60%' stopColor='#0bc4a6' stopOpacity='0.35' />
                            <stop offset='100%' stopColor='#00ff88' stopOpacity='0.6' />
                        </linearGradient>
                    </defs>
                </svg>
            </div>

            {/* Nav */}
            <nav className='lp__nav'>
                <div className='lp__nav-logo'>
                    <img src='/assets/images/bossmillan-logo.jpeg' alt='BossMillan' className='lp__nav-img' />
                    <span className='lp__nav-brand'>
                        <span className='lp__nav-brand--boss'>Boss</span>
                        <span className='lp__nav-brand--millan'>Millan</span>
                    </span>
                </div>
                <button className='lp__nav-btn' onClick={() => navigate('/app')}>
                    Launch App
                </button>
            </nav>
            <MarketTicker />

            {/* Hero */}
            <section className='lp__hero'>
                <img src='/assets/images/bossmillan-logo.jpeg' alt='BossMillan' className='lp__hero-logo' />
                <h1 className='lp__hero-brand'>
                    <span className='lp__hero-boss'>Boss</span>
                    <span className='lp__hero-millan'>Millan</span>
                    <span className='lp__hero-dot'>.com</span>
                </h1>
                <div className='lp__hero-sub'>
                    <span className='lp__hero-line' />
                    <span className='lp__hero-subtitle'>Binary&nbsp;&nbsp;Trading</span>
                    <span className='lp__hero-line' />
                </div>
            </section>

            {/* Features */}
            <section className='lp__features'>
                <div className='lp__features-col'>
                    <Feature
                        icon={<IconTarget />}
                        color='teal'
                        title='Accurate Signals'
                        desc='High probability trade setups with precise entry/exit'
                    />
                    <Feature
                        icon={<IconChart />}
                        color='purple'
                        title='Market Insights'
                        desc='Daily market analysis & trend breakdowns'
                    />
                </div>
                <div className='lp__features-center'>
                    <HoloChart />
                </div>
                <div className='lp__features-col'>
                    <Feature
                        icon={<IconBell />}
                        color='orange'
                        title='Live Updates'
                        desc='Real-time trade alerts & important updates'
                        align='right'
                    />
                    <Feature
                        icon={<IconLock />}
                        color='teal'
                        title='Exclusive Content'
                        desc='Tips, strategies & resources only for members'
                        align='right'
                    />
                </div>
            </section>

            {/* Pillars */}
            <section className='lp__pillars'>
                <Pillar icon={<IconKnight />} color='purple' label='Strategy' />
                <div className='lp__pillar-div' />
                <Pillar icon={<IconTarget />} color='teal' label='Discipline' />
                <div className='lp__pillar-div' />
                <Pillar icon={<IconCrown />} color='orange' label='Dominance' />
                <div className='lp__pillar-div' />
                <Pillar icon={<IconGrowth />} color='teal' label='Growth' />
                <div className='lp__pillar-div' />
                <Pillar icon={<IconShield />} color='purple' label='Control' />
            </section>

            {/* Tagline */}
            <footer className='lp__tagline'>
                <span className='lp__tagline-rule' />
                <p className='lp__tagline-text'>
                    <span className='lp__tagline--purple'>Strategy</span>
                    <span className='lp__tagline--white'> Today.&nbsp;</span>
                    <span className='lp__tagline--teal'>Freedom</span>
                    <span className='lp__tagline--white'> Tomorrow.</span>
                </p>
                <span className='lp__tagline-rule' />
            </footer>
        </div>
    );
};

export default LandingPage;
