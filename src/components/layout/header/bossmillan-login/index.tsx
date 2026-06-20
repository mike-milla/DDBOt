import { useRef, useState } from 'react';
import './bossmillan-login.scss';

// ── Icons ─────────────────────────────────────────────────────────────────────

const LockIcon = () => (
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
        <rect x='3' y='11' width='18' height='11' rx='2' ry='2' />
        <path d='M7 11V7a5 5 0 0 1 10 0v4' />
    </svg>
);

const UserIcon = () => (
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
        <path d='M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2' />
        <circle cx='12' cy='7' r='4' />
    </svg>
);

const EyeIcon = ({ show }: { show: boolean }) =>
    show ? (
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
            <path d='M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z' />
            <circle cx='12' cy='12' r='3' />
        </svg>
    ) : (
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
            <path d='M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24' />
            <line x1='1' y1='1' x2='23' y2='23' />
        </svg>
    );

const StarIcon = () => (
    <svg width='14' height='14' viewBox='0 0 24 24' fill='currentColor'>
        <polygon points='12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2' />
    </svg>
);

// ── Dialog ────────────────────────────────────────────────────────────────────

export type BossMillanLoginDialogProps = {
    onClose: () => void;
};

export const BossMillanLoginDialog = ({ onClose }: BossMillanLoginDialogProps) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPass, setShowPass] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const backdropRef = useRef<HTMLDivElement>(null);

    const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === backdropRef.current) onClose();
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!username || !password) {
            setError('Please fill in all fields.');
            return;
        }
        setError('');
        setLoading(true);
        // Placeholder — wire up real auth here
        await new Promise(r => setTimeout(r, 1200));
        setLoading(false);
        setError('Invalid credentials. Please try again.');
    };

    return (
        <div className='bm-login-backdrop' ref={backdropRef} onClick={handleBackdropClick}>
            <div className='bm-login-dialog' role='dialog' aria-modal='true' aria-label='Login to BossMillan'>
                <button className='bm-login-dialog__close' onClick={onClose} aria-label='Close'>
                    <svg
                        width='18'
                        height='18'
                        viewBox='0 0 24 24'
                        fill='none'
                        stroke='currentColor'
                        strokeWidth='2.5'
                        strokeLinecap='round'
                    >
                        <line x1='18' y1='6' x2='6' y2='18' />
                        <line x1='6' y1='6' x2='18' y2='18' />
                    </svg>
                </button>

                <div className='bm-login-dialog__hero'>
                    <img src='/assets/images/bossmillan-logo.jpeg' alt='BossMillan' className='bm-login-dialog__logo' />
                    <p className='bm-login-dialog__tagline'>Premium Trading Intelligence</p>
                </div>

                <div className='bm-login-dialog__features'>
                    {['AI Entry Scanner', 'Recovery Engine', 'Smart Signals', 'Premium Bots'].map(f => (
                        <span key={f} className='bm-login-dialog__feature-chip'>
                            <StarIcon />
                            {f}
                        </span>
                    ))}
                </div>

                <p className='bm-login-dialog__desc'>
                    Login to unlock exclusive BossMillan tools — real-time digit scanners, AI-powered entry signals, and
                    recovery bots built for serious traders.
                </p>

                <form className='bm-login-dialog__form' onSubmit={handleLogin} noValidate>
                    <div className='bm-login-dialog__field'>
                        <span className='bm-login-dialog__field-icon'>
                            <UserIcon />
                        </span>
                        <input
                            className='bm-login-dialog__input'
                            type='text'
                            placeholder='Username or email'
                            value={username}
                            onChange={e => setUsername(e.target.value)}
                            autoComplete='username'
                        />
                    </div>

                    <div className='bm-login-dialog__field'>
                        <span className='bm-login-dialog__field-icon'>
                            <LockIcon />
                        </span>
                        <input
                            className='bm-login-dialog__input'
                            type={showPass ? 'text' : 'password'}
                            placeholder='Password'
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            autoComplete='current-password'
                        />
                        <button
                            type='button'
                            className='bm-login-dialog__eye'
                            onClick={() => setShowPass(v => !v)}
                            aria-label={showPass ? 'Hide password' : 'Show password'}
                        >
                            <EyeIcon show={showPass} />
                        </button>
                    </div>

                    {error && <p className='bm-login-dialog__error'>{error}</p>}

                    <a className='bm-login-dialog__forgot' href='#forgot'>
                        Forgot password?
                    </a>

                    <button
                        className={`bm-login-dialog__submit${loading ? ' bm-login-dialog__submit--loading' : ''}`}
                        type='submit'
                        disabled={loading}
                    >
                        {loading ? (
                            <>
                                <span className='bm-login-dialog__spinner' /> Signing in…
                            </>
                        ) : (
                            'Login to BossMillan'
                        )}
                    </button>
                </form>

                <p className='bm-login-dialog__footer'>
                    Don&apos;t have an account?{' '}
                    <a className='bm-login-dialog__footer-link' href='#register'>
                        Request access
                    </a>
                </p>
            </div>
        </div>
    );
};

// ── Trigger button (header usage) ─────────────────────────────────────────────

const BossMillanLoginButton = () => {
    const [open, setOpen] = useState(false);

    return (
        <>
            <button className='bm-login-trigger' onClick={() => setOpen(true)} title='Login to BossMillan'>
                <span className='bm-login-trigger__crown'>♔</span>
                <span className='bm-login-trigger__badge'>PRO</span>
            </button>
            {open && <BossMillanLoginDialog onClose={() => setOpen(false)} />}
        </>
    );
};

export default BossMillanLoginButton;
