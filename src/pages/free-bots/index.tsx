import { useState } from 'react';
import { observer } from 'mobx-react-lite';
import BotCard from '@/components/bot-card';
import { load, save_types } from '@/external/bot-skeleton';
import { useStore } from '@/hooks/useStore';
import './free-bots.scss';

interface Bot {
    id: string;
    name: string;
    description: string;
    fileName: string;
    category?: string;
}

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
    const [loadingId, setLoadingId] = useState<string | null>(null);
    const [query, setQuery] = useState('');

    const filtered = BOTS.filter(b => {
        const q = query.toLowerCase();
        return !q || b.name.toLowerCase().includes(q) || (b.category ?? '').toLowerCase().includes(q);
    });

    const loadBot = async (bot: Bot) => {
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
        <div className='free-bots'>
            <div className='free-bots__header'>
                <div className='free-bots__header-badge'>
                    <svg width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2.5'>
                        <polygon points='12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2' />
                    </svg>
                    <span>Free Templates</span>
                </div>
                <h1 className='free-bots__title'>
                    Ready-to-Deploy<span className='free-bots__title-accent'> Trading Bots</span>
                </h1>
                <p className='free-bots__subtitle'>
                    Load any pre-built strategy into Bot Builder instantly. Test on a demo account first.
                </p>
            </div>

            <div className='free-bots__search-wrap'>
                <svg
                    className='free-bots__search-icon'
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
                    className='free-bots__search'
                    type='text'
                    placeholder='Search bots…'
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                />
                {query && (
                    <button className='free-bots__search-clear' onClick={() => setQuery('')} aria-label='Clear search'>
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

            <div className='free-bots__grid'>
                {filtered.map(bot => (
                    <BotCard
                        key={bot.id}
                        name={bot.name}
                        description={bot.description}
                        category={bot.category}
                        onLoad={() => loadBot(bot)}
                        isLoading={loadingId === bot.id}
                    />
                ))}
            </div>

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
