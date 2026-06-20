import { clearAuthState } from '@/services/deriv-auth';

export const clearAuthData = (is_reload: boolean = true): void => {
    clearAuthState();
    sessionStorage.removeItem('query_param_currency');
    if (is_reload) {
        location.reload();
    }
};
