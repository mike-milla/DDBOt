import { initSurvicate } from '../public-path';
import { lazy, Suspense } from 'react';
import React from 'react';
import { createBrowserRouter, createRoutesFromElements, Route, RouterProvider } from 'react-router-dom';
import PageLoader from '@/components/loader/page-loader';
import RoutePromptDialog from '@/components/route-prompt-dialog';
import { StoreProvider } from '@/hooks/useStore';
import { initializeI18n, TranslationProvider } from '@deriv-com/translations';
import CoreStoreProvider from './CoreStoreProvider';
import './app-root.scss';

const Layout = lazy(() => import('../components/layout'));
const AppRoot = lazy(() => import('./app-root'));
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
            <Route
                path='/app'
                element={
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
        // Switch active account based on ?account= URL param
        const url_params = new URLSearchParams(window.location.search);
        const account_currency = url_params.get('account');
        if (!account_currency) return;

        const accounts: Array<{ account_id: string; currency: string; account_type: string }> = JSON.parse(
            localStorage.getItem('deriv_accounts') ?? '[]'
        );
        if (!accounts.length) return;

        let target: (typeof accounts)[0] | undefined;
        if (account_currency.toUpperCase() === 'DEMO') {
            target = accounts.find(a => a.account_type === 'demo');
        } else {
            target = accounts.find(
                a => a.account_type === 'real' && a.currency.toUpperCase() === account_currency.toUpperCase()
            );
        }
        if (target) {
            localStorage.setItem('deriv_active_account', target.account_id);
        }
    }, []);

    return <RouterProvider router={router} />;
}

export default App;
