import React, { useCallback, useRef, useState } from 'react';
import Dialog from '@/components/shared_ui/dialog';
import { load, save_types } from '@/external/bot-skeleton';
import { generateDerivApiInstance } from '@/external/bot-skeleton/services/api/appId';
import { useStore } from '@/hooks/useStore';
import './ai-fab.scss';

// ── Constants ─────────────────────────────────────────────────────────────────

const PRESETS = [
    { label: 'Over1 / Under8', mode: '01 / U8', overDigit: 1, underDigit: 8 },
    { label: 'Over2 / Under7', mode: '02 / U7', overDigit: 2, underDigit: 7 },
    { label: 'Over3 / Under6', mode: '03 / U6', overDigit: 3, underDigit: 6 },
];

const SYMBOLS = [
    { label: 'Volatility 100 (1s)', value: '1HZ100V' },
    { label: 'Volatility 75 (1s)', value: '1HZ75V' },
    { label: 'Volatility 50 (1s)', value: '1HZ50V' },
    { label: 'Volatility 25 (1s)', value: '1HZ25V' },
    { label: 'Volatility 10 (1s)', value: '1HZ10V' },
    { label: 'Volatility 100', value: 'R_100' },
    { label: 'Volatility 75', value: 'R_75' },
    { label: 'Volatility 50', value: 'R_50' },
    { label: 'Volatility 25', value: 'R_25' },
    { label: 'Volatility 10', value: 'R_10' },
];

// ── Types ─────────────────────────────────────────────────────────────────────

type ScanResult = {
    symbol: string;
    label: string;
    winRate: number; // 0–1
    recentStreak: number; // consecutive losses at end of window
    score: number; // 0–1, higher = stronger recovery candidate
    tradeType: string; // "Over 1" | "Under 8"
};

// ── Scan core ─────────────────────────────────────────────────────────────────

function analyzeDigits(
    digits: number[],
    overDigit: number,
    underDigit: number
): { winRate: number; recentStreak: number; tradeType: string } {
    const total = digits.length;
    if (total === 0) return { winRate: 0, recentStreak: 0, tradeType: `Over ${overDigit}` };

    const overWins = digits.filter(d => d > overDigit).length;
    const underWins = digits.filter(d => d < underDigit).length;
    const useOver = overWins >= underWins;
    const winRate = (useOver ? overWins : underWins) / total;
    const tradeType = useOver ? `Over ${overDigit}` : `Under ${underDigit}`;

    // consecutive losses at the tail of the window
    let recentStreak = 0;
    for (let i = digits.length - 1; i >= 0; i--) {
        const won = useOver ? digits[i] > overDigit : digits[i] < underDigit;
        if (!won) recentStreak++;
        else break;
    }

    return { winRate, recentStreak, tradeType };
}

// ── Scanner hook ──────────────────────────────────────────────────────────────

