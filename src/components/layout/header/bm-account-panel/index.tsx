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

// ── Account row ───────────────────────────────────────────────────────────────

type AccountRowProps = {
    account: DerivAccount;
    isActive: boolean;
    onSwitch: (id: string) => void;
};

const AccountRow = ({ account, isActive, onSwitch }: AccountRowProps) => (
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
                {account.currency} {account.balance.toFixed(2)}
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
    const { liveAccounts, demoAccounts, activeAccount, activeAccountId, switchAccount, logout } = useDerivAuth();

    const [open, setOpen] = useState(false);
    const [tab, setTab] = useState<TabId>('real');
    const [dropPos, setDropPos] = useState({ top: 0, right: 0 });
    const triggerRef = useRef<HTMLButtonElement>(null);

    const isActiveDemo = activeAccount?.account_type === 'demo';

    // Keep tab in sync with active account type
    useEffect(() => {
        if (activeAccount) setTab(activeAccount.account_type);
    }, [activeAccount]);

    const openPanel = () => {
        if (triggerRef.current) {
            const rect = triggerRef.current.getBoundingClientRect();
            setDropPos({ top: rect.bottom + 8, right: window.innerWidth - rect.right });
        }
        setOpen(v => !v);
    };

    useEffect(() => {
        if (!open) return;
        const close = (e: MouseEvent) => {
            if (!triggerRef.current?.contains(e.target as Node)) setOpen(false);
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

    const tabAccounts = tab === 'real' ? liveAccounts : demoAccounts;

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
                    <span className='bm-ap__trigger-currency'>{activeAccount?.currency ?? '—'}</span>
                    <span className='bm-ap__trigger-balance'>
                        {activeAccount != null ? activeAccount.balance.toFixed(2) : '—'}
                    </span>
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
                        {/* Header with active account summary */}
                        <div className='bm-ap__header'>
                            <div className='bm-ap__header-account'>
                                <span className='bm-ap__header-id'>{activeAccount?.account_id ?? '—'}</span>
                                <span className='bm-ap__header-balance'>
                                    {activeAccount
                                        ? `${activeAccount.currency} ${activeAccount.balance.toFixed(2)}`
                                        : '—'}
                                </span>
                            </div>
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
                                    'bm-ap__tab--active bm-ap__tab--demo': tab === 'demo',
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
                                        onSwitch={handleSwitch}
                                    />
                                ))
                            )}
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
