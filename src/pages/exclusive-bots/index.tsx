import { useState } from 'react';
import { observer } from 'mobx-react-lite';
import BotCard from '@/components/bot-card';
import { load, save_types } from '@/external/bot-skeleton';
import { useStore } from '@/hooks/useStore';
import './exclusive-bots.scss';

interface ExclusiveBot {
    id: string;
    name: string;
    description: string;
    fileName: string;
    category: string;
    tier: 'gold' | 'platinum' | 'diamond';
    locked: boolean;
    winRate?: string;
    trades?: string;
}

const TIER_COLOR: Record<string, { color: string; glow: string }> = {
    gold: { color: '#f59e0b', glow: 'rgba(245,158,11,0.35)' },
    platinum: { color: '#94a3b8', glow: 'rgba(148,163,184,0.3)' },
    diamond: { color: '#7c3aed', glow: 'rgba(124,58,237,0.35)' },
};

const CATEGORY_CONFIG: Record<string, { icon: JSX.Element }> = {
    Momentum: {
        icon: (
            <svg
                viewBox='0 0 24 24'
                fill='none'
                stroke='currentColor'
                strokeWidth='2'
                strokeLinecap='round'
                strokeLinejoin='round'
            >
                <path d='M13 2L3 14h9l-1 8 10-12h-9l1-8z' />
            </svg>
        ),
    },
    Scalping: {
        icon: (
            <svg
                viewBox='0 0 24 24'
                fill='none'
                stroke='currentColor'
                strokeWidth='2'
                strokeLinecap='round'
                strokeLinejoin='round'
            >
                <polyline points='22 7 13.5 15.5 8.5 10.5 2 17' />
                <polyline points='16 7 22 7 22 13' />
            </svg>
        ),
    },
    'AI Hybrid': {
        icon: (
            <svg
                viewBox='0 0 24 24'
                fill='none'
                stroke='currentColor'
                strokeWidth='2'
                strokeLinecap='round'
                strokeLinejoin='round'
            >
                <circle cx='12' cy='12' r='3' />
                <path d='M12 2v3M12 19v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M2 12h3M19 12h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12' />
            </svg>
        ),
    },
    'Grid Strategy': {
        icon: (
            <svg
                viewBox='0 0 24 24'
                fill='none'
                stroke='currentColor'
                strokeWidth='2'
                strokeLinecap='round'
                strokeLinejoin='round'
            >
                <rect x='3' y='3' width='7' height='7' />
                <rect x='14' y='3' width='7' height='7' />
                <rect x='3' y='14' width='7' height='7' />
                <rect x='14' y='14' width='7' height='7' />
            </svg>
        ),
    },
    Reversal: {
        icon: (
            <svg
                viewBox='0 0 24 24'
                fill='none'
                stroke='currentColor'
                strokeWidth='2'
                strokeLinecap='round'
                strokeLinejoin='round'
            >
                <polyline points='1 4 1 10 7 10' />
                <polyline points='23 20 23 14 17 14' />
                <path d='M20.49 9A9 9 0 0 0 5.64 5.64L1 10M23 14l-4.64 4.36A9 9 0 0 1 3.51 15' />
            </svg>
        ),
    },
    Volatility: {
        icon: (
            <svg
                viewBox='0 0 24 24'
                fill='none'
                stroke='currentColor'
                strokeWidth='2'
                strokeLinecap='round'
                strokeLinejoin='round'
            >
                <polyline points='2 12 6 3 10 15 14 8 18 17 22 12' />
            </svg>
        ),
    },
};

const BOTS: ExclusiveBot[] = [
    {
        id: '1',
        name: 'Phantom Scalper Pro',
        description:
            'Millisecond-precision scalping with adaptive risk management. Closes positions before market turns.',
        fileName: 'phantom_scalper_pro.xml',
        category: 'Scalping',
        tier: 'gold',
        locked: false,
        winRate: '68%',
        trades: '12K+',
    },
    {
        id: '2',
        name: 'Neural Momentum AI',
        description: 'Deep learning momentum detector. Trained on 5 years of volatility index data.',
        fileName: 'neural_momentum_ai.xml',
        category: 'AI Hybrid',
        tier: 'platinum',
        locked: false,
        winRate: '72%',
        trades: '8K+',
    },
    {
        id: '3',
        name: 'Diamond Grid Master',
        description: 'Multi-level grid strategy with smart rebalancing. Profits in ranging and trending markets.',
        fileName: 'diamond_grid_master.xml',
        category: 'Grid Strategy',
        tier: 'diamond',
        locked: true,
        winRate: '75%',
        trades: '20K+',
    },
    {
        id: '4',
        name: 'Velocity Surge Bot',
        description: 'Captures explosive momentum bursts at the exact inflection point of trend acceleration.',
        fileName: 'velocity_surge.xml',
        category: 'Momentum',
        tier: 'gold',
        locked: false,
        winRate: '65%',
        trades: '9K+',
    },
    {
        id: '5',
        name: 'Reversal Sentinel',
        description: 'Identifies exhausted trends with precision. Enters counter-trend positions at optimal points.',
        fileName: 'reversal_sentinel.xml',
        category: 'Reversal',
        tier: 'platinum',
        locked: true,
        winRate: '70%',
        trades: '6K+',
    },
    {
        id: '6',
        name: 'Quantum Volatility',
        description: 'Proprietary vol-surface analysis. Adapts stake sizing dynamically based on volatility regime.',
        fileName: 'quantum_volatility.xml',
        category: 'Volatility',
        tier: 'diamond',
        locked: true,
        winRate: '78%',
        trades: '15K+',
    },
    {
        id: '7',
        name: 'Alpha Scalp V3',
        description: 'Third-gen scalping framework. Refined entry filters reduce false signals by 40%.',
        fileName: 'alpha_scalp_v3.xml',
        category: 'Scalping',
        tier: 'gold',
        locked: false,
        winRate: '67%',
        trades: '18K+',
    },
    {
        id: '8',
        name: 'Titan AI Composite',
        description: 'Ensemble of 5 neural models voting on each trade. Highest accuracy bot in the collection.',
        fileName: 'titan_ai_composite.xml',
        category: 'AI Hybrid',
        tier: 'diamond',
        locked: true,
        winRate: '81%',
        trades: '4K+',
    },
];