function useScanner() {
    const [scanning, setScanning] = useState(false);
    const [result, setResult] = useState<ScanResult | null>(null);
    const [scanErr, setScanErr] = useState<string | null>(null);
    const abortRef = useRef(false);

    const scan = useCallback(async (symbols: string[], presetIdx: number, depth: number) => {
        setScanning(true);
        setResult(null);
        setScanErr(null);
        abortRef.current = false;

        const { overDigit, underDigit } = PRESETS[presetIdx];

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let api: any = null;
        try {
            api = generateDerivApiInstance();
            await new Promise<void>(resolve => {
                if (api.connection.readyState === WebSocket.OPEN) {
                    resolve();
                } else {
                    api.connection.addEventListener('open', () => resolve(), { once: true });
                }
            });

            if (abortRef.current) return;

            // Parallel fetch for all symbols on one connection
            const rows = await Promise.all(
                symbols.map(async sym => {
                    try {
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        const res: any = await api.send({
                            ticks_history: sym,
                            count: depth,
                            end: 'latest',
                            style: 'ticks',
                        });
                        if (!res?.history?.prices?.length) return null;
                        const pip = res.pip_size ?? 2;
                        const digits: number[] = (res.history.prices as number[]).map(p => {
                            const s = p.toFixed(pip);
                            return parseInt(s[s.length - 1]);
                        });
                        const analysis = analyzeDigits(digits, overDigit, underDigit);
                        // Score: 40% base win rate + 60% recovery urgency (capped at 5 losses)
                        const score = analysis.winRate * 0.4 + Math.min(analysis.recentStreak / 5, 1) * 0.6;
                        return {
                            symbol: sym,
                            label: SYMBOLS.find(s => s.value === sym)?.label ?? sym,
                            ...analysis,
                            score,
                        } as ScanResult;
                    } catch (_e) {
                        return null;
                    }
                })
            );

            if (abortRef.current) return;

            const valid = rows.filter((r): r is ScanResult => r !== null);
            if (!valid.length) {
                setScanErr('No data returned from server');
                return;
            }

            const best = valid.sort((a, b) => b.score - a.score)[0];
            setResult(best);
        } catch (_e) {
            setScanErr('Connection failed. Check your network.');
        } finally {
            setScanning(false);
            try {
                api?.disconnect?.();
            } catch (_e) {
                /* noop */
            }
        }
    }, []);

    const abort = useCallback(() => {
        abortRef.current = true;
        setScanning(false);
    }, []);

    return { scanning, result, scanErr, scan, abort };
}

// ── SVG Icons ─────────────────────────────────────────────────────────────────

// ── Bot XML generator ─────────────────────────────────────────────────────────

function generateBotXml(symbol: string, digit: number, purchaseType: 'DIGITOVER' | 'DIGITUNDER'): string {
    return `<xml xmlns="https://developers.google.com/blockly/xml" is_dbot="true">
  <block type="trade_definition" deletable="false" x="0" y="0">
    <statement name="TRADE_OPTIONS">
      <block type="trade_definition_market" deletable="false" movable="false">
        <field name="MARKET_LIST">synthetic_index</field>
        <field name="SUBMARKET_LIST">random_index</field>
        <field name="SYMBOL_LIST">${symbol}</field>
        <next>
          <block type="trade_definition_tradetype" deletable="false" movable="false">
            <field name="TRADETYPECAT_LIST">digits</field>
            <field name="TRADETYPE_LIST">overunder</field>
            <next>
              <block type="trade_definition_contracttype" deletable="false" movable="false">
                <field name="TYPE_LIST">both</field>
                <next>
                  <block type="trade_definition_candleinterval" deletable="false" movable="false">
                    <field name="CANDLEINTERVAL_LIST">60</field>
                    <next>
                      <block type="trade_definition_restartbuysell" deletable="false" movable="false">
                        <field name="TIME_MACHINE_ENABLED">FALSE</field>
                        <next>
                          <block type="trade_definition_restartonerror" deletable="false" movable="false">
                            <field name="RESTARTONERROR">TRUE</field>
                          </block>
                        </next>
                      </block>
                    </next>
                  </block>
                </next>
              </block>
            </next>
          </block>
        </next>
      </block>
    </statement>
    <statement name="PURCHASE_LIMTS_DEFINITION">
      <block type="trade_definition_purchase" deletable="false" movable="false">
        <mutation has_first_barrier="false" has_second_barrier="false" has_prediction="true"/>
        <field name="DURATIONTYPE_LIST">t</field>
        <value name="DURATION">
          <shadow type="math_number_positive">
            <field name="NUM">1</field>
          </shadow>
        </value>
        <value name="AMOUNT">
          <shadow type="math_number_positive">
            <field name="NUM">1.00</field>
          </shadow>
        </value>
        <value name="PREDICTION">
          <shadow type="math_number_positive">
            <field name="NUM">${digit}</field>
          </shadow>
        </value>
        <value name="PURCHASE">
          <block type="purchase">
            <field name="PURCHASE_LIST">${purchaseType}</field>
          </block>
        </value>
      </block>
    </statement>
    <statement name="INITIALIZATION"></statement>
    <statement name="BEFORE_PURCHASE_STACK"></statement>
    <statement name="DURING_PURCHASE_STACK"></statement>
    <statement name="AFTERPURCHASE_STACK"></statement>
  </block>
</xml>`;
}

