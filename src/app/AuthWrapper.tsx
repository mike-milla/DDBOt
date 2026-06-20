import CallbackPage from '@/pages/callback';
import { loadAuthState } from '@/services/deriv-auth';
import App from './App';

export const AuthWrapper = () => {
    const params = new URLSearchParams(window.location.search);

    // Deriv redirects back to the domain root with ?code= (or ?error=).
    // Handle the PKCE callback here so the registered redirect URI is just the domain.
    if (params.has('code') || params.has('error')) {
        return <CallbackPage />;
    }

    if (window.location.pathname.startsWith('/app') && !loadAuthState()) {
        window.location.replace('/');
        return null;
    }

    return <App />;
};
