import { useEffect, useMemo, useRef, useState } from 'react';
import { generateDerivApiInstance } from '@/external/bot-skeleton/services/api/appId';
import './bulk-trader.scss';

// ── Types ─────────────────────────────────────────────────────────────────────
type TradeType = 'evenodd' | 'overunder' | 'matchdiff' | 'risefall';
type TickEntry = { digit: number; price: string; epoch: number; direction: 'rise' | 'fall' | null };

// ── Constants ─────────────────────────────────────────────────────────────────
const SYMBOLS = [
    { label: 'Volatility 100 (1s) Index', value: '1HZ100V' },
    { label: 'Volatility 75 (1s) Index', value: '1HZ75V' },
    { label: 'Volatility 50 (1s) Index', value: '1HZ50V' },
    { label: 'Volatility 25 (1s) Index', value: '1HZ25V' },
    { label: 'Volatility 10 (1s) Index', value: '1HZ10V' },
    { label: 'Volatility 100 Index', value: 'R_100' },
    { label: 'Volatility 75 Index', value: 'R_75' },
    { label: 'Volatility 50 Index', value: 'R_50' },
    { label: 'Volatility 25 Index', value: 'R_25' },
    { label: 'Volatility 10 Index', value: 'R_10' },
];

const TRADE_TYPES: { value: TradeType; label: string }[] = [
    { value: 'evenodd', label: 'Even / Odd' },
    { value: 'risefall', label: 'Rise / Fall' },
    { value: 'overunder', label: 'Over / Under' },
    { value: 'matchdiff', label: 'Match / Differ' },
];

const R = 28;
const CIRC = 2 * Math.PI * R;

