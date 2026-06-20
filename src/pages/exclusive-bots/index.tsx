import { useState } from 'react';
import { observer } from 'mobx-react-lite';
import { load, save_types } from '@/external/bot-skeleton';
import { useStore } from '@/hooks/useStore';
import './exclusive-bots.scss';

interface ExclusiveBot {
    id: string;
    name: string;
    description: string;
    fileName: string;
    category: string;
    locked: boolean;
}

const BOTS: ExclusiveBot[] = [
    {
        id: '1',
        name: 'Neutrade',
        description:
            'Neutral market strategy that profits in both rising and falling conditions using adaptive position sizing.',
        fileName: 'neutrade.xml',
        category: 'Neutral',
        locked: false,
    },
    {
        id: '2',
        name: 'Straddle Edge',
        description: 'Dual-direction straddle bot that captures breakout moves before the market commits to a trend.',
        fileName: 'straddle_edge.xml',
        category: 'Straddle',
        locked: false,
    },
    {
        id: '3',
        name: 'VoltScalper Apex AI',
        description: 'AI-driven volatility scalper engineered for high-frequency entries on synthetic indices.',
        fileName: 'voltscalper_apex_ai.xml',
        category: 'AI Scalping',
        locked: false,
    },
    {
        id: '4',
        name: 'Deriv Wizard Scalper',
        description: 'Precision scalping wizard built specifically for Deriv markets with real-time signal filtering.',
        fileName: 'deriv_wizard_scalper.xml',
        category: 'Scalping',
        locked: false,
    },
    {
        id: '5',
        name: 'Apex AI',
        description:
            'Apex-tier artificial intelligence bot combining multi-signal confluence for elite trade accuracy.',
        fileName: 'apex_ai.xml',
        category: 'AI',
        locked: false,
    },
];

const LockIcon = () => (
    <svg
        width='14'
        height='14'
        viewBox='0 0 24 24'
        fill='none'
        stroke='currentColor'
        strokeWidth='2.2'
        strokeLinecap='round'
        strokeLinejoin='round'
    >
        <rect x='3' y='11' width='18' height='11' rx='2' />
        <path d='M7 11V7a5 5 0 0 1 10 0v4' />
    </svg>
);

const ArrowIcon = () => (
    <svg
        width='14'
        height='14'
        viewBox='0 0 24 24'
        fill='none'
        stroke='currentColor'
        strokeWidth='2.5'
        strokeLinecap='round'
        strokeLinejoin='round'
    >
        <path d='M5 12h14M12 5l7 7-7 7' />
    </svg>
);

const DiamondIcon = () => (
    <svg
        width='16'
        height='16'
        viewBox='0 0 24 24'
        fill='none'
        stroke='currentColor'
        strokeWidth='1.8'
        strokeLinecap='round'
        strokeLinejoin='round'
    >
        <path d='M2.7 10.3a2.41 2.41 0 0 0 0 3.41l7.59 7.59a2.41 2.41 0 0 0 3.41 0l7.59-7.59a2.41 2.41 0 0 0 0-3.41L13.7 2.71a2.41 2.41 0 0 0-3.41 0z' />
    </svg>
);

const ExclusiveBots = observer(() => {
    const { dashboard } = useStore();
    const [loadingId, setLoadingId] = useState<string | null>(null);

    const loadBot = async (bot: ExclusiveBot) => {
        if (bot.locked) return;
        try {
            setLoadingId(bot.id);
            const res = await fetch(`/bots/exclusive/${bot.fileName}`);
            if (!res.ok) throw new Error('Failed to fetch bot file');
            await load({
                block_string: await res.text(),
                file_name: bot.name,
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                workspace: (window as any).Blockly?.derivWorkspace,
                from: save_types.LOCAL,
                drop_event: null,
                strategy_id: null,
                showIncompatibleStrategyDialog: null,
            });
            dashboard.setActiveTab(1);
            window.location.hash = 'bot_builder';
        } catch (e) {
            // eslint-disable-next-line no-console
            console.error('Error loading bot:', e);
        } finally {
            setLoadingId(null);
        }
    };

    return (
        <div className='excl'>
            {/* Background layers */}
            <div className='excl__bg-grid' />
            <div className='excl__bg-glow excl__bg-glow--teal' />
            <div className='excl__bg-glow excl__bg-glow--purple' />
            <div className='excl__bg-glow excl__bg-glow--orange' />

            {/* Hero */}
            <div className='excl__hero'>
                <div className='excl__hero-badge'>
                    <DiamondIcon />
                    <span>Exclusive Access</span>
                </div>
                <h1 className='excl__hero-title'>
                    <span className='excl__hero-title--plain'>BossMillan</span>
                    <br />
                    <span className='excl__hero-title--gradient'>Signature Bots</span>
                </h1>
                <p className='excl__hero-sub'>Four precision-engineered strategies. Built for serious traders.</p>
                <div className='excl__hero-divider' />
            </div>

            {/* Bot cards */}
            <div className='excl__grid'>
                {BOTS.map((bot, i) => (
                    <div key={bot.id} className={`excl-card${bot.locked ? ' excl-card--locked' : ''}`}>
                        <div className='excl-card__border' />

                        <div className='excl-card__num'>{String(i + 1).padStart(2, '0')}</div>

                        <div className='excl-card__content'>
                            <span className='excl-card__category'>{bot.category}</span>
                            <h2 className='excl-card__name'>{bot.name}</h2>
                            <p className='excl-card__desc'>{bot.description}</p>
                        </div>

                        {bot.locked ? (
                            <button className='excl-card__btn excl-card__btn--locked' disabled>
                                <LockIcon />
                                <span>Members Only</span>
                            </button>
                        ) : (
                            <button
                                className='excl-card__btn'
                                onClick={() => loadBot(bot)}
                                disabled={loadingId === bot.id}
                                aria-label={`Load ${bot.name}`}
                            >
                                {loadingId === bot.id ? (
                                    <span className='excl-card__spinner' />
                                ) : (
                                    <>
                                        <span>Load Strategy</span>
                                        <ArrowIcon />
                                    </>
                                )}
                            </button>
                        )}
                    </div>
                ))}
            </div>

            <p className='excl__disclaimer'>
                For educational purposes only. Always test on a demo account before live trading.
            </p>
        </div>
    );
});

export default ExclusiveBots;
