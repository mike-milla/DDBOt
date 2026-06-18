import React from 'react';
import GooLoader from '@/components/loader/goo-loader';
import { useOauth2 } from '@/hooks/auth/useOauth2';
import useTMB from '@/hooks/useTMB';

type AuthLoadingWrapperProps = {
    children: React.ReactNode;
};

const AuthLoadingWrapper = ({ children }: AuthLoadingWrapperProps) => {
    const { isSingleLoggingIn } = useOauth2();
    const { isTmbEnabled } = useTMB();

    const is_tmb_enabled = isTmbEnabled() || window.is_tmb_enabled === true;

    if (isSingleLoggingIn && !is_tmb_enabled) {
        return <GooLoader />;
    }

    return <>{children}</>;
};

export default AuthLoadingWrapper;
