import { useEffect, useRef, useState } from 'react';
import classNames from 'classnames';
import { api_base } from '@/external/bot-skeleton';
import chart_api from '@/external/bot-skeleton/services/api/chart-api';
import { useStore } from '@/hooks/useStore';
import {
    ActiveSymbolsRequest,
    ServerTimeRequest,
    TicksHistoryResponse,
    TicksStreamRequest,
    TradingTimesRequest,
} from '@deriv/api-types';
import { ChartTitle, SmartChart } from '@deriv/deriv-charts';
import { useDevice } from '@deriv-com/ui';
import ToolbarWidgets from '../chart/toolbar-widgets';
import '@deriv/deriv-charts/dist/smartcharts.css';
import './manual-trader.scss';

type DurationUnit = 't' | 's' | 'm';
type ContractType = 'CALL' | 'PUT' | 'DIGITEVEN' | 'DIGITODD' | 'DIGITMATCH' | 'DIGITDIFF';
type Category = 'rise_fall' | 'digits';

interface ProposalData {
    id: string;
    ask_price: number;
    payout: number;
}

interface OpenContract {
    contract_id: number;
    contract_type: ContractType;
    buy_price: number;
    payout: number;
    symbol: string;
    is_sold: boolean;
    profit?: number;
}

const mt_chart_subs: Record<string, null | { unsubscribe?: () => void }> = {};

const DIGIT_LABEL: Record<string, string> = {
    DIGITEVEN: 'Even',
    DIGITODD: 'Odd',
    DIGITMATCH: 'Match',
    DIGITDIFF: 'Differ',
};