// ── SVG Icons ─────────────────────────────────────────────────────────────────

const ScannerRingIcon = () => (
    <svg className='es-hero__ring-icon' viewBox='0 0 48 48' fill='none'>
        <circle cx='24' cy='24' r='22' stroke='rgba(96,165,250,0.3)' strokeWidth='1.5' strokeDasharray='4 3' />
        <circle cx='24' cy='24' r='15' stroke='rgba(96,165,250,0.5)' strokeWidth='1.5' />
        <circle cx='24' cy='24' r='8' stroke='rgba(96,165,250,0.8)' strokeWidth='1.5' />
        <circle cx='24' cy='24' r='3' fill='#60a5fa' />
        <line x1='24' y1='2' x2='24' y2='9' stroke='rgba(96,165,250,0.6)' strokeWidth='1.5' strokeLinecap='round' />
        <line x1='24' y1='39' x2='24' y2='46' stroke='rgba(96,165,250,0.6)' strokeWidth='1.5' strokeLinecap='round' />
        <line x1='2' y1='24' x2='9' y2='24' stroke='rgba(96,165,250,0.6)' strokeWidth='1.5' strokeLinecap='round' />
        <line x1='39' y1='24' x2='46' y2='24' stroke='rgba(96,165,250,0.6)' strokeWidth='1.5' strokeLinecap='round' />
    </svg>
);

const SparkleIcon = () => (
    <svg width='12' height='12' viewBox='0 0 24 24' fill='currentColor'>
        <path d='M12 2L13.09 8.26L19 6L14.74 10.91L21 12L14.74 13.09L19 18L13.09 15.74L12 22L10.91 15.74L5 18L9.26 13.09L3 12L9.26 10.91L5 6L10.91 8.26L12 2Z' />
    </svg>
);
const SearchIcon = () => (
    <svg
        width='16'
        height='16'
        viewBox='0 0 24 24'
        fill='none'
        stroke='currentColor'
        strokeWidth='2'
        strokeLinecap='round'
        strokeLinejoin='round'
    >
        <circle cx='11' cy='11' r='8' />
        <path d='m21 21-4.35-4.35' />
    </svg>
);
const BotIcon = () => (
    <svg
        width='15'
        height='15'
        viewBox='0 0 24 24'
        fill='none'
        stroke='currentColor'
        strokeWidth='2'
        strokeLinecap='round'
        strokeLinejoin='round'
    >
        <rect width='18' height='14' x='3' y='8' rx='2' />
        <path d='M9 8V6a3 3 0 0 1 6 0v2' />
        <circle cx='9' cy='14' r='1' fill='currentColor' />
        <circle cx='15' cy='14' r='1' fill='currentColor' />
        <path d='M9 17h6' />
    </svg>
);
const CheckIcon = () => (
    <svg
        width='15'
        height='15'
        viewBox='0 0 24 24'
        fill='none'
        stroke='currentColor'
        strokeWidth='2.5'
        strokeLinecap='round'
        strokeLinejoin='round'
    >
        <path d='M20 6L9 17l-5-5' />
    </svg>
);
const AlertIcon = () => (
    <svg
        width='15'
        height='15'
        viewBox='0 0 24 24'
        fill='none'
        stroke='currentColor'
        strokeWidth='2'
        strokeLinecap='round'
        strokeLinejoin='round'
    >
        <circle cx='12' cy='12' r='10' />
        <line x1='12' y1='8' x2='12' y2='12' />
        <line x1='12' y1='16' x2='12.01' y2='16' />
    </svg>
);
const WaitIcon = () => (
    <svg
        width='15'
        height='15'
        viewBox='0 0 24 24'
        fill='none'
        stroke='currentColor'
        strokeWidth='2'
        strokeLinecap='round'
        strokeLinejoin='round'
    >
        <circle cx='12' cy='12' r='10' />
        <polyline points='12 6 12 12 16 14' />
    </svg>
);
const GridIcon = () => (
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
        <rect x='3' y='3' width='7' height='7' />
        <rect x='14' y='3' width='7' height='7' />
        <rect x='14' y='14' width='7' height='7' />
        <rect x='3' y='14' width='7' height='7' />
    </svg>
);

