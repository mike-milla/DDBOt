import { useCallback } from 'react';
import clsx from 'clsx';
import { observer } from 'mobx-react-lite';
import PWAInstallButton from '@/components/pwa-install-button';
import { useDerivAuth } from '@/hooks/useDerivAuth';
import { initiateLogin, initiateSignup } from '@/services/deriv-auth';
import { useDevice } from '@deriv-com/ui';
import { Header, Wrapper } from '@deriv-com/ui';
import { AppLogo } from '../app-logo';
import ResourcesDropdown from './resources-dropdown/ResourcesDropdown';
import AccountsInfoLoader from './account-info-loader';
import BmAccountPanel from './bm-account-panel';
import BossMillanLoginButton from './bossmillan-login';
import ConnectDerivDropdown from './connect-deriv';
import MenuItems from './menu-items';
import MobileMenu from './mobile-menu';
import './header.scss';

type TAppHeaderProps = {
    isAuthenticating?: boolean;
};

const AppHeader = observer(({ isAuthenticating }: TAppHeaderProps) => {
    const { isDesktop } = useDevice();
    const { isLoggedIn } = useDerivAuth();

    const renderAccountSection = useCallback(() => {
        if (isAuthenticating) {
            return <AccountsInfoLoader isLoggedIn isMobile={!isDesktop} speed={3} />;
        }

        if (isLoggedIn) {
            return <BmAccountPanel />;
        }

        return <ConnectDerivDropdown onLogin={() => initiateLogin()} onSignup={() => initiateSignup()} />;
    }, [isAuthenticating, isDesktop, isLoggedIn]);

    return (
        <Header
            className={clsx('app-header', {
                'app-header--desktop': isDesktop,
                'app-header--mobile': !isDesktop,
            })}
        >
            <Wrapper variant='left'>
                <AppLogo />
                <MobileMenu />
                {isDesktop && <MenuItems />}
                <ResourcesDropdown />
            </Wrapper>
            <Wrapper variant='right' style={{ gap: '1rem' }}>
                {!isDesktop && <PWAInstallButton variant='primary' size='medium' />}
                {renderAccountSection()}
                <BossMillanLoginButton />
            </Wrapper>
        </Header>
    );
});

export default AppHeader;
