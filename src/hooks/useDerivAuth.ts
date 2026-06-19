import { useCallback, useEffect, useState } from 'react';
import {
    clearAuthState,
    type DerivAccount,
    type DerivAuthState,
    fetchAccountOtp,
    loadAuthState,
    saveAuthState,
    setActiveAccount,
} from '@/services/deriv-auth';

const WS_BASE = 'wss://api.derivws.com';

export type { DerivAccount };

const read = () => loadAuthState();

export const useDerivAuth = () => {
    const [auth, setAuth] = useState<DerivAuthState | null>(read);

    useEffect(() => {
        const sync = () => setAuth(read());
        window.addEventListener('deriv_auth_changed', sync);
        window.addEventListener('storage', sync);
        return () => {
            window.removeEventListener('deriv_auth_changed', sync);
            window.removeEventListener('storage', sync);
        };
    }, []);

    const switchAccount = useCallback(
        (accountId: string) => {
            if (!auth || accountId === auth.active_account_id) return;
            setActiveAccount(accountId);
        },
        [auth]
    );

    const logout = useCallback(() => {
        clearAuthState();
    }, []);

    const getWsConnection = useCallback(
        async (accountId?: string) => {
            if (!auth) throw new Error('Not authenticated');
            const id = accountId ?? auth.active_account_id;
            const account = auth.accounts.find(a => a.account_id === id);
            if (!account) throw new Error(`Account ${id} not found`);

            const otp = await fetchAccountOtp(auth.access_token, id);
            return new WebSocket(`${WS_BASE}/trading/v1/options/ws/${account.account_type}?otp=${otp}`);
        },
        [auth]
    );

    const isLoggedIn = !!auth?.access_token;
    const accounts = auth?.accounts ?? [];
    const activeAccount = accounts.find(a => a.account_id === auth?.active_account_id) ?? null;
    const liveAccounts = accounts.filter(a => a.account_type === 'real');
    const demoAccounts = accounts.filter(a => a.account_type === 'demo');

    return {
        isLoggedIn,
        accessToken: auth?.access_token ?? null,
        accounts,
        liveAccounts,
        demoAccounts,
        activeAccount,
        activeAccountId: auth?.active_account_id ?? null,
        switchAccount,
        logout,
        getWsConnection,
        saveAuthState,
    };
};