// ── Entry Scanner ─────────────────────────────────────────────────────────────

const EntryScanner = ({ onClose }: { onClose: () => void }) => {
    const [activePreset, setActivePreset] = useState(0);
    const [depth, setDepth] = useState(3000);
    const [multiMarket, setMultiMarket] = useState(true);
    const [singleSymbol, setSingleSymbol] = useState(SYMBOLS[4].value);
    const [loadingBot, setLoadingBot] = useState(false);
    const { scanning, result, scanErr, scan, abort } = useScanner();
    const { dashboard } = useStore();

    const handleScan = () => {
        if (scanning) {
            abort();
            return;
        }
        const targets = multiMarket ? SYMBOLS.map(s => s.value) : [singleSymbol];
        void scan(targets, activePreset, depth);
    };

    const handleLoadBot = async () => {
        if (!result) return;
        setLoadingBot(true);
        try {
            // Parse digit and direction from tradeType ("Over 1" → digit=1, DIGITOVER)
            const isOver = result.tradeType.startsWith('Over');
            const digit = parseInt(result.tradeType.split(' ')[1]);
            const purchase = isOver ? 'DIGITOVER' : 'DIGITUNDER';
            const botName = `Scanner Bot — ${result.label} ${result.tradeType}`;
            const xml = generateBotXml(result.symbol, digit, purchase);

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const workspace = (window as any).Blockly?.derivWorkspace;
            await load({
                block_string: xml,
                file_name: botName,
                workspace,
                from: save_types.LOCAL,
                drop_event: null,
                strategy_id: null,
                showIncompatibleStrategyDialog: null,
            });
            dashboard.setActiveTab(1);
            window.location.hash = 'bot_builder';
            onClose();
        } catch (_e) {
            /* noop */
        } finally {
            setLoadingBot(false);
        }
    };

    const preset = PRESETS[activePreset];

    // ── Status display ────────────────────────────────────────────────────────
    const statusContent = () => {
        if (scanning)
            return (
                <span className='es-status es-status--scanning'>
                    <span className='es-status__spinner' />
                    <span>Scanning {multiMarket ? `all ${SYMBOLS.length}` : '1'} markets…</span>
                </span>
            );
        if (scanErr)
            return (
                <span className='es-status es-status--error'>
                    <AlertIcon />
                    <span>{scanErr}</span>
                </span>
            );
        if (result)
            return (
                <span className='es-status es-status--success'>
                    <CheckIcon />
                    <span>
                        Win rate <strong>{(result.winRate * 100).toFixed(1)}%</strong>
                        {result.recentStreak > 0 && (
                            <>
                                {' '}
                                · <strong>{result.recentStreak}</strong> consecutive loss
                                {result.recentStreak !== 1 ? 'es' : ''} — recovery zone
                            </>
                        )}
                    </span>
                </span>
            );
        return (
            <span className='es-status es-status--idle'>
                <WaitIcon />
                <span>Not scanned yet</span>
            </span>
        );
    };

    return (
        <div className='entry-scanner'>
            {/* ── Hero ── */}
            <div className='es-hero'>
                <div className='es-hero__left'>
                    <span className='es-hero__badge'>
                        <SparkleIcon /> RECOVERY ENGINE
                    </span>
                    <h2 className='es-hero__title'>Digits Scanner</h2>
                    <p className='es-hero__desc'>Scans {preset.label} with recovery confirmation.</p>
                </div>
                <div className='es-hero__right'>
                    <div className='es-hero__ring-wrap'>
                        <div className={`es-hero__ring-orbit${scanning ? ' es-hero__ring-orbit--fast' : ''}`} />
                        <ScannerRingIcon />
                    </div>
                </div>
            </div>

            {/* ── Preset tabs ── */}
            <div className='es-presets'>
                {PRESETS.map((p, i) => (
                    <button
                        key={p.label}
                        className={`es-presets__btn${activePreset === i ? ' es-presets__btn--active' : ''}`}
                        onClick={() => setActivePreset(i)}
                    >
                        {p.label}
                    </button>
                ))}
            </div>

            {/* ── Multi-market toggle ── */}
            <div className='es-toggle'>
                <button
                    className={`es-toggle__switch${multiMarket ? ' es-toggle__switch--on' : ''}`}
                    onClick={() => setMultiMarket(v => !v)}
                    aria-pressed={multiMarket}
                    aria-label='Toggle multi-market scan'
                >
                    <span className='es-toggle__thumb' />
                </button>
                <div className='es-toggle__info'>
                    <span className='es-toggle__label'>
                        <GridIcon />
                        Multi-market
                    </span>
                    <span className='es-toggle__sub'>
                        {multiMarket
                            ? `Scanning all ${SYMBOLS.length} markets — best entry selected automatically`
                            : 'Scanning selected market only'}
                    </span>
                </div>
            </div>

            {/* ── Single-market selector (only when multi is off) ── */}
            {!multiMarket && (
                <div className='es-field'>
                    <span className='es-field__label'>MARKET</span>
                    <select
                        className='es-field__select'
                        value={singleSymbol}
                        onChange={e => setSingleSymbol(e.target.value)}
                    >
                        {SYMBOLS.map(s => (
                            <option key={s.value} value={s.value}>
                                {s.label}
                            </option>
                        ))}
                    </select>
                </div>
            )}

            {/* ── Fields row 1 ── */}
            <div className='es-fields'>
                <div className='es-field'>
                    <span className='es-field__label'>SCAN DEPTH</span>
                    <span className='es-field__value'>{depth.toLocaleString()}</span>
                </div>
                <div className='es-field'>
                    <span className='es-field__label'>MODE</span>
                    <span className='es-field__value'>{preset.mode}</span>
                </div>
                <div className='es-field es-field--ticks'>
                    <span className='es-field__label'>TICKS</span>
                    <input
                        className='es-field__input'
                        type='number'
                        value={depth}
                        min={100}
                        max={5000}
                        onChange={e => setDepth(Math.max(100, Math.min(5000, Number(e.target.value))))}
                    />
                </div>
            </div>

            {/* ── Fields row 2: results ── */}
            <div className='es-fields es-fields--row2'>
                <div className='es-field es-field--wide'>
                    <span className='es-field__label'>SELECTED MARKET</span>
                    <span className={`es-field__value${!result ? ' es-field__value--muted' : ''}`}>
                        {result ? result.label : 'Scan to find the best market'}
                    </span>
                </div>
                <div className='es-field'>
                    <span className='es-field__label'>TRADE TYPE</span>
                    <span
                        className={`es-field__value${!result ? ' es-field__value--muted' : ' es-field__value--highlight'}`}
                    >
                        {result ? result.tradeType : 'Waiting for scan'}
                    </span>
                </div>
            </div>

            {/* ── Status ── */}
            {statusContent()}

            {/* ── Footer ── */}
            <div className='es-footer'>
                <button
                    className={`es-footer__btn es-footer__btn--primary${scanning ? ' es-footer__btn--scanning' : ''}`}
                    onClick={handleScan}
                >
                    {scanning ? (
                        <>
                            <span className='es-footer__btn-spinner' /> Stop Scan
                        </>
                    ) : (
                        <>
                            <SearchIcon /> Scan Markets
                        </>
                    )}
                </button>
                <button
                    className={`es-footer__btn es-footer__btn--secondary${!result || loadingBot ? ' es-footer__btn--disabled' : ''}`}
                    disabled={!result || loadingBot}
                    onClick={handleLoadBot}
                    title={result ? 'Load bot for this market' : 'Run a scan first'}
                >
                    {loadingBot ? (
                        <>
                            <span className='es-footer__btn-spinner' />
                            Loading…
                        </>
                    ) : (
                        <>
                            <BotIcon />
                            Load Scanner Bot
                        </>
                    )}
                </button>
            </div>
        </div>
    );
};