const ManualTrader = () => {
    const { common, ui, chart_store } = useStore();
    const { isDesktop, isMobile } = useDevice();

    // ── Chart state ────────────────────────────────────────────────────────────
    const [symbol, setSymbol] = useState<string>(() => api_base.active_symbols?.[0]?.symbol ?? '1HZ100V');
    const [chartType, setChartType] = useState('line');
    const [granularity, setGranularity] = useState(0);
    const chartSubIdRef = useRef('');

    // ── Trade state ────────────────────────────────────────────────────────────
    const [category, setCategory] = useState<Category>('rise_fall');
    const [contractType, setContractType] = useState<ContractType>('CALL');
    const [duration, setDuration] = useState(5);
    const [durationUnit, setDurationUnit] = useState<DurationUnit>('t');
    const [stake, setStake] = useState('10');
    const [digit, setDigit] = useState(5);

    // ── Proposal state ─────────────────────────────────────────────────────────
    const [proposal, setProposal] = useState<ProposalData | null>(null);
    const [proposalError, setProposalError] = useState('');
    const proposalSubIdRef = useRef('');

    // ── Buy / contracts state ──────────────────────────────────────────────────
    const [isBuying, setIsBuying] = useState(false);
    const [buyMsg, setBuyMsg] = useState<{ text: string; ok: boolean } | null>(null);
    const [openContracts, setOpenContracts] = useState<OpenContract[]>([]);

    const currency = (api_base.account_info as any)?.currency ?? 'USD';

    // ── One global onMessage subscription ─────────────────────────────────────
    useEffect(() => {
        if (!api_base.api) return;
        const sub = (api_base.api as any).onMessage().subscribe(({ data }: any) => {
            if (data?.msg_type === 'proposal') {
                // Accept if we have no current ID yet (first response of new sub) or ID matches
                if (proposalSubIdRef.current && data.proposal?.id !== proposalSubIdRef.current) return;
                if (data.error) {
                    setProposalError(data.error.message ?? 'Quote error');
                    setProposal(null);
                } else if (data.proposal) {
                    proposalSubIdRef.current = data.proposal.id;
                    setProposal({
                        id: data.proposal.id,
                        ask_price: data.proposal.ask_price,
                        payout: data.proposal.payout,
                    });
                    setProposalError('');
                }
            }
            if (data?.msg_type === 'proposal_open_contract') {
                const poc = data.proposal_open_contract;
                if (poc?.is_sold) {
                    setOpenContracts(prev =>
                        prev.map(c =>
                            c.contract_id === poc.contract_id ? { ...c, is_sold: true, profit: poc.profit } : c
                        )
                    );
                }
            }
        });
        return () => sub.unsubscribe();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ── Re-subscribe proposal on input changes ─────────────────────────────────
    // Combine all proposal-affecting values into one key for a single dep
    const proposalKey = [symbol, contractType, duration, durationUnit, stake, digit].join('|');

    useEffect(() => {
        if (!api_base.is_authorized || !api_base.api) {
            setProposal(null);
            return;
        }
        let cancelled = false;
        const timer = setTimeout(() => {
            if (cancelled) return;

            // Forget old proposal subscription
            if (proposalSubIdRef.current) {
                (api_base.api as any)?.send({ forget: proposalSubIdRef.current }).catch(() => {});
                proposalSubIdRef.current = '';
            }
            setProposal(null);
            setProposalError('');

            const req: Record<string, unknown> = {
                proposal: 1,
                amount: Math.max(0.01, parseFloat(stake) || 0.01),
                basis: 'stake',
                contract_type: contractType,
                currency,
                duration,
                duration_unit: durationUnit,
                underlying_symbol: symbol,
                subscribe: 1,
            };
            if (contractType === 'DIGITMATCH' || contractType === 'DIGITDIFF') {
                req.barrier = digit.toString();
            }

            (api_base.api as any)?.send(req).catch((e: any) => {
                if (!cancelled) setProposalError(e?.error?.message ?? 'Failed to get quote');
            });
        }, 400);

        return () => {
            cancelled = true;
            clearTimeout(timer);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [proposalKey]);

    // ── Cleanup on unmount ─────────────────────────────────────────────────────
    useEffect(() => {
        return () => {
            if (proposalSubIdRef.current && api_base.api) {
                (api_base.api as any).send({ forget: proposalSubIdRef.current }).catch(() => {});
            }
            if (chartSubIdRef.current) {
                chart_api.api?.forget(chartSubIdRef.current);
            }
        };
    }, []);

    // ── Chart API callbacks ────────────────────────────────────────────────────
    const requestAPI = (req: ServerTimeRequest | ActiveSymbolsRequest | TradingTimesRequest) => chart_api.api.send(req);

    const requestForgetStream = (id: string) => {
        id && chart_api.api.forget(id);
    };

    const requestSubscribe = async (req: TicksStreamRequest, callback: (data: any) => void) => {
        try {
            requestForgetStream(chartSubIdRef.current);
            const history = await chart_api.api.send(req);
            chartSubIdRef.current = history?.subscription?.id ?? '';
            if (history) callback(history);
            if (req.subscribe === 1) {
                mt_chart_subs[chartSubIdRef.current] = chart_api.api
                    .onMessage()
                    ?.subscribe(({ data }: { data: TicksHistoryResponse }) => callback(data));
            }
        } catch (e: any) {
            if (e?.error?.code === 'MarketIsClosed') callback([]);
        }
    };

    // ── Buy handler ────────────────────────────────────────────────────────────
    const handleBuy = async () => {
        if (!proposal || isBuying || !api_base.api) return;
        setIsBuying(true);
        setBuyMsg(null);
        try {
            const response: any = await (api_base.api as any).send({
                buy: proposal.id,
                price: proposal.ask_price,
            });
            const { buy } = response;
            setBuyMsg({ text: `Contract #${buy.contract_id} — ${currency} ${buy.buy_price.toFixed(2)}`, ok: true });
            setOpenContracts(prev => [
                {
                    contract_id: buy.contract_id,
                    contract_type: contractType,
                    buy_price: buy.buy_price,
                    payout: buy.payout,
                    symbol,
                    is_sold: false,
                },
                ...prev.slice(0, 9),
            ]);
            // Subscribe to contract lifecycle updates
            (api_base.api as any)
                .send({ proposal_open_contract: 1, contract_id: buy.contract_id, subscribe: 1 })
                .catch(() => {});
        } catch (e: any) {
            setBuyMsg({ text: e?.error?.message ?? 'Trade failed', ok: false });
        } finally {
            setIsBuying(false);
        }
    };

    // ── Category switch ────────────────────────────────────────────────────────
    const switchCategory = (cat: Category) => {
        setCategory(cat);
        if (cat === 'digits') {
            setContractType('DIGITEVEN');
            setDurationUnit('t');
            setDuration(prev => Math.min(prev, 10));
        } else {
            setContractType('CALL');
        }
    };

    // ── Derived buy button label ───────────────────────────────────────────────
    const buyLabel = () => {
        const amt = `${currency} ${(parseFloat(stake) || 0).toFixed(2)}`;
        if (contractType === 'CALL') return `▲ Rise — ${amt}`;
        if (contractType === 'PUT') return `▼ Fall — ${amt}`;
        if (contractType === 'DIGITMATCH') return `Match ${digit} — ${amt}`;
        if (contractType === 'DIGITDIFF') return `Differ ${digit} — ${amt}`;
        return `${DIGIT_LABEL[contractType]} — ${amt}`;
    };

    const isAuthorized = api_base.is_authorized;
    const isConnectionOpened = !!chart_api?.api;

    const settings = {
        assetInformation: false,
        countdown: true,
        isHighestLowestMarkerEnabled: false,
        language: common.current_language.toLowerCase(),
        position: ui.is_chart_layout_default ? 'bottom' : 'left',
        theme: ui.is_dark_mode_on ? 'dark' : 'light',
    };

    return (
        <div className='mt-page'>
            {/* ── Chart ── */}
            <div className='mt-chart'>
                <div className='mt-chart__inner' dir='ltr'>
                    <SmartChart
                        id='mt-chart'
                        barriers={[]}
                        showLastDigitStats={category === 'digits'}
                        chartControlsWidgets={null}
                        enabledChartFooter={false}
                        chartStatusListener={() => {}}
                        toolbarWidget={() => (
                            <ToolbarWidgets
                                updateChartType={setChartType}
                                updateGranularity={setGranularity}
                                position={isDesktop ? 'top' : 'bottom'}
                                isDesktop={isDesktop}
                            />
                        )}
                        chartType={chartType}
                        isMobile={isMobile}
                        enabledNavigationWidget={isDesktop}
                        granularity={granularity}
                        requestAPI={requestAPI}
                        requestForget={() => {}}
                        requestForgetStream={requestForgetStream}
                        requestSubscribe={requestSubscribe}
                        settings={settings}
                        symbol={symbol}
                        topWidgets={() => <ChartTitle onChange={setSymbol} />}
                        isConnectionOpened={isConnectionOpened}
                        getMarketsOrder={chart_store.getMarketsOrder}
                        isLive
                        leftMargin={80}
                    />
                </div>
            </div>

            {/* ── Trade Panel ── */}
            <div className='mt-panel'>
                {/* Category tabs */}
                <div className='mt-panel__tabs'>
                    {(['rise_fall', 'digits'] as Category[]).map(cat => (
                        <button
                            key={cat}
                            className={classNames('mt-panel__tab', { 'mt-panel__tab--active': category === cat })}
                            onClick={() => switchCategory(cat)}
                        >
                            {cat === 'rise_fall' ? 'Rise / Fall' : 'Digits'}
                        </button>
                    ))}
                </div>

                {/* Rise / Fall direction */}
                {category === 'rise_fall' && (
                    <div className='mt-panel__direction'>
                        {(['CALL', 'PUT'] as ContractType[]).map(ct => (
                            <button
                                key={ct}
                                className={classNames('mt-panel__dir', {
                                    'mt-panel__dir--rise': ct === 'CALL',
                                    'mt-panel__dir--fall': ct === 'PUT',
                                    'mt-panel__dir--active': contractType === ct,
                                })}
                                onClick={() => setContractType(ct)}
                            >
                                {ct === 'CALL' ? '▲ Rise' : '▼ Fall'}
                            </button>
                        ))}
                    </div>
                )}

                {/* Digit type selector */}
                {category === 'digits' && (
                    <div className='mt-panel__digit-types'>
                        {(Object.keys(DIGIT_LABEL) as ContractType[]).map(ct => (
                            <button
                                key={ct}
                                className={classNames('mt-panel__digit-type', {
                                    'mt-panel__digit-type--active': contractType === ct,
                                })}
                                onClick={() => setContractType(ct)}
                            >
                                {DIGIT_LABEL[ct]}
                            </button>
                        ))}
                    </div>
                )}

                {/* Predicted digit for Match / Differ */}
                {(contractType === 'DIGITMATCH' || contractType === 'DIGITDIFF') && (
                    <div className='mt-panel__field'>
                        <span className='mt-panel__label'>Predicted digit</span>
                        <div className='mt-panel__digit-row'>
                            {Array.from({ length: 10 }, (_, i) => (
                                <button
                                    key={i}
                                    className={classNames('mt-panel__digit-pick', {
                                        'mt-panel__digit-pick--active': digit === i,
                                    })}
                                    onClick={() => setDigit(i)}
                                >
                                    {i}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Duration */}
                <div className='mt-panel__field'>
                    <span className='mt-panel__label'>Duration</span>
                    <div className='mt-panel__input-row'>
                        <input
                            type='number'
                            className='mt-panel__num'
                            value={duration}
                            min={1}
                            max={durationUnit === 't' ? 10 : 60}
                            onChange={e => setDuration(Math.max(1, parseInt(e.target.value) || 1))}
                        />
                        {category === 'rise_fall' ? (
                            <select
                                className='mt-panel__select'
                                value={durationUnit}
                                onChange={e => setDurationUnit(e.target.value as DurationUnit)}
                            >
                                <option value='t'>Ticks</option>
                                <option value='s'>Seconds</option>
                                <option value='m'>Minutes</option>
                            </select>
                        ) : (
                            <span className='mt-panel__unit'>Ticks</span>
                        )}
                    </div>
                </div>

                {/* Stake */}
                <div className='mt-panel__field'>
                    <span className='mt-panel__label'>Stake</span>
                    <div className='mt-panel__input-row'>
                        <span className='mt-panel__currency-badge'>{currency}</span>
                        <input
                            type='number'
                            className='mt-panel__num mt-panel__num--stake'
                            value={stake}
                            min={0.01}
                            step={1}
                            onChange={e => setStake(e.target.value)}
                        />
                    </div>
                </div>

                {/* Payout quote */}
                <div className='mt-panel__quote'>
                    {proposalError ? (
                        <p className='mt-panel__quote-err'>{proposalError}</p>
                    ) : proposal ? (
                        <>
                            <div className='mt-panel__quote-row'>
                                <span>Payout</span>
                                <strong className='mt-panel__quote-val'>
                                    {currency} {proposal.payout.toFixed(2)}
                                </strong>
                            </div>
                            <div className='mt-panel__quote-row'>
                                <span>Profit</span>
                                <strong className='mt-panel__quote-profit'>
                                    +{currency} {(proposal.payout - (parseFloat(stake) || 0)).toFixed(2)}
                                </strong>
                            </div>
                        </>
                    ) : (
                        <div className='mt-panel__quote-loading'>
                            <span className='mt-panel__spinner' />
                            <span>Fetching quote…</span>
                        </div>
                    )}
                </div>

                {/* Buy button */}
                <button
                    className={classNames('mt-panel__buy', {
                        'mt-panel__buy--rise': contractType === 'CALL',
                        'mt-panel__buy--fall': contractType === 'PUT',
                        'mt-panel__buy--digit': category === 'digits',
                        'mt-panel__buy--off': !proposal || isBuying || !isAuthorized,
                    })}
                    disabled={!proposal || isBuying || !isAuthorized}
                    onClick={handleBuy}
                >
                    {!isAuthorized ? 'Connect Deriv to trade' : isBuying ? 'Placing order…' : buyLabel()}
                </button>

                {buyMsg && (
                    <p
                        className={classNames('mt-panel__buy-msg', {
                            'mt-panel__buy-msg--ok': buyMsg.ok,
                            'mt-panel__buy-msg--err': !buyMsg.ok,
                        })}
                    >
                        {buyMsg.text}
                    </p>
                )}

                {/* Recent contracts */}
                {openContracts.length > 0 && (
                    <div className='mt-contracts'>
                        <p className='mt-contracts__heading'>Recent Contracts</p>
                        {openContracts.map(c => (
                            <div
                                key={c.contract_id}
                                className={classNames('mt-contracts__row', {
                                    'mt-contracts__row--live': !c.is_sold,
                                    'mt-contracts__row--won': c.is_sold && (c.profit ?? 0) > 0,
                                    'mt-contracts__row--lost': c.is_sold && (c.profit ?? 0) <= 0,
                                })}
                            >
                                <div className='mt-contracts__meta'>
                                    <span className='mt-contracts__type'>
                                        {c.contract_type.replace('DIGIT', '') || c.contract_type}
                                    </span>
                                    <span className='mt-contracts__sym'>{c.symbol}</span>
                                </div>
                                <div className='mt-contracts__nums'>
                                    <span className='mt-contracts__stake'>
                                        {currency} {c.buy_price.toFixed(2)}
                                    </span>
                                    {c.is_sold ? (
                                        <span
                                            className={classNames('mt-contracts__profit', {
                                                'mt-contracts__profit--pos': (c.profit ?? 0) > 0,
                                                'mt-contracts__profit--neg': (c.profit ?? 0) <= 0,
                                            })}
                                        >
                                            {(c.profit ?? 0) > 0 ? '+' : ''}
                                            {c.profit?.toFixed(2)}
                                        </span>
                                    ) : (
                                        <span className='mt-contracts__pulse' />
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ManualTrader;
