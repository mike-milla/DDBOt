const AUTH_URL = 'https://auth.deriv.com/oauth2/auth';
const TOKEN_URL = 'https://auth.deriv.com/oauth2/token';
const API_BASE = 'https://api.derivws.com';
const CLIENT_ID = process.env.OAUTH_CLIENT_ID as string;
const SCOPE = 'trade account_manage';

export type DerivAccount = {
    account_id: string;
    balance: number;
    currency: string;
    group: string;
    status: 'active' | 'inactive';
    account_type: 'demo' | 'real';
    created_at?: string;
    email?: string;
    last_access_at?: string;
    name?: string;
    server_id?: string;
    rights?: Record<string, unknown>;
};

export type DerivAuthState = {
    access_token: string;
    accounts: DerivAccount[];
    active_account_id: string;
};

// ── PKCE helpers ──────────────────────────────────────────────────────────────

async function generatePKCE(): Promise<{ codeVerifier: string; codeChallenge: string; state: string }> {
    const array = crypto.getRandomValues(new Uint8Array(64));
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
    const codeVerifier = Array.from(array, v => charset[v % charset.length]).join('');

    const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(codeVerifier));
    const codeChallenge = btoa(String.fromCharCode(...new Uint8Array(hash)))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

    const state = Array.from(crypto.getRandomValues(new Uint8Array(16)), b => b.toString(16).padStart(2, '0')).join('');

    return { codeVerifier, codeChallenge, state };
}

// ── Login redirect ─────────────────────────────────────────────────────────────

export async function initiateLogin() {
    const { codeVerifier, codeChallenge, state } = await generatePKCE();

    sessionStorage.setItem('pkce_code_verifier', codeVerifier);
    sessionStorage.setItem('oauth_state', state);

    const params = new URLSearchParams({
        response_type: 'code',
        client_id: CLIENT_ID,
        redirect_uri: `${window.location.origin}/callback`,
        scope: SCOPE,
        state,
        code_challenge: codeChallenge,
        code_challenge_method: 'S256',
    });

    window.location.assign(`${AUTH_URL}?${params.toString()}`);
}

export async function initiateSignup() {
    const { codeVerifier, codeChallenge, state } = await generatePKCE();

    sessionStorage.setItem('pkce_code_verifier', codeVerifier);
    sessionStorage.setItem('oauth_state', state);

    const params = new URLSearchParams({
        response_type: 'code',
        client_id: CLIENT_ID,
        redirect_uri: `${window.location.origin}/callback`,
        scope: SCOPE,
        state,
        code_challenge: codeChallenge,
        code_challenge_method: 'S256',
        prompt: 'registration',
    });

    window.location.assign(`${AUTH_URL}?${params.toString()}`);
}

// ── Token exchange ─────────────────────────────────────────────────────────────

export async function exchangeCode(code: string, returnedState: string): Promise<string> {
    const storedState = sessionStorage.getItem('oauth_state');
    const codeVerifier = sessionStorage.getItem('pkce_code_verifier');

    if (returnedState !== storedState) throw new Error('State mismatch — possible CSRF');
    if (!codeVerifier) throw new Error('Missing PKCE code_verifier');

    const res = await fetch(TOKEN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            grant_type: 'authorization_code',
            client_id: CLIENT_ID,
            code,
            code_verifier: codeVerifier,
            redirect_uri: `${window.location.origin}/callback`,
        }),
    });

    if (!res.ok) {
        const body = await res.text().catch(() => '');
        throw new Error(`Token exchange failed ${res.status}: ${body}`);
    }

    const { access_token } = await res.json();

    sessionStorage.removeItem('pkce_code_verifier');
    sessionStorage.removeItem('oauth_state');

    return access_token as string;
}

// ── New API calls ──────────────────────────────────────────────────────────────

export async function fetchAccounts(accessToken: string): Promise<DerivAccount[]> {
    const res = await fetch(`${API_BASE}/trading/v1/options/accounts`, {
        headers: {
            Authorization: `Bearer ${accessToken}`,
            'Deriv-App-ID': CLIENT_ID,
        },
    });

    if (!res.ok) {
        const body = await res.text().catch(() => '');
        throw new Error(`Failed to fetch accounts ${res.status}: ${body}`);
    }

    const json = await res.json();
    return (json.data ?? []) as DerivAccount[];
}

export async function fetchAccountOtp(accessToken: string, accountId: string): Promise<string> {
    const res = await fetch(`${API_BASE}/trading/v1/options/accounts/${accountId}/otp`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${accessToken}`,
            'Deriv-App-ID': CLIENT_ID,
            'Content-Type': 'application/json',
        },
    });

    if (!res.ok) throw new Error(`Failed to get OTP: ${res.status}`);
    const data = await res.json();
    return data.otp as string;
}

// ── Auth state persistence ────────────────────────────────────────────────────

export function saveAuthState(state: DerivAuthState) {
    localStorage.setItem('deriv_access_token', state.access_token);
    localStorage.setItem('deriv_accounts', JSON.stringify(state.accounts));
    localStorage.setItem('deriv_active_account', state.active_account_id);
    window.dispatchEvent(new Event('deriv_auth_changed'));
}

export function loadAuthState(): DerivAuthState | null {
    const access_token = localStorage.getItem('deriv_access_token');
    const accounts_raw = localStorage.getItem('deriv_accounts');
    const active_account_id = localStorage.getItem('deriv_active_account');

    if (!access_token || !accounts_raw || !active_account_id) return null;

    try {
        return {
            access_token,
            accounts: JSON.parse(accounts_raw) as DerivAccount[],
            active_account_id,
        };
    } catch {
        return null;
    }
}

export function clearAuthState() {
    localStorage.removeItem('deriv_access_token');
    localStorage.removeItem('deriv_accounts');
    localStorage.removeItem('deriv_active_account');
    window.dispatchEvent(new Event('deriv_auth_changed'));
}

export function setActiveAccount(accountId: string) {
    localStorage.setItem('deriv_active_account', accountId);
    window.dispatchEvent(new Event('deriv_auth_changed'));
}
