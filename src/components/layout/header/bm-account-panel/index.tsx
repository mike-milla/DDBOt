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
        width='15'
        height='15'
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
        width='13'
        height='13'
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
        <span className={classNames('bm-ap__account-badge', { 'bm-ap__account-badge--demo': account.is_virtual })}>
            {account.is_virtual ? 'DEMO' : account.currency}
        </span>
        <span className='bm-ap__account-id'>{account.account_id}</span>
        <span className='bm-ap__account-balance'>
            {account.balance != null ? `${account.currency} ${account.balance.toFixed(2)}` : '—'}
        </span>
        {isActive && (
            <span className='bm-ap__account-check'>
                <CheckIcon />
            </span>
        )}
    </button>
);

// ── Main panel ────────────────────────────────────────────────────────────────

const BmAccountPanel = () => {
    const { liveAccounts, demoAccounts, activeAccount, activeAccountId, switchAccount, logout } = useDerivAuth();

    const [open, setOpen] = useState(false);
    const [dropPos, setDropPos] = useState({ top: 0, right: 0 });
    const triggerRef = useRef<HTMLButtonElement>(null);

    const isActiveDemo = !!activeAccount?.is_virtual;

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

    return (
        <>
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
                <span className={classNames('bm-ap__trigger-type', { 'bm-ap__trigger-type--demo': isActiveDemo })}>
                    {isActiveDemo ? 'Demo' : 'Live'}
                </span>
                <div className='bm-ap__trigger-info'>
                    <span className='bm-ap__trigger-currency'>{activeAccount?.currency ?? '—'}</span>
                    <span className='bm-ap__trigger-balance'>
                        {activeAccount?.balance != null ? activeAccount.balance.toFixed(2) : '—'}
                    </span>
                </div>
                <ChevronIcon up={open} />
            </button>

            {open &&
                createPortal(
                    <div
                        className='bm-ap__panel'
                        style={{ top: dropPos.top, right: dropPos.right }}
                        onMouseDown={e => e.stopPropagation()}
                    >
                        {liveAccounts.length > 0 && (
                            <div className='bm-ap__section'>
                                <p className='bm-ap__section-label bm-ap__section-label--live'>Live Accounts</p>
                                {liveAccounts.map(a => (
                                    <AccountRow
                                        key={a.account_id}
                                        account={a}
                                        isActive={a.account_id === activeAccountId}
                                        onSwitch={handleSwitch}
                                    />
                                ))}
                            </div>
                        )}

                        {demoAccounts.length > 0 && (
                            <div className='bm-ap__section'>
                                <p className='bm-ap__section-label bm-ap__section-label--demo'>Demo Accounts</p>
                                {demoAccounts.map(a => (
                                    <AccountRow
                                        key={a.account_id}
                                        account={a}
                                        isActive={a.account_id === activeAccountId}
                                        onSwitch={handleSwitch}
                                    />
                                ))}
                            </div>
                        )}

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
