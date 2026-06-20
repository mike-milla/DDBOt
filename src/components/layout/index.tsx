import { useEffect, useMemo } from 'react';
import clsx from 'clsx';
import { observer } from 'mobx-react-lite';
import { Outlet } from 'react-router-dom';
import PWAUpdateNotification from '@/components/pwa-update-notification';
import { api_base } from '@/external/bot-skeleton';
import { useOfflineDetection } from '@/hooks/useOfflineDetection';
import { useStore } from '@/hooks/useStore';
import useTMB from '@/hooks/useTMB';
import { loadAuthState } from '@/services/deriv-auth';
import { useDevice } from '@deriv-com/ui';
import { crypto_currencies_display_order,fiat_currencies_display_order } from '../shared';
import Footer from './footer';
import AppHeader from './header';
import Body from './main-body';
import './layout.scss';

const Layout = observer(() => {
    const { isDesktop } = useDevice();
    const { isOnline } = useOfflineDetection();
    const store = useStore();
    const is_quick_strategy_active = store?.quick_strategy?.is_open;

    const isCallbackPage = window.location.pathname === '/callback';
    const { onRenderTMBCheck, is_tmb_enabled: tmb_enabled_from_hook } = useTMB();
    const is_tmb_enabled = useMemo(
        () => window.is_tmb_enabled === true || tmb_enabled_from_hook,
        [tmb_enabled_from_hook]
    );

    const getQueryParams = new URLSearchParams(window.location.search);
    const currency = getQueryParams.get('account') ?? '';
    const validCurrencies = [...fiat_currencies_display_order, ...crypto_currencies_display_order];

    // Set the URL ?account= param from WS authorize response if not already set
    useEffect(() => {
        if (!currency && api_base.api) {
            const subscription = api_base.api.onMessage().subscribe(({ data }: any) => {
                if (data?.msg_type === 'authorize') {
                    const account_list = data?.authorize?.account_list ?? [];
                    const active = account_list[0];
                    if (active) {
                        const account_param = active.is_virtual ? 'demo' : active.currency;
                        const params = new URLSearchParams(window.location.search);
                        if (!params.has('account')) {
                            params.set('account', account_param);
                            window.history.pushState({}, '', `${window.location.pathname}?${params}`);
                        }
                        sessionStorage.setItem('query_param_currency', account_param);
                    }
                    subscription?.unsubscribe();
                }
            });
            return () => subscription?.unsubscribe();
        }
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        if (currency) {
            sessionStorage.setItem('query_param_currency', currency);
        }
    }, [currency]);

    useEffect(() => {
        if (is_tmb_enabled) {
            onRenderTMBCheck();
        }
    }, [is_tmb_enabled, onRenderTMBCheck]);

    return (
        <div
            className={clsx('layout', {
                responsive: isDesktop,
                'quick-strategy-active': is_quick_strategy_active && !isDesktop,
            })}
        >
            {!isCallbackPage && <AppHeader isAuthenticating={false} />}
            <Body>
                <Outlet />
            </Body>
            {!isCallbackPage && isDesktop && <Footer />}
            <PWAUpdateNotification />
        </div>
    );
});

export default Layout;
