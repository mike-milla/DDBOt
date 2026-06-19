import { useRef, useState } from 'react';
import { api_base } from '@/external/bot-skeleton';
import { generateDerivApiInstance } from '@/external/bot-skeleton/services/api/appId';
import {
    setAccountList,
    setAuthData,
    setIsAuthorized,
} from '@/external/bot-skeleton/services/api/observables/connection-status-stream';
import { useOnClickOutside } from '@/hooks/useOnClickOutside';
import './connect-deriv.scss';

type Props = {
    onLogin: () => void;
    onSignup: () => void;
};

// ── Icons ─────────────────────────────────────────────────────────────────────

const ChevronIcon = () => (
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
        <path d='M6 9l6 6 6-6' />
    </svg>
);

const ExistingIcon = () => (
    <svg
        width='18'
        height='18'
        viewBox='0 0 24 24'
        fill='none'
        stroke='currentColor'
        strokeWidth='2'
        strokeLinecap='round'
        strokeLinejoin='round'
    >
        <path d='M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4' />
        <polyline points='10 17 15 12 10 7' />
        <line x1='15' y1='12' x2='3' y2='12' />
    </svg>
);

const NewIcon = () => (
    <svg
        width='18'
        height='18'
        viewBox='0 0 24 24'
        fill='none'
        stroke='currentColor'
        strokeWidth='2'
        strokeLinecap='round'
        strokeLinejoin='round'
    >
        <path d='M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2' />
        <circle cx='9' cy='7' r='4' />
        <line x1='19' y1='8' x2='19' y2='14' />
        <line x1='22' y1='11' x2='16' y2='11' />
    </svg>
);

const TokenIcon = () => (
    <svg
        width='18'
        height='18'
        viewBox='0 0 24 24'
        fill='none'
        stroke='currentColor'
        strokeWidth='2'
        strokeLinecap='round'
        strokeLinejoin='round'
    >
        <rect x='3' y='11' width='18' height='11' rx='2' ry='2' />
        <path d='M7 11V7a5 5 0 0 1 10 0v4' />
        <circle cx='12' cy='16' r='1' fill='currentColor' stroke='none' />
    </svg>
);

const BackIcon = () => (
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
        <path d='M19 12H5M12 5l-7 7 7 7' />
    </svg>
);

const EyeIcon = ({ show }: { show: boolean }) =>
    show ? (
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
            <path d='M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z' />
            <circle cx='12' cy='12' r='3' />
        </svg>
    ) : (
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
            <path d='M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24' />
            <line x1='1' y1='1' x2='23' y2='23' />
        </svg>
    );

// ── Token form (shown inside dropdown when user picks "Continue with token") ──

const TokenForm = ({ onBack, onSuccess }: { onBack: () => void; onSuccess: () => void }) => {
    const [token, setToken] = useState('');
    const [show, setShow] = useState(false);
    const [loading, setLoading] = useState(false);
    const [loadingMsg, setLoadingMsg] = useState('Connecting…');
    const [error, setError] = useState('');

    const handleConnect = async (e: React.FormEvent) => {
        e.preventDefault();
        const trimmed = token.trim();
        if (!trimmed) {
            setError('Please enter an API token.');
            return;
        }
        setError('');
        setLoading(true);
        // eslint-disable-next-line no-console
        console.log('[TokenAuth] ── START ──────────────────────────────');
        try {
            // ── Step 2: validate via a TEMPORARY isolated API instance ───────
            // Do NOT call api_base.api.authorize() — CoreStoreProvider's onMessage
            // subscription sees every response on the main socket and calls oAuthLogout()
            // on InvalidToken, reloading the page before we can show any error.
            // Do NOT call setIsAuthorizing(true) — it makes the header swap the dropdown
            // for a loader, unmounting this form before the user sees any feedback.
            setLoadingMsg('Authorizing…');
            // eslint-disable-next-line no-console
            console.log('[TokenAuth] Step 2 — opening temp socket for validation …');
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            let authorize: any;
            const tempApi = generateDerivApiInstance();
            try {
                const result = await tempApi.authorize(trimmed);
                authorize = result?.authorize;
                // eslint-disable-next-line no-console
                console.log('[TokenAuth] Step 2 — authorized:', authorize?.loginid);
            } catch (authErr: unknown) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const apiErr = (authErr as any)?.error;
                // eslint-disable-next-line no-console
                console.error('[TokenAuth] Step 2 FAILED — token rejected:', apiErr);
                setError(
                    apiErr?.code === 'InvalidToken'
                        ? 'Invalid or expired token. Please check and try again.'
                        : (apiErr?.message ?? 'Authorization failed. Please try again.')
                );
                return;
            } finally {
                tempApi.disconnect();
            }

            // ── Step 3: persist + wire auth state ───────────────────────────
            setLoadingMsg('Setting up…');
            // eslint-disable-next-line no-console
            console.log('[TokenAuth] Step 3 — saving loginid:', authorize?.loginid);
            localStorage.setItem('authToken', trimmed);
            localStorage.setItem('active_loginid', authorize?.loginid ?? '');
            localStorage.setItem('client_account_details', JSON.stringify(authorize?.account_list ?? []));
            localStorage.setItem('client.country', authorize?.country ?? '');

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (api_base as any).account_info = authorize;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (api_base as any).is_authorized = true;
            setAccountList(authorize?.account_list ?? []);
            setAuthData(authorize);
            setIsAuthorized(true);
            // eslint-disable-next-line no-console
            console.log(
                '[TokenAuth] Step 3 — auth state wired, account_list:',
                authorize?.account_list?.length ?? 0,
                'accounts'
            );

            // ── Step 4: subscribe to streams ────────────────────────────────
            // eslint-disable-next-line no-console
            console.log('[TokenAuth] Step 4 — starting balance/transaction subscriptions …');
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            await (api_base as any).subscribe();
            // eslint-disable-next-line no-console
            console.log('[TokenAuth] Step 4 — subscriptions started');

            // eslint-disable-next-line no-console
            console.log('[TokenAuth] ── SUCCESS — closing dropdown ──────────');
            onSuccess();
        } catch (err) {
            localStorage.removeItem('authToken');
            // eslint-disable-next-line no-console
            console.error('[TokenAuth] ── CAUGHT EXCEPTION ──', err);
            setError('Connection failed. Please try again.');
        } finally {
            setLoading(false);
            setLoadingMsg('Connecting…');
        }
    };

    return (
        <form className='connect-deriv__token-form' onSubmit={handleConnect} noValidate>
            <button type='button' className='connect-deriv__token-back' onClick={onBack}>
                <BackIcon />
                Back
            </button>

            <div className='connect-deriv__token-header'>
                <span className='connect-deriv__token-icon-wrap'>
                    <TokenIcon />
                </span>
                <span className='connect-deriv__token-title'>Continue with token</span>
            </div>

            <p className='connect-deriv__token-desc'>
                Enter your Deriv API token to login. You can create an API token from your{' '}
                <a
                    href='https://app.deriv.com/account/api-token'
                    target='_blank'
                    rel='noreferrer'
                    className='connect-deriv__token-link'
                >
                    Deriv account settings
                </a>
                .
            </p>

            <div className={`connect-deriv__token-field${error ? ' connect-deriv__token-field--error' : ''}`}>
                <input
                    className='connect-deriv__token-input'
                    type={show ? 'text' : 'password'}
                    placeholder='Paste your API token here'
                    value={token}
                    onChange={e => {
                        setToken(e.target.value);
                        setError('');
                    }}
                    autoComplete='off'
                    autoFocus
                />
                <button
                    type='button'
                    className='connect-deriv__token-eye'
                    onClick={() => setShow(v => !v)}
                    aria-label={show ? 'Hide token' : 'Show token'}
                >
                    <EyeIcon show={show} />
                </button>
            </div>

            {error && <p className='connect-deriv__token-error'>{error}</p>}

            <button
                className={`connect-deriv__token-submit${loading ? ' connect-deriv__token-submit--loading' : ''}`}
                type='submit'
                disabled={loading}
            >
                {loading ? (
                    <>
                        <span className='connect-deriv__token-spinner' /> {loadingMsg}
                    </>
                ) : (
                    'Connect'
                )}
            </button>
        </form>
    );
};