// ── Draggable AI FAB ─────────────────────────────────────────────────────────

const AiFab = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [pos, setPos] = useState({ x: -1, y: -1 });
    const isDragging = useRef(false);
    const dragStart = useRef({ x: 0, y: 0 });
    const posStart = useRef({ x: 0, y: 0 });
    const hasMoved = useRef(false);

    React.useEffect(() => {
        setPos({ x: window.innerWidth - 72, y: window.innerHeight - 72 });
    }, []);

    const onPointerDown = useCallback(
        (e: React.PointerEvent<HTMLButtonElement>) => {
            isDragging.current = true;
            hasMoved.current = false;
            dragStart.current = { x: e.clientX, y: e.clientY };
            posStart.current = { ...pos };
            (e.currentTarget as HTMLButtonElement).setPointerCapture(e.pointerId);
            e.preventDefault();
        },
        [pos]
    );

    const onPointerMove = useCallback((e: React.PointerEvent<HTMLButtonElement>) => {
        if (!isDragging.current) return;
        const dx = e.clientX - dragStart.current.x;
        const dy = e.clientY - dragStart.current.y;
        if (Math.abs(dx) > 4 || Math.abs(dy) > 4) hasMoved.current = true;
        setPos({
            x: Math.max(32, Math.min(window.innerWidth - 32, posStart.current.x + dx)),
            y: Math.max(32, Math.min(window.innerHeight - 32, posStart.current.y + dy)),
        });
    }, []);

    const onPointerUp = useCallback(() => {
        isDragging.current = false;
    }, []);
    const handleClick = useCallback(() => {
        if (!hasMoved.current) setIsOpen(true);
    }, []);

    if (pos.x < 0) return null;

    return (
        <>
            {!isOpen && (
                <button
                    className='ai-fab'
                    style={{ left: pos.x, top: pos.y }}
                    onPointerDown={onPointerDown}
                    onPointerMove={onPointerMove}
                    onPointerUp={onPointerUp}
                    onClick={handleClick}
                    aria-label='Open AI Entry Scanner'
                >
                    <span className='ai-fab__pulse ai-fab__pulse--1' />
                    <span className='ai-fab__pulse ai-fab__pulse--2' />
                    <span className='ai-fab__arc' />
                    <span className='ai-fab__core'>
                        <span className='ai-fab__label'>AI</span>
                        <span className='ai-fab__dot' />
                    </span>
                </button>
            )}

            {isOpen && (
                <Dialog
                    className='entry-scanner-dialog'
                    title='Entry Scanner'
                    has_close_icon
                    is_visible={isOpen}
                    onClose={() => setIsOpen(false)}
                    onConfirm={() => setIsOpen(false)}
                    login={() => {
                        /* noop */
                    }}
                    dismissable
                    is_mobile_full_width={false}
                    portal_element_id='modal_root'
                >
                    <EntryScanner onClose={() => setIsOpen(false)} />
                </Dialog>
            )}
        </>
    );
};

export default AiFab;
