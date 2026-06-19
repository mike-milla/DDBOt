import { useState } from 'react';
import { observer } from 'mobx-react-lite';
import './copy-trader.scss';

interface LinkedAccount {
    id: string;
    token: string;
    loginid: string;
    status: 'active' | 'error';
}

const CopyTrader = observer(() => {
    const [demoRunning, setDemoRunning] = useState(false);
    const [copyRunning, setCopyRunning] = useState(false);
    const [accounts, setAccounts] = useState<LinkedAccount[]>([]);
    const [tokenInput, setTokenInput] = useState('');
    const [syncing, setSyncing] = useState(false);
    const [replicated, setReplicated] = useState(0);
    const [settingsOpen, setSettingsOpen] = useState(false);

    const addAccount = () => {
        const t = tokenInput.trim();
        if (!t) return;
        setAccounts(prev => [
            ...prev,
            {
                id: String(Date.now()),
                token: t,
                loginid: `CR${Math.floor(Math.random() * 900000 + 100000)}`,
                status: 'active',
            },
        ]);
        setTokenInput('');
    };

    const removeAccount = (id: string) => setAccounts(prev => prev.filter(a => a.id !== id));

    const sync = async () => {
        setSyncing(true);
        await new Promise(r => setTimeout(r, 1200));
        setSyncing(false);
    };

    const startCopy = () => {
        setCopyRunning(r => {
            if (!r) setReplicated(0);
            return !r;
        });
    };

    const statusLabel = demoRunning || copyRunning ? 'Running' : 'Idle';

    return (
        <div className='ct'>
            {/* ── Hero ── */}
            <div className='ct__hero'>
                <div className='ct__hero-glow ct__hero-glow--1' />
                <div className='ct__hero-glow ct__hero-glow--2' />

                <div className='ct__hero-badge'>BossMillan Prime</div>
                <h1 className='ct__hero-title'>Copy Trading</h1>
                <p className='ct__hero-sub'>
                    Mirror trades from your master account to follower accounts in real time — simple, automatic, and
                    instant.
                </p>

                <div className='ct__stats'>
                    <div className='ct__stat'>
                        <span className='ct__stat-val'>{accounts.length}</span>
                        <span className='ct__stat-lbl'>Linked</span>
                    </div>
                    <div className='ct__stat ct__stat--center'>
                        <span className={`ct__stat-dot${copyRunning || demoRunning ? ' ct__stat-dot--live' : ''}`} />
                        <span className='ct__stat-val'>{statusLabel}</span>
                        <span className='ct__stat-lbl'>Status</span>
                    </div>
                    <div className='ct__stat'>
                        <span className='ct__stat-val'>{replicated}</span>
                        <span className='ct__stat-lbl'>Replicated</span>
                    </div>
                </div>
            </div>

            {/* ── Two panels ── */}
            <div className='ct__panels'>
                {/* Left: Demo → Real */}
                <div className='ct__panel'>
                    <h2 className='ct__panel-title'>
                        Demo
                        <svg
                            width='16'
                            height='16'
                            viewBox='0 0 24 24'
                            fill='none'
                            stroke='currentColor'
                            strokeWidth='2.5'
                            strokeLinecap='round'
                            strokeLinejoin='round'
                        >
                            <path d='M5 12h14M12 5l7 7-7 7' />
                        </svg>
                        Real
                    </h2>
                    <p className='ct__panel-desc'>
                        Mirror demo trades to your real account. Start this before running bots on demo.
                    </p>
                    <button
                        className={`ct__action-btn${demoRunning ? ' ct__action-btn--stop' : ''}`}
                        onClick={() => setDemoRunning(r => !r)}
                    >
                        {demoRunning ? 'Stop Demo → Real' : 'Start Demo → Real'}
                    </button>
                </div>

                {/* Right: Followers */}
                <div className='ct__panel'>
                    <div className='ct__panel-head'>
                        <h2 className='ct__panel-title'>Followers</h2>
                        <button className='ct__settings-btn' onClick={() => setSettingsOpen(o => !o)}>
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
                            Settings
                        </button>
                    </div>
                    <p className='ct__panel-desc'>
                        Add OAuth accounts from your session or paste legacy API tokens. Master trades are mirrored to
                        every follower.
                    </p>

                    <div className='ct__input-row'>
                        <input
                            className='ct__token-input'
                            type='text'
                            placeholder='Legacy API token…'
                            value={tokenInput}
                            onChange={e => setTokenInput(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && addAccount()}
                        />
                        <button className='ct__add-btn' onClick={addAccount} disabled={!tokenInput.trim()}>
                            Add
                        </button>
                        <button
                            className={`ct__sync-btn${syncing ? ' ct__sync-btn--spin' : ''}`}
                            onClick={sync}
                            disabled={syncing}
                        >
                            <svg
                                width='13'
                                height='13'
                                viewBox='0 0 24 24'
                                fill='none'
                                stroke='currentColor'
                                strokeWidth='2.2'
                                strokeLinecap='round'
                                strokeLinejoin='round'
                            >
                                <polyline points='23 4 23 10 17 10' />
                                <polyline points='1 20 1 14 7 14' />
                                <path d='M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15' />
                            </svg>
                            Sync
                        </button>
                    </div>

                    <button
                        className={`ct__action-btn${copyRunning ? ' ct__action-btn--stop' : ''}`}
                        onClick={startCopy}
                    >
                        {copyRunning ? 'Stop Copy Trading' : 'Start Copy Trading'}
                    </button>
                </div>
            </div>

            {/* ── Linked accounts ── */}
            <div className='ct__linked'>
                <h3 className='ct__linked-title'>Linked accounts</h3>

                {accounts.length === 0 ? (
                    <div className='ct__empty'>
                        <svg
                            width='36'
                            height='36'
                            viewBox='0 0 24 24'
                            fill='none'
                            stroke='currentColor'
                            strokeWidth='1.3'
                            strokeLinecap='round'
                            strokeLinejoin='round'
                        >
                            <path d='M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2' />
                            <circle cx='9' cy='7' r='4' />
                            <path d='M23 21v-2a4 4 0 0 0-3-3.87' />
                            <path d='M16 3.13a4 4 0 0 1 0 7.75' />
                        </svg>
                        <p>No accounts linked yet.</p>
                        <span>Add a legacy API token to get started.</span>
                    </div>
                ) : (
                    <ul className='ct__account-list'>
                        {accounts.map(a => (
                            <li key={a.id} className='ct__account-item'>
                                <span className={`ct__account-dot ct__account-dot--${a.status}`} />
                                <span className='ct__account-id'>{a.loginid}</span>
                                <span className='ct__account-token'>{a.token.slice(0, 8)}••••</span>
                                <span className={`ct__account-badge ct__account-badge--${a.status}`}>
                                    {a.status === 'active' ? 'Active' : 'Error'}
                                </span>
                                <button
                                    className='ct__account-remove'
                                    onClick={() => removeAccount(a.id)}
                                    aria-label='Remove'
                                >
                                    <svg
                                        width='12'
                                        height='12'
                                        viewBox='0 0 24 24'
                                        fill='none'
                                        stroke='currentColor'
                                        strokeWidth='2.5'
                                        strokeLinecap='round'
                                    >
                                        <path d='M18 6L6 18M6 6l12 12' />
                                    </svg>
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            <div className='ct__footer'>
                <svg width='13' height='13' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2'>
                    <circle cx='12' cy='12' r='10' />
                    <line x1='12' y1='8' x2='12' y2='12' />
                    <line x1='12' y1='16' x2='12.01' y2='16' />
                </svg>
                <p>
                    Copy trading mirrors trades in real time. Always verify token permissions before linking accounts.
                </p>
            </div>
        </div>
    );
});

export default CopyTrader;
