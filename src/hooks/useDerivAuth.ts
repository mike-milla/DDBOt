import { useCallback, useEffect, useState } from 'react';
import {
    clearAuthState,
    createAccount as apiCreateAccount,
    type DerivAccount,
    type DerivAuthState,
    fetchAccountOtp,
    fetchAccounts,
    loadAuthState,
    saveAuthState,
    setActiveAccount,
} from '@/services/deriv-auth';

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

    const refreshAccounts = useCallback(async () => {
        if (!auth) return;
        const accounts = await fetchAccounts(auth.access_token);
        const updated: DerivAuthState = { ...auth, accounts };
        saveAuthState(updated);
    }, [auth]);

    const createAccount = useCallback(
        async (account_type: 'demo' | 'real') => {
            if (!auth) throw new Error('Not authenticated');
            const newAccount = await apiCreateAccount(auth.access_token, account_type);
            const accounts = [...auth.accounts.filter(a => a.account_id !== newAccount.account_id), newAccount];
            const updated: DerivAuthState = { ...auth, accounts, active_account_id: newAccount.account_id };
            saveAuthState(updated);
            return newAccount;
        },
        [auth]
    );

    const getWsConnection = useCallback(
        async (accountId?: string) => {
            if (!auth) throw new Error('Not authenticated');
            const id = accountId ?? auth.active_account_id;
            const account = auth.accounts.find(a => a.account_id === id);
            if (!account) throw new Error(`Account ${id} not found`);

            const wsUrl = await fetchAccountOtp(auth.access_token, id);
            return new WebSocket(wsUrl);
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
        createAccount,
        refreshAccounts,
        getWsConnection,
        saveAuthState,
    };
};