// ── Digit stream hook (same pattern as DCircles) ──────────────────────────────
const useDigitStream = (symbol: string) => {
    const [ticks, setTicks] = useState<TickEntry[]>([]);
    const [isConnected, setIsConnected] = useState(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const apiRef = useRef<any>(null);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const subRef = useRef<any>(null);
    const prevRef = useRef<number | null>(null);

    useEffect(() => {
        let mounted = true;
        setTicks([]);
        setIsConnected(false);
        prevRef.current = null;

        const parseTick = (quote: number, pip: number, epoch: number, prev: number | null): TickEntry => {
            const s = quote.toFixed(pip);
            return {
                digit: parseInt(s[s.length - 1]),
                price: s,
                epoch,
                direction: prev === null ? null : quote > prev ? 'rise' : 'fall',
            };
        };

        const connect = async () => {
            subRef.current?.unsubscribe?.();
            try {
                apiRef.current?.disconnect?.();
            } catch (_e) {
                /* noop */
            }
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const api = generateDerivApiInstance() as any;
            apiRef.current = api;
            await new Promise<void>(r => {
                if (api.connection.readyState === WebSocket.OPEN) r();
                else api.connection.addEventListener('open', () => r(), { once: true });
            });
            if (!mounted) return;
            try {
                const hist = await api.send({ ticks_history: symbol, count: 500, end: 'latest', style: 'ticks' });
                if (mounted && hist?.history) {
                    const { prices, times } = hist.history;
                    const pip = hist.pip_size ?? 2;
                    setTicks(
                        prices.map((q: number, i: number) =>
                            parseTick(q, pip, times[i], i === 0 ? null : prices[i - 1])
                        )
                    );
                    prevRef.current = prices[prices.length - 1] ?? null;
                }
            } catch (_e) {
                /* noop */
            }
            if (!mounted) return;
            setIsConnected(true);
            const stream = api.subscribe({ ticks: symbol, subscribe: 1 });
            subRef.current = stream.subscribe({
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                next: (res: any) => {
                    if (!mounted || !res?.tick) return;
                    const { quote, pip_size, epoch } = res.tick;
                    const entry = parseTick(quote as number, pip_size ?? 2, epoch, prevRef.current);
                    prevRef.current = quote as number;
                    setTicks(prev => [...prev, entry].slice(-2000));
                },
                error: () => {
                    if (mounted) setIsConnected(false);
                },
            });
        };
        connect();
        return () => {
            mounted = false;
            subRef.current?.unsubscribe?.();
            try {
                apiRef.current?.disconnect?.();
            } catch (_e) {
                /* noop */
            }
        };
    }, [symbol]);

    return { ticks, isConnected };
};

// ── Arc circle for each digit ─────────────────────────────────────────────────
const DigitArc = ({
    digit,
    pct,
    isHot,
    isCold,
    isLast,
}: {
    digit: number;
    pct: number;
    isHot: boolean;
    isCold: boolean;
    isLast: boolean;
}) => {
    const stroke = isLast ? '#7c3aed' : isHot ? '#0bc4a6' : isCold ? '#ef4444' : '#94a3b8';
    const dash = `${(pct / 100) * CIRC} ${CIRC}`;
    return (
        <div className={`bt-circle${isLast ? ' bt-circle--last' : ''}`}>
            <svg viewBox='0 0 64 64' className='bt-circle__svg'>
                <circle cx='32' cy='32' r={R} className='bt-circle__track' />
                <circle
                    cx='32'
                    cy='32'
                    r={R}
                    className='bt-circle__arc'
                    strokeDasharray={dash}
                    strokeDashoffset='0'
                    stroke={stroke}
                    style={{
                        transform: 'rotate(-90deg)',
                        transformOrigin: '50% 50%',
                        transition: 'stroke-dasharray 0.5s ease',
                    }}
                />
            </svg>
            <div className='bt-circle__label'>
                <span className='bt-circle__digit'>{digit}</span>
                <span className='bt-circle__pct'>{pct.toFixed(1)}%</span>
            </div>
        </div>
    );
};

// ── Main component ────────────────────────────────────────────────────────────
const BulkTrader = () => {
    const [symbol, setSymbol] = useState('1HZ100V');
    const [tradeType, setTradeType] = useState<TradeType>('evenodd');
    const [sampleSize, setSampleSize] = useState(1000);
    const [ticks_per_trade, setTicksPerTrade] = useState(1);
    const [stake, setStake] = useState('0.50');
    const [numTrades, setNumTrades] = useState(1);
    const [selectedDigit, setSelectedDigit] = useState(5);
    const [autoMode, setAutoMode] = useState(false);

    const { ticks, isConnected } = useDigitStream(symbol);

    const sample = useMemo(() => ticks.slice(-Math.min(sampleSize, ticks.length)), [ticks, sampleSize]);
    const lastTick = ticks[ticks.length - 1];

    // Digit counts
    const counts = useMemo(() => {
        const c = Array(10).fill(0);
        sample.forEach(t => c[t.digit]++);
        return c;
    }, [sample]);

    const pcts = useMemo(
        () => counts.map(c => (sample.length === 0 ? 10 : (c / sample.length) * 100)),
        [counts, sample.length]
    );

    const maxIdx = pcts.indexOf(Math.max(...pcts));
    const minIdx = pcts.indexOf(Math.min(...pcts));

    // Even/Odd stats
    const evenCount = useMemo(() => sample.filter(t => t.digit % 2 === 0).length, [sample]);
    const oddCount = sample.length - evenCount;
    const evenPct = sample.length === 0 ? 50 : (evenCount / sample.length) * 100;
    const oddPct = 100 - evenPct;

    // Rise/Fall stats
    const riseCount = useMemo(() => sample.filter(t => t.direction === 'rise').length, [sample]);
    const fallCount = useMemo(() => sample.filter(t => t.direction === 'fall').length, [sample]);
    const riseTotal = riseCount + fallCount || 1;
    const risePct = (riseCount / riseTotal) * 100;
    const fallPct = 100 - risePct;

    // Over/Under stats (for selected digit)
    const overCount = useMemo(() => sample.filter(t => t.digit > selectedDigit).length, [sample, selectedDigit]);
    const underCount = useMemo(() => sample.filter(t => t.digit < selectedDigit).length, [sample, selectedDigit]);
    const ouTotal = overCount + underCount || 1;
    const overPct = (overCount / ouTotal) * 100;
    const underPct = 100 - overPct;

    // Match/Differ stats
    const matchCount = useMemo(() => sample.filter(t => t.digit === selectedDigit).length, [sample, selectedDigit]);
    const differCount = sample.length - matchCount;
    const mdTotal = sample.length || 1;
    const matchPct = (matchCount / mdTotal) * 100;
    const differPct = 100 - matchPct;

    // Recent 8 ticks for strip
    const recent = ticks.slice(-8);

    return (
        <div className='bt-page'>
            {/* ── Top controls ── */}
            <div className='bt-page__top'>
                <label className='bt-page__field'>
                    <span>Market</span>
                    <select value={symbol} onChange={e => setSymbol(e.target.value)}>
                        {SYMBOLS.map(s => (
                            <option key={s.value} value={s.value}>
                                {s.label}
                            </option>
                        ))}
                    </select>
                </label>
                <label className='bt-page__field'>
                    <span>Trade Type</span>
                    <select value={tradeType} onChange={e => setTradeType(e.target.value as TradeType)}>
                        {TRADE_TYPES.map(t => (
                            <option key={t.value} value={t.value}>
                                {t.label}
                            </option>
                        ))}
                    </select>
                </label>
                <label className='bt-page__field'>
                    <span>Number of Ticks (sample)</span>
                    <input
                        type='number'
                        min={50}
                        max={5000}
                        value={sampleSize}
                        onChange={e => setSampleSize(Number(e.target.value))}
                    />
                </label>
            </div>

            {/* ── Live price ── */}
            <div className='bt-page__price-row'>
                <div className='bt-page__price-wrap'>
                    <span className='bt-page__price-label'>Current Tick</span>
                    <span
                        className={`bt-page__price${lastTick?.direction === 'rise' ? ' bt-page__price--rise' : lastTick?.direction === 'fall' ? ' bt-page__price--fall' : ''}`}
                    >
                        {lastTick?.price ?? '—'}
                    </span>
                </div>
                <div className={`bt-page__conn${isConnected ? ' bt-page__conn--live' : ''}`}>
                    <span className='bt-page__conn-dot' />
                    {isConnected ? 'Live' : 'Connecting…'}
                </div>
            </div>

            {/* ── Digit circles ── */}
            <div className='bt-page__circles'>
                {Array.from({ length: 10 }, (_, d) => (
                    <DigitArc
                        key={d}
                        digit={d}
                        pct={pcts[d]}
                        isHot={d === maxIdx}
                        isCold={d === minIdx}
                        isLast={lastTick?.digit === d}
                    />
                ))}
            </div>

            {/* ── Recent digit strip ── */}
            <div className='bt-page__strip'>
                {recent.map((t, i) => {
                    const isEven = t.digit % 2 === 0;
                    const isLast = i === recent.length - 1;
                    return (
                        <span
                            key={t.epoch}
                            className={`bt-page__badge${isLast ? ' bt-page__badge--last' : ''}`}
                            style={{ background: isEven ? '#0bc4a6' : '#ef4444' }}
                        >
                            {tradeType === 'evenodd'
                                ? isEven
                                    ? 'E'
                                    : 'O'
                                : tradeType === 'risefall'
                                  ? t.direction === 'rise'
                                      ? '▲'
                                      : '▼'
                                  : t.digit}
                        </span>
                    );
                })}
            </div>

            {/* ── Trade parameters ── */}
            {(tradeType === 'overunder' || tradeType === 'matchdiff') && (
                <div className='bt-page__digit-row'>
                    <span className='bt-page__digit-label'>Digit</span>
                    {Array.from({ length: 10 }, (_, d) => (
                        <button
                            key={d}
                            className={`bt-page__digit-btn${selectedDigit === d ? ' bt-page__digit-btn--active' : ''}`}
                            onClick={() => setSelectedDigit(d)}
                        >
                            {d}
                        </button>
                    ))}
                </div>
            )}

            <div className='bt-page__trade-row'>
                <label className='bt-page__trade-field'>
                    <span>Ticks</span>
                    <input
                        type='number'
                        min={1}
                        max={10}
                        value={ticks_per_trade}
                        onChange={e => setTicksPerTrade(Number(e.target.value))}
                    />
                </label>
                <label className='bt-page__trade-field'>
                    <span>Stake (USD)</span>
                    <input
                        type='number'
                        min={0.35}
                        step={0.01}
                        value={stake}
                        onChange={e => setStake(e.target.value)}
                    />
                </label>
                <label className='bt-page__trade-field'>
                    <span>No. of Trades</span>
                    <input
                        type='number'
                        min={1}
                        max={100}
                        value={numTrades}
                        onChange={e => setNumTrades(Number(e.target.value))}
                    />
                </label>
                <button
                    className={`bt-page__auto-btn${autoMode ? ' bt-page__auto-btn--on' : ''}`}
                    onClick={() => setAutoMode(a => !a)}
                >
                    <svg
                        width='13'
                        height='13'
                        viewBox='0 0 24 24'
                        fill='none'
                        stroke='currentColor'
                        strokeWidth='2'
                        strokeLinecap='round'
                        strokeLinejoin='round'
                    >
                        <circle cx='12' cy='12' r='3' />
                        <path d='M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14' />
                    </svg>
                    Auto Trader {autoMode ? 'ON' : 'OFF'}
                </button>
            </div>

            {/* ── Prediction split bar ── */}
            {tradeType === 'evenodd' && (
                <div className='bt-page__split'>
                    <button className='bt-page__split-btn bt-page__split-btn--a' style={{ flex: evenPct }}>
                        <span className='bt-page__split-label'>Even</span>
                        <span className='bt-page__split-pct'>{evenPct.toFixed(2)}%</span>
                    </button>
                    <button className='bt-page__split-btn bt-page__split-btn--b' style={{ flex: oddPct }}>
                        <span className='bt-page__split-label'>Odd</span>
                        <span className='bt-page__split-pct'>{oddPct.toFixed(2)}%</span>
                    </button>
                </div>
            )}

            {tradeType === 'risefall' && (
                <div className='bt-page__split'>
                    <button className='bt-page__split-btn bt-page__split-btn--a' style={{ flex: risePct }}>
                        <span className='bt-page__split-label'>Rise ▲</span>
                        <span className='bt-page__split-pct'>{risePct.toFixed(2)}%</span>
                    </button>
                    <button className='bt-page__split-btn bt-page__split-btn--b' style={{ flex: fallPct }}>
                        <span className='bt-page__split-label'>Fall ▼</span>
                        <span className='bt-page__split-pct'>{fallPct.toFixed(2)}%</span>
                    </button>
                </div>
            )}

            {tradeType === 'overunder' && (
                <div className='bt-page__split'>
                    <button className='bt-page__split-btn bt-page__split-btn--a' style={{ flex: overPct }}>
                        <span className='bt-page__split-label'>Over {selectedDigit}</span>
                        <span className='bt-page__split-pct'>{overPct.toFixed(2)}%</span>
                    </button>
                    <button className='bt-page__split-btn bt-page__split-btn--b' style={{ flex: underPct }}>
                        <span className='bt-page__split-label'>Under {selectedDigit}</span>
                        <span className='bt-page__split-pct'>{underPct.toFixed(2)}%</span>
                    </button>
                </div>
            )}

            {tradeType === 'matchdiff' && (
                <div className='bt-page__split'>
                    <button
                        className='bt-page__split-btn bt-page__split-btn--a'
                        style={{ flex: Math.max(matchPct, 1) }}
                    >
                        <span className='bt-page__split-label'>Matches {selectedDigit}</span>
                        <span className='bt-page__split-pct'>{matchPct.toFixed(2)}%</span>
                    </button>
                    <button
                        className='bt-page__split-btn bt-page__split-btn--b'
                        style={{ flex: Math.max(differPct, 1) }}
                    >
                        <span className='bt-page__split-label'>Differs {selectedDigit}</span>
                        <span className='bt-page__split-pct'>{differPct.toFixed(2)}%</span>
                    </button>
                </div>
            )}
        </div>
    );
};

export default BulkTrader;