// ── Main dropdown ─────────────────────────────────────────────────────────────

const ConnectDerivDropdown = ({ onLogin, onSignup }: Props) => {
    const [open, setOpen] = useState(false);
    const [tokenMode, setTokenMode] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useOnClickOutside(
        ref,
        () => {
            setOpen(false);
            setTokenMode(false);
        },
        () => open
    );

    const closeAll = () => {
        setOpen(false);
        setTokenMode(false);
    };

    return (
        <div className='connect-deriv' ref={ref}>
            <button
                className={`connect-deriv__btn${open ? ' connect-deriv__btn--open' : ''}`}
                onClick={() => {
                    setOpen(v => !v);
                    if (open) setTokenMode(false);
                }}
                aria-haspopup='true'
                aria-expanded={open}
            >
                <span className='connect-deriv__btn-dot' />
                Connect your Deriv
                <span className={`connect-deriv__chevron${open ? ' connect-deriv__chevron--up' : ''}`}>
                    <ChevronIcon />
                </span>
            </button>

            {open && (
                <div className={`connect-deriv__dropdown${tokenMode ? ' connect-deriv__dropdown--token' : ''}`}>
                    {tokenMode ? (
                        <TokenForm onBack={() => setTokenMode(false)} onSuccess={closeAll} />
                    ) : (
                        <>
                            <button
                                className='connect-deriv__option'
                                onClick={() => {
                                    closeAll();
                                    onLogin();
                                }}
                            >
                                <span className='connect-deriv__option-icon connect-deriv__option-icon--login'>
                                    <ExistingIcon />
                                </span>
                                <span className='connect-deriv__option-text'>
                                    <span className='connect-deriv__option-title'>Existing account</span>
                                    <span className='connect-deriv__option-sub'>Log in to your Deriv account</span>
                                </span>
                            </button>

                            <button
                                className='connect-deriv__option'
                                onClick={() => {
                                    closeAll();
                                    onSignup();
                                }}
                            >
                                <span className='connect-deriv__option-icon connect-deriv__option-icon--signup'>
                                    <NewIcon />
                                </span>
                                <span className='connect-deriv__option-text'>
                                    <span className='connect-deriv__option-title'>New account</span>
                                    <span className='connect-deriv__option-sub'>Create a free Deriv account</span>
                                </span>
                            </button>

                            <div className='connect-deriv__divider' />

                            <button className='connect-deriv__option' onClick={() => setTokenMode(true)}>
                                <span className='connect-deriv__option-icon connect-deriv__option-icon--token'>
                                    <TokenIcon />
                                </span>
                                <span className='connect-deriv__option-text'>
                                    <span className='connect-deriv__option-title'>Continue with token</span>
                                    <span className='connect-deriv__option-sub'>Use a Deriv API token</span>
                                </span>
                            </button>
                        </>
                    )}
                </div>
            )}
        </div>
    );
};

export default ConnectDerivDropdown;
