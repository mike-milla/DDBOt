// @ts-expect-error — kept for easy re-enable of devtools shield
import DevToolsShield, { useDevToolsDetect } from '@/components/devtools-shield';
import CallbackPage from '@/pages/callback';
import { loadAuthState } from '@/services/deriv-auth';
import App from './App';

const isProtectedRoute = () => window.location.pathname.startsWith('/app');
const isCallback = () => {
    const p = new URLSearchParams(window.location.search);
    return p.has('code') || p.has('error');
};

export const AuthWrapper = () => {
    // const devToolsOpen = useDevToolsDetect();
    //
    // if (devToolsOpen) return <DevToolsShield />;
    if (isCallback()) return <CallbackPage />;

    // Protected routes require a stored auth state
    if (isProtectedRoute() && !loadAuthState()) {
        console.error('Auth state not found');
        // clearAuthState();
        // window.location.replace('/');
        return null;
    }

    return <App />;
};
