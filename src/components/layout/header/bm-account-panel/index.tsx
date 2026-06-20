import { useEffect, useRef, useState } from 'react';
import classNames from 'classnames';
import { createPortal } from 'react-dom';
import { type DerivAccount, useDerivAuth } from '@/hooks/useDerivAuth';
import './bm-account-panel.scss';

// ── Icons ─────────────────────────────────────────────────────────────────────

const ChevronIcon = ({ up }: { up: boolean }) => (
    <svg
        width='12'
        height='12'
        viewBox='0 0 24 24'
        fill='none'
        stroke='currentColor'
        strokeWidth='2.5'
        strokeLinecap='round'
        strokeLinejoin='round'
        style={{ transform: up ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s ease' }}
    >
        <path d='M6 9l6 6 6-6' />
    </svg>
);

const LogoutIcon = () => (
    <svg
        width='14'
        height='14'
        viewBox='0 0 24 24'
        fill='none'
        stroke='currentColor'
        strokeWidth='2'
        strokeLinecap='round'
        strokeLinejoin='round'
    >
        <path d='M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4' />
        <polyline points='16 17 21 12 16 7' />
        <line x1='21' y1='12' x2='9' y2='12' />
    </svg>
);

const CheckIcon = () => (
    <svg
        width='12'
        height='12'
        viewBox='0 0 24 24'
        fill='none'
        stroke='currentColor'
        strokeWidth='3'
        strokeLinecap='round'
        strokeLinejoin='round'
    >
        <polyline points='20 6 9 17 4 12' />
    </svg>
);

const EyeIcon = ({ visible }: { visible: boolean }) =>
    visible ? (
        <svg
            width='14'
            height='14'
            viewBox='0 0 24 24'
            fill='none'
            stroke='currentColor'
            strokeWidth='2'
            strokeLinecap='round'
            strokeLinejoin='round'
        >
            <path d='M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z' />
            <circle cx='12' cy='12' r='3' />
        </svg>
    ) : (
        <svg
            width='14'
            height='14'
            viewBox='0 0 24 24'
            fill='none'
            stroke='currentColor'
            strokeWidth='2'
            strokeLinecap='round'
            strokeLinejoin='round'
        >
            <path d='M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94' />
            <path d='M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19' />
            <line x1='1' y1='1' x2='23' y2='23' />
        </svg>
    );

// ── Helpers ───────────────────────────────────────────────────────────────────

const fmt = new Intl.NumberFormat('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function convertBalance(balance: number, currency: string, kesRate: number | null, useKes: boolean): string {
    if (useKes && kesRate && currency !== 'KES') return `KES ${fmt.format(balance * kesRate)}`;
    return `${currency} ${fmt.format(balance)}`;
}

// ── Account row ───────────────────────────────────────────────────────────────

type AccountRowProps = {
    account: DerivAccount;
    isActive: boolean;
    showBalance: boolean;
    kesRate: number | null;
    displayKes: boolean;
    onSwitch: (id: string) => void;
};

const AccountRow = ({ account, isActive, showBalance, kesRate, displayKes, onSwitch }: AccountRowProps) => (
    <button
        className={classNames('bm-ap__account', { 'bm-ap__account--active': isActive })}
        onClick={() => onSwitch(account.account_id)}
    >
        <div className='bm-ap__account-left'>
            <span
                className={classNames('bm-ap__account-dot', {
                    'bm-ap__account-dot--active': account.status === 'active',
                })}
            />
            <div className='bm-ap__account-info'>
                <span className='bm-ap__account-id'>{account.account_id}</span>
                <span className='bm-ap__account-group'>{account.group}</span>
            </div>
        </div>
        <div className='bm-ap__account-right'>
            <span className='bm-ap__account-balance'>
                {showBalance ? convertBalance(account.balance, account.currency, kesRate, displayKes) : '•••••'}
            </span>
            {isActive && (
                <span className='bm-ap__account-check'>
                    <CheckIcon />
                </span>
            )}
        </div>
    </button>
);

// ── Main panel ────────────────────────────────────────────────────────────────

type TabId = 'real' | 'demo';

const BmAccountPanel = () => {
    const { liveAccounts, demoAccounts, activeAccount, activeAccountId, switchAccount, logout, createAccount } =
        useDerivAuth();

    const [open, setOpen] = useState(false);
    const [tab, setTab] = useState<TabId>('real');
    const [dropPos, setDropPos] = useState({ top: 0, right: 0 });
    const [creating, setCreating] = useState<TabId | null>(null);
    const [createError, setCreateError] = useState('');
    const [showBalance, setShowBalance] = useState(true);
    const [kesRate, setKesRate] = useState<number | null>(null);
    const [displayKes, setDisplayKes] = useState(true);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const panelRef = useRef<HTMLDivElement>(null);

    const isActiveDemo = activeAccount?.account_type === 'demo';

    // Fetch USD→KES rate once on mount
    useEffect(() => {
        fetch('https://open.er-api.com/v6/latest/USD')
            .then(r => r.json())
            .then(data => {
                const rate = data?.rates?.KES;
                if (typeof rate === 'number') setKesRate(rate);
            })
            .catch(() => {});
    }, []);

    // Keep tab in sync with active account type
    useEffect(() => {
        if (activeAccount) setTab(activeAccount.account_type);
    }, [activeAccount]);

    const openPanel = () => {
        if (triggerRef.current) {
            const rect = triggerRef.current.getBoundingClientRect();
            setDropPos({ top: rect.bottom + 8, right: Math.max(8, window.innerWidth - rect.right) });
        }
        setOpen(v => !v);
    };

    useEffect(() => {
        if (!open) return;
        const close = (e: MouseEvent) => {
            const target = e.target as Node;
            if (!triggerRef.current?.contains(target) && !panelRef.current?.contains(target)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', close);
        return () => document.removeEventListener('mousedown', close);
    }, [open]);

    const handleSwitch = (id: string) => {
        switchAccount(id);
        setOpen(false);
    };

    const handleLogout = () => {
        setOpen(false);
        logout();
        window.location.replace('/');
    };

    const handleCreateAccount = async (type: TabId) => {
        setCreateError('');
        setCreating(type);
        try {
            await createAccount(type);
            setTab(type);
        } catch (err) {
            setCreateError(err instanceof Error ? err.message : String(err));
        } finally {
            setCreating(null);
        }
    };

    const tabAccounts = tab === 'real' ? liveAccounts : demoAccounts;

    const activeCurrencyLabel = activeAccount
        ? displayKes && kesRate && activeAccount.currency !== 'KES'
            ? 'KES'
            : activeAccount.currency
        : '—';

    const activeBalanceDisplay = activeAccount
        ? showBalance
            ? convertBalance(activeAccount.balance, activeAccount.currency, kesRate, displayKes)
            : '•••••'
        : '—';

    return (
        <>
            {/* ── Trigger ── */}
            <button
                ref={triggerRef}
                className={classNames('bm-ap__trigger', {
                    'bm-ap__trigger--open': open,
                    'bm-ap__trigger--demo': isActiveDemo,
                })}
                onClick={openPanel}
                aria-haspopup='true'
                aria-expanded={open}
            >
                <span className={classNames('bm-ap__trigger-badge', { 'bm-ap__trigger-badge--demo': isActiveDemo })}>
                    {isActiveDemo ? 'Demo' : 'Live'}
                </span>
                <div className='bm-ap__trigger-info'>
                    {/*<span className='bm-ap__trigger-currency'>{activeCurrencyLabel}</span>*/}
                    <span className='bm-ap__trigger-balance'>{activeBalanceDisplay}</span>
                </div>
                <div
                    role='button'
                    tabIndex={0}
                    className='bm-ap__balance-toggle'
                    onClick={e => {
                        e.stopPropagation();
                        setShowBalance(v => !v);
                    }}
                    onKeyDown={e => {
                        if (e.key === 'Enter' || e.key === ' ') {
                            e.stopPropagation();
                            setShowBalance(v => !v);
                        }
                    }}
                    aria-label={showBalance ? 'Hide balance' : 'Show balance'}
                >
                    <EyeIcon visible={showBalance} />
                </div>
                <ChevronIcon up={open} />
            </button>

            {/* ── Dropdown panel ── */}
            {open &&
                createPortal(
                    <div
                        className='bm-ap__panel'
                        style={{ top: dropPos.top, right: dropPos.right }}
                        onMouseDown={e => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className='bm-ap__header'>
                            <div className='bm-ap__header-account'>
                                <span className='bm-ap__header-id'>{activeAccount?.account_id ?? '—'}</span>
                                <div className='bm-ap__header-balance-row'>
                                    <span className='bm-ap__header-balance'>{activeBalanceDisplay}</span>
                                    <button
                                        className='bm-ap__balance-toggle'
                                        onClick={() => setShowBalance(v => !v)}
                                        aria-label={showBalance ? 'Hide balance' : 'Show balance'}
                                    >
                                        <EyeIcon visible={showBalance} />
                                    </button>
                                </div>
                            </div>
                            {kesRate && (
                                <div className='bm-ap__currency-row'>
                                    <span className='bm-ap__rate-hint'>1 USD ≈ KES {fmt.format(kesRate)}</span>
                                    <button className='bm-ap__currency-toggle' onClick={() => setDisplayKes(v => !v)}>
                                        <span
                                            className={classNames('bm-ap__currency-opt', {
                                                'bm-ap__currency-opt--active': displayKes,
                                            })}
                                        >
                                            KES
                                        </span>
                                        <span className='bm-ap__currency-sep'>|</span>
                                        <span
                                            className={classNames('bm-ap__currency-opt', {
                                                'bm-ap__currency-opt--active': !displayKes,
                                            })}
                                        >
                                            USD
                                        </span>
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Tab bar */}
                        <div className='bm-ap__tabs'>
                            <button
                                className={classNames('bm-ap__tab', { 'bm-ap__tab--active': tab === 'real' })}
                                onClick={() => setTab('real')}
                            >
                                Live
                                {liveAccounts.length > 0 && (
                                    <span className='bm-ap__tab-count'>{liveAccounts.length}</span>
                                )}
                            </button>
                            <button
                                className={classNames('bm-ap__tab', {
                                    'bm-ap__tab--active': tab === 'demo',
                                    'bm-ap__tab--demo': tab === 'demo',
                                })}
                                onClick={() => setTab('demo')}
                            >
                                Demo
                                {demoAccounts.length > 0 && (
                                    <span className='bm-ap__tab-count bm-ap__tab-count--demo'>
                                        {demoAccounts.length}
                                    </span>
                                )}
                            </button>
                        </div>

                        {/* Account list */}
                        <div className='bm-ap__list'>
                            {tabAccounts.length === 0 ? (
                                <p className='bm-ap__empty'>No {tab} accounts</p>
                            ) : (
                                tabAccounts.map(a => (
                                    <AccountRow
                                        key={a.account_id}
                                        account={a}
                                        isActive={a.account_id === activeAccountId}
                                        showBalance={showBalance}
                                        kesRate={kesRate}
                                        displayKes={displayKes}
                                        onSwitch={handleSwitch}
                                    />
                                ))
                            )}
                            <button
                                className={classNames('bm-ap__create', { 'bm-ap__create--demo': tab === 'demo' })}
                                onClick={() => handleCreateAccount(tab)}
                                disabled={creating !== null}
                            >
                                {creating === tab ? '…' : '+'}
                                <span>
                                    {creating === tab ? 'Creating…' : `New ${tab === 'real' ? 'Live' : 'Demo'} account`}
                                </span>
                            </button>
                            {createError && <p className='bm-ap__create-error'>{createError}</p>}
                        </div>

                        {/* Footer */}
                        <div className='bm-ap__footer'>
                            <button className='bm-ap__logout' onClick={handleLogout}>
                                <LogoutIcon />
                                <span>Log Out</span>
                            </button>
                        </div>
                    </div>,
                    document.body
                )}
        </>
    );
};

export default BmAccountPanel;
