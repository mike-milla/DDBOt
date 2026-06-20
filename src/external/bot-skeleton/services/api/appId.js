import { getAppId, getSocketURL } from '@/components/shared';
import { website_name } from '@/utils/site-config';
import DerivAPIBasic from '@deriv/deriv-api/dist/DerivAPIBasic';
import { getInitialLanguage } from '@deriv-com/translations';
import APIMiddleware from './api-middleware';

/** @param {string | undefined} [overrideUrl] */
export const generateDerivApiInstance = (overrideUrl = undefined) => {
    let socket_url = overrideUrl;
    if (!socket_url) {
        const cleanedServer = getSocketURL().replace(/[^a-zA-Z0-9.]/g, '');
        const cleanedAppId = getAppId()?.replace?.(/[^a-zA-Z0-9]/g, '') ?? getAppId();
        socket_url = `wss://${cleanedServer}/websockets/v3?app_id=${cleanedAppId}&l=${getInitialLanguage()}&brand=${website_name.toLowerCase()}`;
    }
    const deriv_socket = new WebSocket(socket_url);
    const deriv_api = new DerivAPIBasic({
        connection: deriv_socket,
        middleware: new APIMiddleware({}),
    });
    return deriv_api;
};

export const getLoginId = () => {
    const id = localStorage.getItem('deriv_active_account');
    if (id && id !== 'null') return id;
    return null;
};

export const V2GetActiveToken = () => {
    const token = localStorage.getItem('deriv_access_token');
    if (token && token !== 'null') return token;
    return null;
};

export const V2GetActiveClientId = () => {
    return getLoginId();
};

export const getToken = () => {
    const account_id = localStorage.getItem('deriv_active_account') ?? undefined;
    const token = localStorage.getItem('deriv_access_token') ?? undefined;
    return { token, account_id };
};
