import { useEffect, useRef, useState } from 'react';
import { exchangeCode, fetchAccounts, saveAuthState } from '@/services/deriv-auth';
import './callback-page.scss';

type Phase = 'exchanging' | 'fetching' | 'done' | 'error';

const CallbackPage = () => {
    const [phase, setPhase] = useState<Phase>('exchanging');
    const [errorMsg, setErrorMsg] = useState('');
    const ran = useRef(false);

    useEffect(() => {
        if (ran.current) return;
        ran.current = true;

        const params = new URLSearchParams(window.location.search);
        const code = params.get('code');
        const state = params.get('state');
        const error = params.get('error');
        const error_description = params.get('error_description');

        if (error) {
            setErrorMsg(error_description ?? error);
            setPhase('error');
            return;
        }

        if (!code || !state) {
            setErrorMsg('Missing authorization code or state.');
            setPhase('error');
            return;
        }

        (async () => {
            try {
                const access_token = await exchangeCode(code, state);
                console.log('[callback] access_token:', access_token?.slice(0, 20) + '…');

                setPhase('fetching');
                const accounts = await fetchAccounts(access_token);
                console.log('[callback] accounts:', accounts);

                const first = accounts[0];
                if (!first) throw new Error('No accounts returned from API.');

                saveAuthState({
                    access_token,
                    accounts,
                    active_account_id: first.account_id,
                });

                setPhase('done');
                window.location.replace(`${window.location.origin}/app`);
            } catch (err) {
                setErrorMsg(err instanceof Error ? err.message : String(err));
                setPhase('error');
            }
        })();
    }, []);

    return (
        <div className='cb'>
            {/* Background */}
            <div className='cb__bg'>
                <div className='cb__bg-grid' />
                <div className='cb__bg-glow cb__bg-glow--teal' />
                <div className='cb__bg-glow cb__bg-glow--purple' />
            </div>

            {/* Card */}
            <div className={`cb__card ${phase === 'error' ? 'cb__card--error' : ''}`}>
                {/* Brand */}
                <div className='cb__brand'>
                    <img src='/assets/images/bossmillan-logo.jpeg' alt='BossMillan' className='cb__brand-img' />
                    <span className='cb__brand-name'>
                        <span className='cb__brand-boss'>Boss</span>
                        <span className='cb__brand-millan'>Millan</span>
                    </span>
                </div>

                {phase === 'error' ? (
                    <>
                        <div className='cb__error-icon'>
                            <svg
                                width='28'
                                height='28'
                                viewBox='0 0 24 24'
                                fill='none'
                                stroke='currentColor'
                                strokeWidth='2.5'
                                strokeLinecap='round'
                            >
                                <line x1='18' y1='6' x2='6' y2='18' />
                                <line x1='6' y1='6' x2='18' y2='18' />
                            </svg>
                        </div>
                        <h2 className='cb__error-title'>Authentication Failed</h2>
                        <p className='cb__error-msg'>{errorMsg}</p>
                        <button className='cb__back-btn' onClick={() => (window.location.href = '/')}>
                            Back to Home
                        </button>
                    </>
                ) : (
                    <>
                        <div className='cb__spinner-wrap'>
                            <div className='cb__spinner-ring' />
                            <div className='cb__spinner-dot' />
                        </div>
                        <p className='cb__status'>
                            {phase === 'exchanging' ? 'Authenticating…' : 'Loading your accounts…'}
                        </p>
                        <p className='cb__sub'>Connecting securely to Deriv</p>
                    </>
                )}
            </div>
        </div>
    );
};

export default CallbackPage;
