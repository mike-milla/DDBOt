import { initSurvicate } from '../public-path';
import { lazy, Suspense } from 'react';
import React from 'react';
import {
    createBrowserRouter,
    createRoutesFromElements,
    Navigate,
    Outlet,
    Route,
    RouterProvider,
} from 'react-router-dom';
import PageLoader from '@/components/loader/page-loader';
import RoutePromptDialog from '@/components/route-prompt-dialog';
import { crypto_currencies_display_order, fiat_currencies_display_order } from '@/components/shared';
import { isLocal, isProduction } from '@/components/shared/utils/config/config';
import { StoreProvider } from '@/hooks/useStore';
import CallbackPage from '@/pages/callback';
import Endpoint from '@/pages/endpoint';
import { loadAuthState } from '@/services/deriv-auth';
import { TAuthData } from '@/types/api-types';
import { initializeI18n, TranslationProvider } from '@deriv-com/translations';
import CoreStoreProvider from './CoreStoreProvider';
import './app-root.scss';

const AuthGuard = () => {
    if (!loadAuthState()) return <Navigate to='/' replace />;
    return <Outlet />;
};

const Layout = lazy(() => import('../components/layout'));
const AppRoot = lazy(() => import('./app-root'));
const FreeBots = lazy(() => import('../pages/free-bots'));
const ExclusiveBots = lazy(() => import('../pages/exclusive-bots'));
const CopyTrader = lazy(() => import('../pages/copy-trader'));
const BulkTrader = lazy(() => import('../pages/bulk-trader'));
const AnalysisTool = lazy(() => import('../pages/analysis-tool'));
const DCircles = lazy(() => import('../pages/dcircles'));
const LandingPage = lazy(() => import('../pages/landing'));

const { TRANSLATIONS_CDN_URL, R2_PROJECT_NAME, CROWDIN_BRANCH_NAME } = process.env;
const i18nInstance = initializeI18n({
    cdnUrl: `${TRANSLATIONS_CDN_URL}/${R2_PROJECT_NAME}/${CROWDIN_BRANCH_NAME}`,
});

const SuspenseWrapper = ({ children }: { children: React.ReactNode }) => {
    return <Suspense fallback={<PageLoader />}>{children}</Suspense>;
};

const router = createBrowserRouter(
    createRoutesFromElements(
        <>
            <Route
                path='/'
                element={
                    <SuspenseWrapper>
                        <LandingPage />
                    </SuspenseWrapper>
                }
            />
            <Route path='/callback' element={<CallbackPage />} />
            <Route path='/app' element={<AuthGuard />}>
                <Route
                    element={
                        // SuspenseWrapper (full-page PageLoader) only fires once when Layout chunk loads.
                        // Each child tab gets its own silent Suspense so tab-switches never trigger the full-page loader.
                        <SuspenseWrapper>
                            <TranslationProvider defaultLang='EN' i18nInstance={i18nInstance}>
                                <StoreProvider>
                                    <RoutePromptDialog />
                                    <CoreStoreProvider>
                                        <Layout />
                                    </CoreStoreProvider>
                                </StoreProvider>
                            </TranslationProvider>
                        </SuspenseWrapper>
                    }
                >
                    <Route
                        index
                        element={
                            <Suspense fallback={null}>
                                <AppRoot />
                            </Suspense>
                        }
                    />
                    <Route path='endpoint' element={isProduction() ? <Navigate to='/app' replace /> : <Endpoint />} />
                    <Route
                        path='free-bots'
                        element={
                            <Suspense fallback={null}>
                                <FreeBots />
                            </Suspense>
                        }
                    />
                    <Route
                        path='exclusive-bots'
                        element={
                            <Suspense fallback={null}>
                                <ExclusiveBots />
                            </Suspense>
                        }
                    />
                    <Route
                        path='copy-trader'
                        element={
                            <Suspense fallback={null}>
                                <CopyTrader />
                            </Suspense>
                        }
                    />
                    <Route
                        path='bulk-trader'
                        element={
                            <Suspense fallback={null}>
                                <BulkTrader />
                            </Suspense>
                        }
                    />
                    <Route
                        path='analysis-tool'
                        element={
                            <Suspense fallback={null}>
                                <AnalysisTool />
                            </Suspense>
                        }
                    />
                    <Route
                        path='dcircles'
                        element={
                            <Suspense fallback={null}>
                                <DCircles />
                            </Suspense>
                        }
                    />
                </Route>
            </Route>
        </>
    )
);

function App() {
    React.useEffect(() => {
        // Use the invalid token handler hook to automatically retrigger OIDC authentication
        // when an invalid token is detected and the cookie logged state is true

        initSurvicate();
        window?.dataLayer?.push({ event: 'page_load' });
        return () => {
            // Clean up the invalid token handler when the component unmounts
            const survicate_box = document.getElementById('survicate-box');
            if (survicate_box) {
                survicate_box.style.display = 'none';
            }
        };
    }, []);

    React.useEffect(() => {
        const accounts_list = localStorage.getItem('accountsList');
        const client_accounts = localStorage.getItem('clientAccounts');
        const url_params = new URLSearchParams(window.location.search);
        const account_currency = url_params.get('account');
        const validCurrencies = [...fiat_currencies_display_order, ...crypto_currencies_display_order];

        const is_valid_currency = account_currency && validCurrencies.includes(account_currency?.toUpperCase());

        if (!accounts_list || !client_accounts) return;

        try {
            const parsed_accounts = JSON.parse(accounts_list);
            const parsed_client_accounts = JSON.parse(client_accounts) as TAuthData['account_list'];

            const updateLocalStorage = (token: string, loginid: string) => {
                localStorage.setItem('authToken', token);
                localStorage.setItem('active_loginid', loginid);
            };

            // Handle demo account
            if (account_currency?.toUpperCase() === 'DEMO') {
                const demo_account = Object.entries(parsed_accounts).find(([key]) => key.startsWith('VR'));

                if (demo_account) {
                    const [loginid, token] = demo_account;
                    updateLocalStorage(String(token), loginid);
                    return;
                }
            }

            // Handle real account with valid currency
            if (account_currency?.toUpperCase() !== 'DEMO' && is_valid_currency) {
                const real_account = Object.entries(parsed_client_accounts).find(
                    ([loginid, account]) =>
                        !loginid.startsWith('VR') && account.currency.toUpperCase() === account_currency?.toUpperCase()
                );

                if (real_account) {
                    const [loginid, account] = real_account;
                    if ('token' in account) {
                        updateLocalStorage(String(account?.token), loginid);
                    }
                    return;
                }
            }
        } catch (e) {
            console.warn('Error', e); // eslint-disable-line no-console
        }
    }, []);

    return <RouterProvider router={router} />;
}

export default App;
