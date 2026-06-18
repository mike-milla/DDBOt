import { useEffect, useMemo, useRef, useState } from 'react';
import { generateDerivApiInstance } from '@/external/bot-skeleton/services/api/appId';
import './dcircles.scss';

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

type TickEntry = { digit: number; price: string; epoch: number; direction: 'rise' | 'fall' | null };

const useDigitStream = (symbol: string) => {
    const [ticks, setTicks] = useState<TickEntry[]>([]);
    const [pipSize, setPipSize] = useState(2);
    const [isConnected, setIsConnected] = useState(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const apiRef = useRef<any>(null);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const subRef = useRef<any>(null);
    const prevPriceRef = useRef<number | null>(null);

    useEffect(() => {
        let mounted = true;
        setTicks([]);
        setIsConnected(false);
        prevPriceRef.current = null;

        const parseTick = (quote: number, pip: number, epoch: number, prev: number | null): TickEntry => {
            const priceStr = quote.toFixed(pip);
            const digit = parseInt(priceStr[priceStr.length - 1]);
            const direction: 'rise' | 'fall' | null = prev === null ? null : quote > prev ? 'rise' : 'fall';
            return { digit, price: priceStr, epoch, direction };
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

            await new Promise<void>(resolve => {
                if (api.connection.readyState === WebSocket.OPEN) resolve();
                else api.connection.addEventListener('open', () => resolve(), { once: true });
            });

            if (!mounted) return;

            // Pre-fill with last 50 historical ticks
            try {
                const history = await api.send({
                    ticks_history: symbol,
                    count: 100,
                    end: 'latest',
                    style: 'ticks',
                });
                if (mounted && history?.history) {
                    const { prices, times } = history.history;
                    const pip = history.pip_size ?? 2;
                    setPipSize(pip);
                    const historical: TickEntry[] = [];
                    prices.forEach((quote: number, i: number) => {
                        const prev = i === 0 ? null : prices[i - 1];
                        historical.push(parseTick(quote, pip, times[i], prev));
                    });
                    prevPriceRef.current = prices[prices.length - 1] ?? null;
                    setTicks(historical);
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
                    const pip = pip_size ?? 2;
                    setPipSize(pip);
                    const entry = parseTick(quote as number, pip, epoch, prevPriceRef.current);
                    prevPriceRef.current = quote as number;
                    setTicks(prev => [...prev, entry].slice(-1000));
                },
                error: () => {
                    if (mounted) {
                        setIsConnected(false);
                    }
                },
            });
        };

        void connect();

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

    return { ticks, pipSize, isConnected };
};

const DCircles = () => {
    const [symbol, setSymbol] = useState('1HZ10V');
    const [sampleSize, setSampleSize] = useState(1000);
    const [patternMode, setPatternMode] = useState<'evenodd' | 'overunder'>('evenodd');
    const [targetDigit, setTargetDigit] = useState(4);

    const { ticks, pipSize, isConnected } = useDigitStream(symbol);

    const slice = ticks.slice(-sampleSize);
    const digits = slice.map(t => t.digit);
    const total = digits.length || 1;
    const lastTick = ticks[ticks.length - 1];
    const lastDigit = lastTick?.digit ?? -1;
    const lastPrice = lastTick?.price ?? '—';

    const distribution = useMemo(() => {
        const counts = Array(10).fill(0);
        digits.forEach(d => counts[d]++);
        return counts.map((count, digit) => ({
            digit,
            count,
            pct: total > 1 ? ((count / total) * 100).toFixed(2) : '0.00',
        }));
    }, [digits, total]);

    const maxCount = Math.max(...distribution.map(d => d.count), 1);
    const minCount = Math.min(...distribution.map(d => d.count));
    const highestDigit = distribution.find(d => d.count === maxCount);
    const lowestDigit = distribution.find(d => d.count === minCount && d.count < maxCount);

    const evenCount = digits.filter(d => d % 2 === 0).length;
    const oddCount = digits.filter(d => d % 2 !== 0).length;
    const evenPct = ((evenCount / total) * 100).toFixed(1);
    const oddPct = ((oddCount / total) * 100).toFixed(1);

    const overCount = digits.filter(d => d > targetDigit).length;
    const equalCount = digits.filter(d => d === targetDigit).length;
    const underCount = digits.filter(d => d < targetDigit).length;
    const overPct = ((overCount / total) * 100).toFixed(1);
    const equalPct = ((equalCount / total) * 100).toFixed(1);
    const underPct = ((underCount / total) * 100).toFixed(1);

    const directed = slice.filter(t => t.direction !== null);
    const riseCount = directed.filter(t => t.direction === 'rise').length;
    const fallCount = directed.filter(t => t.direction === 'fall').length;
    const dirTotal = directed.length || 1;
    const risePct = ((riseCount / dirTotal) * 100).toFixed(1);
    const fallPct = ((fallCount / dirTotal) * 100).toFixed(1);

    const patternSlice = ticks.slice(-50);

    return (
        <div className='dcircles'>
            {/* ── Top bar ── */}
            <div className='dcircles__topbar'>
                <div>
                    <div className='dcircles__current-price'>{lastPrice}</div>
                    <div className='dcircles__current-label'>CURRENT PRICE</div>
                </div>
                <div className='dcircles__controls'>
                    <select className='dcircles__select' value={symbol} onChange={e => setSymbol(e.target.value)}>
                        {SYMBOLS.map(s => (
                            <option key={s.value} value={s.value}>
                                {s.label}
                            </option>
                        ))}
                    </select>
                    <select
                        className='dcircles__select'
                        value={sampleSize}
                        onChange={e => setSampleSize(Number(e.target.value))}
                    >
                        {[100, 200, 500, 1000].map(n => (
                            <option key={n} value={n}>
                                Last {n} ticks
                            </option>
                        ))}
                    </select>
                    <span className={`dcircles__badge ${isConnected ? 'dcircles__badge--live' : ''}`}>
                        <span className='dcircles__badge-dot' />
                        {isConnected ? 'Live' : 'Connecting…'}
                    </span>
                </div>
            </div>

            {/* ── Digit Distribution ── */}
            <section className='dcircles__card'>
                <h2 className='dcircles__card-title'>DIGIT DISTRIBUTION</h2>
                <div className='dcircles__circles-row'>
                    {distribution.map(({ digit, pct }) => {
                        const isLast = digit === lastDigit;
                        const isEven = digit % 2 === 0;
                        return (
                            <div key={digit} className='dcircles__digit-col'>
                                <div
                                    className={[
                                        'dcircles__circle',
                                        isEven ? 'dcircles__circle--even' : 'dcircles__circle--odd',
                                        isLast ? 'dcircles__circle--last' : '',
                                    ]
                                        .filter(Boolean)
                                        .join(' ')}
                                >
                                    <span className='dcircles__circle-digit'>{digit}</span>
                                    <span className='dcircles__circle-pct'>{pct}%</span>
                                </div>
                                <span className={`dcircles__indicator ${isLast ? '' : 'dcircles__indicator--hidden'}`}>
                                    ▲
                                </span>
                            </div>
                        );
                    })}
                </div>

                {/* ── Highest / Lowest stat cards ── */}
                <div className='dcircles__dist-stats'>
                    <div className='dcircles__dist-stat dcircles__dist-stat--highest'>
                        <span className='dcircles__dist-stat-label'>HIGHEST</span>
                        <div className='dcircles__dist-stat-body'>
                            <span className='dcircles__dist-stat-digit'>{highestDigit?.digit ?? '—'}</span>
                            <span className='dcircles__dist-stat-pct'>{highestDigit?.pct ?? '0.00'}%</span>
                            <span className='dcircles__dist-stat-count'>{highestDigit?.count ?? 0} ticks</span>
                        </div>
                    </div>
                    <div className='dcircles__dist-stat dcircles__dist-stat--last'>
                        <span className='dcircles__dist-stat-label'>LAST DIGIT</span>
                        <div className='dcircles__dist-stat-body'>
                            <span className='dcircles__dist-stat-digit'>{lastDigit >= 0 ? lastDigit : '—'}</span>
                            <span className='dcircles__dist-stat-pct'>
                                {lastDigit >= 0 ? distribution[lastDigit]?.pct : '0.00'}%
                            </span>
                            <span className='dcircles__dist-stat-count'>{lastPrice}</span>
                        </div>
                    </div>
                    <div className='dcircles__dist-stat dcircles__dist-stat--lowest'>
                        <span className='dcircles__dist-stat-label'>LOWEST</span>
                        <div className='dcircles__dist-stat-body'>
                            <span className='dcircles__dist-stat-digit'>{lowestDigit?.digit ?? '—'}</span>
                            <span className='dcircles__dist-stat-pct'>{lowestDigit?.pct ?? '0.00'}%</span>
                            <span className='dcircles__dist-stat-count'>{lowestDigit?.count ?? 0} ticks</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── Pattern Analysis ── */}
            <section className='dcircles__card'>
                <div className='dcircles__card-header'>
                    <h2 className='dcircles__card-title'>PATTERN ANALYSIS</h2>
                    <div className='dcircles__mode-toggle'>
                        <button
                            className={`dcircles__mode-btn ${patternMode === 'evenodd' ? 'dcircles__mode-btn--active' : ''}`}
                            onClick={() => setPatternMode('evenodd')}
                        >
                            Even / Odd
                        </button>
                        <button
                            className={`dcircles__mode-btn ${patternMode === 'overunder' ? 'dcircles__mode-btn--active' : ''}`}
                            onClick={() => setPatternMode('overunder')}
                        >
                            Over / Under
                        </button>
                    </div>
                </div>
                {patternMode === 'evenodd' ? (
                    <div className='dcircles__split'>
                        <div className='dcircles__split-block dcircles__split-block--even'>
                            <span className='dcircles__split-pct'>{evenPct}%</span>
                            <span className='dcircles__split-label'>EVEN</span>
                        </div>
                        <div className='dcircles__split-block dcircles__split-block--odd'>
                            <span className='dcircles__split-pct'>{oddPct}%</span>
                            <span className='dcircles__split-label'>ODD</span>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className='dcircles__digit-picker'>
                            <span className='dcircles__digit-picker-label'>Select digit</span>
                            <div className='dcircles__digit-picker-row'>
                                {Array.from({ length: 10 }, (_, d) => (
                                    <button
                                        key={d}
                                        className={`dcircles__digit-pick-btn ${d === targetDigit ? 'dcircles__digit-pick-btn--active' : ''}`}
                                        onClick={() => setTargetDigit(d)}
                                    >
                                        {d}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className='dcircles__triple'>
                            <div className='dcircles__triple-block dcircles__triple-block--over'>
                                <span className='dcircles__split-pct'>{overPct}%</span>
                                <span className='dcircles__split-label'>OVER {targetDigit}</span>
                                <span className='dcircles__triple-count'>{overCount} ticks</span>
                            </div>
                            <div className='dcircles__triple-block dcircles__triple-block--equal'>
                                <span className='dcircles__split-pct'>{equalPct}%</span>
                                <span className='dcircles__split-label'>EQUALS {targetDigit}</span>
                                <span className='dcircles__triple-count'>{equalCount} ticks</span>
                            </div>
                            <div className='dcircles__triple-block dcircles__triple-block--under'>
                                <span className='dcircles__split-pct'>{underPct}%</span>
                                <span className='dcircles__split-label'>UNDER {targetDigit}</span>
                                <span className='dcircles__triple-count'>{underCount} ticks</span>
                            </div>
                        </div>
                    </>
                )}
                <p className='dcircles__pattern-heading'>LAST 50 DIGITS PATTERN</p>
                <div className='dcircles__pattern-grid'>
                    {patternSlice.map((t, i) => {
                        if (patternMode === 'evenodd') {
                            const isEven = t.digit % 2 === 0;
                            return (
                                <span
                                    key={`${t.epoch}-${i}`}
                                    className={`dcircles__pattern-cell ${isEven ? 'dcircles__pattern-cell--even' : 'dcircles__pattern-cell--odd'}`}
                                >
                                    {isEven ? 'E' : 'O'}
                                </span>
                            );
                        }
                        const isOver = t.digit > targetDigit;
                        const isEqual = t.digit === targetDigit;
                        return (
                            <span
                                key={`${t.epoch}-${i}`}
                                className={[
                                    'dcircles__pattern-cell',
                                    isOver
                                        ? 'dcircles__pattern-cell--even'
                                        : isEqual
                                          ? 'dcircles__pattern-cell--equal'
                                          : 'dcircles__pattern-cell--odd',
                                ].join(' ')}
                            >
                                {t.digit}
                            </span>
                        );
                    })}
                </div>
            </section>

            {/* ── Market Movement ── */}
            <section className='dcircles__card'>
                <h2 className='dcircles__card-title'>MARKET MOVEMENT</h2>
                <div className='dcircles__split'>
                    <div className='dcircles__split-block dcircles__split-block--even'>
                        <span className='dcircles__split-pct'>{risePct}%</span>
                        <span className='dcircles__split-label'>RISE</span>
                    </div>
                    <div className='dcircles__split-block dcircles__split-block--odd'>
                        <span className='dcircles__split-pct'>{fallPct}%</span>
                        <span className='dcircles__split-label'>FALL</span>
                    </div>
                </div>
            </section>

            {/* ── Last Digits Stream ── */}
            <section className='dcircles__card'>
                <h2 className='dcircles__card-title'>LAST DIGITS STREAM</h2>
                <div className='dcircles__stream'>
                    {Array.from({ length: 100 }, (_, i) => {
                        const streamSlice = ticks.slice(-100);
                        const offset = i - (100 - streamSlice.length);
                        const t = offset >= 0 ? streamSlice[offset] : null;
                        const isLatest = i === 99 && t !== null;
                        return t ? (
                            <span
                                key={`${t.epoch}-${i}`}
                                className={[
                                    'dcircles__stream-digit',
                                    t.digit % 2 === 0 ? 'dcircles__stream-digit--even' : 'dcircles__stream-digit--odd',
                                    isLatest ? 'dcircles__stream-digit--latest' : '',
                                ]
                                    .filter(Boolean)
                                    .join(' ')}
                            >
                                {t.digit}
                            </span>
                        ) : (
                            <span key={`empty-${i}`} className='dcircles__stream-digit dcircles__stream-digit--empty' />
                        );
                    })}
                </div>
            </section>

            {/* ── Statistics ── */}
            <section className='dcircles__card dcircles__stats-row'>
                <div className='dcircles__stat'>
                    <span className='dcircles__stat-label'>Total Ticks</span>
                    <span className='dcircles__stat-value'>{ticks.length}</span>
                </div>
                <div className='dcircles__stat'>
                    <span className='dcircles__stat-label'>Pip Size</span>
                    <span className='dcircles__stat-value'>{pipSize}</span>
                </div>
            </section>
        </div>
    );
};

export default DCircles;
