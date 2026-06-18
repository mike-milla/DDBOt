import { useState } from 'react';
import { observer } from 'mobx-react-lite';
import { load, save_types } from '@/external/bot-skeleton';
import { useStore } from '@/hooks/useStore';
import './free-bots.scss';

interface Bot {
    id: string;
    name: string;
    description: string;
    fileName: string;
    category: string;
}

const CATEGORY_CONFIG: Record<string, { color: string; glow: string; icon: JSX.Element }> = {
    'Speed Trading': {
        color: '#0BC4A6',
        glow: 'rgba(11,196,166,0.35)',
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
    'Pattern Analysis': {
        color: '#F58D15',
        glow: 'rgba(245,141,21,0.35)',
        icon: (
            <svg
                viewBox='0 0 24 24'
                fill='none'
                stroke='currentColor'
                strokeWidth='2'
                strokeLinecap='round'
                strokeLinejoin='round'
            >
                <rect x='3' y='4' width='3' height='16' rx='1' />
                <rect x='9' y='8' width='3' height='12' rx='1' />
                <rect x='15' y='2' width='3' height='18' rx='1' />
                <line x1='2' y1='20' x2='22' y2='20' />
            </svg>
        ),
    },
    Accumulators: {
        color: '#2ECC71',
        glow: 'rgba(46,204,113,0.35)',
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
    'AI Trading': {
        color: '#7625A8',
        glow: 'rgba(118,37,168,0.35)',
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
    Premium: {
        color: '#F58D15',
        glow: 'rgba(245,141,21,0.35)',
        icon: (
            <svg
                viewBox='0 0 24 24'
                fill='none'
                stroke='currentColor'
                strokeWidth='2'
                strokeLinecap='round'
                strokeLinejoin='round'
            >
                <polygon points='12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2' />
            </svg>
        ),
    },
    Differ: {
        color: '#0BC4A6',
        glow: 'rgba(11,196,166,0.35)',
        icon: (
            <svg
                viewBox='0 0 24 24'
                fill='none'
                stroke='currentColor'
                strokeWidth='2'
                strokeLinecap='round'
                strokeLinejoin='round'
            >
                <path d='M16 3h5v5M8 3H3v5M21 3l-9 9M3 3l9 9M16 21h5v-5M8 21H3v-5M21 21l-9-9M3 21l9-9' />
            </svg>
        ),
    },
    'Even/Odd': {
        color: '#7625A8',
        glow: 'rgba(118,37,168,0.35)',
        icon: (
            <svg
                viewBox='0 0 24 24'
                fill='none'
                stroke='currentColor'
                strokeWidth='2'
                strokeLinecap='round'
                strokeLinejoin='round'
            >
                <path d='M12 3v18M3 9l9-6 9 6M3 15l9 6 9-6' />
            </svg>
        ),
    },
};

const DEFAULT_CONFIG = CATEGORY_CONFIG['AI Trading'];

const BOTS: Bot[] = [
    {
        id: '1',
        name: 'Expert Speed Bot',
        description: 'Advanced speed trading with optimized entry and exit points for quick trades.',
        fileName: '2_2025_Updated_Expert_Speed_Bot_Version_📉📉📉📈📈📈_1_1_1765711647656.xml',
        category: 'Speed Trading',
    },
    {
        id: '2',
        name: 'Candle Mine Bot',
        description: 'Analyzes candlestick patterns to identify profitable trading opportunities.',
        fileName: '3_2025_Updated_Version_Of_Candle_Mine🇬🇧_1765711647657.xml',
        category: 'Pattern Analysis',
    },
    {
        id: '3',
        name: 'Accumulators Pro Bot',
        description: 'Professional accumulator strategy for consistent growth trading.',
        fileName: 'Accumulators_Pro_Bot_1765711647657.xml',
        category: 'Accumulators',
    },
    {
        id: '4',
        name: 'AI Entry Point Bot',
        description: 'AI-powered bot that identifies optimal entry points for maximum profit.',
        fileName: 'AI_with_Entry_Point_1765711647658.xml',
        category: 'AI Trading',
    },
    {
        id: '5',
        name: 'Alex Speed Bot EXPRO2',
        description: 'Enhanced speed trading with advanced algorithms for rapid execution.',
        fileName: 'ALEXSPEEDBOT__EXPRO2_(2)_(1)_1765711647659.xml',
        category: 'Speed Trading',
    },
    {
        id: '6',
        name: 'Alpha AI Two Predictions',
        description: 'Dual prediction AI system for higher accuracy in market forecasting.',
        fileName: 'Alpha_Ai_Two_Predictions__1765711647659.xml',
        category: 'AI Trading',
    },
    {
        id: '7',
        name: 'Auto C4 Volt Premium',
        description: 'Premium automated trading bot with advanced market analysis features.',
        fileName: 'AUTO_C4_VOLT_🇬🇧_2_🇬🇧_AI_PREMIUM_ROBOT_(2)_(1)_1765711647660.xml',
        category: 'Premium',
    },
    {
        id: '8',
        name: 'Binary Flipper AI Plus',
        description: 'AI-enhanced binary options bot with flip strategy optimization.',
        fileName: 'BINARY_FLIPPER_AI_ROBOT_PLUS_+_1765711647660.xml',
        category: 'AI Trading',
    },
    {
        id: '9',
        name: 'Binarytool Wizard AI',
        description: 'Intelligent trading wizard with multiple strategy implementations.',
        fileName: 'BINARYTOOL_WIZARD_AI_BOT_1765711647661.xml',
        category: 'AI Trading',
    },
    {
        id: '10',
        name: 'Binarytool Differ V2.0',
        description: 'Version 2.0 differ bot with improved accuracy and performance.',
        fileName: 'BINARYTOOL@_DIFFER_V2.0_(1)_(1)_1765711647662.xml',
        category: 'Differ',
    },
    {
        id: '11',
        name: 'Even Odd Thunder AI Pro',
        description: 'Professional even/odd prediction bot with thunder-fast execution.',
        fileName: 'BINARYTOOL@EVEN_ODD_THUNDER_AI_PRO_BOT_1765711647662.xml',
        category: 'Even/Odd',
    },
    {
        id: '12',
        name: 'Even & Odd AI Bot',
        description: 'Smart AI bot specialized in even and odd digit predictions.',
        fileName: 'BINARYTOOL@EVEN&ODD_AI_BOT_(2)_1765711647663.xml',
        category: 'Even/Odd',
    },
];

const FreeBots = observer(() => {
    const { dashboard } = useStore();
    const [loadingBotId, setLoadingBotId] = useState<string | null>(null);
    const [selectedCategory, setSelectedCategory] = useState<string>('All');

    const categories = ['All', ...Array.from(new Set(BOTS.map(bot => bot.category)))];

    const filteredBots = selectedCategory === 'All' ? BOTS : BOTS.filter(bot => bot.category === selectedCategory);

    const loadBot = async (bot: Bot) => {
        try {
            setLoadingBotId(bot.id);
            const response = await fetch(`/bots/${bot.fileName}`);
            if (!response.ok) throw new Error('Failed to fetch bot file');
            const xmlContent = await response.text();
            await load({
                block_string: xmlContent,
                file_name: bot.name,
                workspace: (window as any).Blockly?.derivWorkspace,
                from: save_types.LOCAL,
                drop_event: null,
                strategy_id: null,
                showIncompatibleStrategyDialog: null,
            });
            dashboard.setActiveTab(1);
            window.location.hash = 'bot_builder';
        } catch (error) {
            console.error('Error loading bot:', error);
        } finally {
            setLoadingBotId(null);
        }
    };

    return (
        <div className='free-bots'>
            {/* Header */}
            <div className='free-bots__header'>
                <div className='free-bots__header-badge'>
                    <svg width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2.5'>
                        <polygon points='12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2' />
                    </svg>
                    <span>Free Templates</span>
                </div>
                <h1 className='free-bots__title'>
                    Ready-to-Deploy
                    <span className='free-bots__title-accent'> Trading Bots</span>
                </h1>
                <p className='free-bots__subtitle'>
                    Load any pre-built strategy into Bot Builder instantly. Test on a demo account first.
                </p>
            </div>

            {/* Category filter */}
            <div className='free-bots__categories'>
                {categories.map(category => {
                    const cfg = CATEGORY_CONFIG[category];
                    return (
                        <button
                            key={category}
                            className={`free-bots__category-btn${selectedCategory === category ? ' free-bots__category-btn--active' : ''}`}
                            onClick={() => setSelectedCategory(category)}
                            style={
                                selectedCategory === category && cfg
                                    ? ({ '--cat-color': cfg.color, '--cat-glow': cfg.glow } as React.CSSProperties)
                                    : undefined
                            }
                        >
                            {category}
                        </button>
                    );
                })}
            </div>

            {/* Bot grid */}
            <div className='free-bots__grid'>
                {filteredBots.map(bot => {
                    const cfg = CATEGORY_CONFIG[bot.category] ?? DEFAULT_CONFIG;
                    const isLoading = loadingBotId === bot.id;
                    return (
                        <div
                            key={bot.id}
                            className='free-bots__card'
                            style={{ '--cat-color': cfg.color, '--cat-glow': cfg.glow } as React.CSSProperties}
                        >
                            <div className='free-bots__card-top'>
                                <div className='free-bots__card-icon'>{cfg.icon}</div>
                                <span className='free-bots__card-category'>{bot.category}</span>
                            </div>
                            <h3 className='free-bots__card-title'>{bot.name}</h3>
                            <p className='free-bots__card-description'>{bot.description}</p>
                            <button
                                className='free-bots__card-btn'
                                onClick={() => loadBot(bot)}
                                disabled={isLoading}
                                aria-label={`Load ${bot.name}`}
                            >
                                {isLoading ? (
                                    <span className='free-bots__spinner' aria-hidden='true' />
                                ) : (
                                    <>
                                        <span>Load Bot</span>
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
                                    </>
                                )}
                            </button>
                        </div>
                    );
                })}
            </div>

            {/* Footer note */}
            <div className='free-bots__footer'>
                <svg width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2'>
                    <circle cx='12' cy='12' r='10' />
                    <line x1='12' y1='8' x2='12' y2='12' />
                    <line x1='12' y1='16' x2='12.01' y2='16' />
                </svg>
                <p>All bots are for educational purposes. Always test with a demo account before live trading.</p>
            </div>
        </div>
    );
});

export default FreeBots;
