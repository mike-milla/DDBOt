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

                setPhase('fetching');
                const accounts = await fetchAccounts(access_token);

                const first = accounts[0];
                if (!first) throw new Error('No accounts returned from API.');

                saveAuthState({
                    access_token,
                    accounts,
                    active_account_id: first.account_id,
                });

                setPhase('done');
                window.location.replace(`${window.location.origin}/bot`);
            } catch (err) {
                setErrorMsg(err instanceof Error ? err.message : String(err));
                setPhase('error');
            }
        })();
    }, []);

    if (phase === 'error') {
        return (
            <div className='callback-page'>
                <div className='callback-page__card callback-page__card--error'>
                    <span className='callback-page__icon'>✕</span>
                    <h2>Authentication failed</h2>
                    <p>{errorMsg}</p>
                    <button onClick={() => (window.location.href = '/')}>Back to app</button>
                </div>
            </div>
        );
    }

    return (
        <div className='callback-page'>
            <div className='callback-page__card'>
                <div className='callback-page__spinner' />
                <p>{phase === 'exchanging' ? 'Completing sign-in…' : 'Loading your accounts…'}</p>
            </div>
        </div>
    );
};

export default CallbackPage;