const StarIcon = () => (
    <svg width='11' height='11' viewBox='0 0 24 24' fill='currentColor' stroke='none'>
        <polygon points='12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2' />
    </svg>
);

const ExclusiveBots = observer(() => {
    const { dashboard } = useStore();
    const [loadingId, setLoadingId] = useState<string | null>(null);
    const [query, setQuery] = useState('');

    const filtered = BOTS.filter(b => {
        const q = query.toLowerCase();
        return !q || b.name.toLowerCase().includes(q) || b.category.toLowerCase().includes(q) || b.tier.includes(q);
    });

    const loadBot = async (bot: ExclusiveBot) => {
        if (bot.locked) return;
        try {
            setLoadingId(bot.id);
            const res = await fetch(`/bots/${bot.fileName}`);
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
        <div className='exclusive-bots'>
            <div className='exclusive-bots__header'>
                <div className='exclusive-bots__header-badge'>
                    <StarIcon />
                    <span>Exclusive Collection</span>
                </div>
                <h1 className='exclusive-bots__title'>
                    Elite Trading<span className='exclusive-bots__title-accent'> Bots</span>
                </h1>
                <p className='exclusive-bots__subtitle'>
                    Institutional-grade strategies. Load any unlocked bot directly into Bot Builder.
                </p>
            </div>

            <div className='exclusive-bots__search-wrap'>
                <svg
                    className='exclusive-bots__search-icon'
                    width='15'
                    height='15'
                    viewBox='0 0 24 24'
                    fill='none'
                    stroke='currentColor'
                    strokeWidth='2.2'
                    strokeLinecap='round'
                    strokeLinejoin='round'
                >
                    <circle cx='11' cy='11' r='8' />
                    <path d='M21 21l-4.35-4.35' />
                </svg>
                <input
                    className='exclusive-bots__search'
                    type='text'
                    placeholder='Search bots…'
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                />
                {query && (
                    <button
                        className='exclusive-bots__search-clear'
                        onClick={() => setQuery('')}
                        aria-label='Clear search'
                    >
                        <svg
                            width='13'
                            height='13'
                            viewBox='0 0 24 24'
                            fill='none'
                            stroke='currentColor'
                            strokeWidth='2.5'
                            strokeLinecap='round'
                        >
                            <path d='M18 6L6 18M6 6l12 12' />
                        </svg>
                    </button>
                )}
            </div>

            <div className='exclusive-bots__grid'>
                {filtered.map(bot => {
                    const tierColors = TIER_COLOR[bot.tier];
                    const catIcon = CATEGORY_CONFIG[bot.category]?.icon ?? CATEGORY_CONFIG['Momentum'].icon;
                    return (
                        <BotCard
                            key={bot.id}
                            name={bot.name}
                            description={bot.description}
                            category={bot.category}
                            icon={catIcon}
                            color={tierColors.color}
                            glow={tierColors.glow}
                            tier={bot.tier}
                            locked={bot.locked}
                            winRate={bot.winRate}
                            trades={bot.trades}
                            onLoad={() => loadBot(bot)}
                            isLoading={loadingId === bot.id}
                        />
                    );
                })}
            </div>

            <div className='exclusive-bots__footer'>
                <svg width='13' height='13' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2'>
                    <circle cx='12' cy='12' r='10' />
                    <line x1='12' y1='8' x2='12' y2='12' />
                    <line x1='12' y1='16' x2='12.01' y2='16' />
                </svg>
                <p>Exclusive bots are for educational purposes. Always test on a demo account before live trading.</p>
            </div>
        </div>
    );
});

export default ExclusiveBots;
