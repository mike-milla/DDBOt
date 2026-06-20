import DevToolsShield, { useDevToolsDetect } from '@/components/devtools-shield';
import CallbackPage from '@/pages/callback';
import { loadAuthState } from '@/services/deriv-auth';
import App from './App';

export const AuthWrapper = () => {
    const devToolsOpen = useDevToolsDetect();
    if (devToolsOpen) return <DevToolsShield />;
    const params = new URLSearchParams(window.location.search);

    if (params.has('code') || params.has('error')) {
        return <CallbackPage />;
    }

    if (window.location.pathname.startsWith('/app') && !loadAuthState()) {
        window.location.replace('/');
        return null;
    }

    return <App />;
};
