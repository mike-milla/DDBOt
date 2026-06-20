import { useDevice } from '@deriv-com/ui';
import './app-logo.scss';

export const AppLogo = () => {
    const { isDesktop } = useDevice();

    if (!isDesktop) return null;
    return (
        <a className='app-header__logo' href='/'>
            <img src='/assets/images/bossmillan-logo.jpeg' alt='BossMillan' height='36' />
            <span className='app-header__logo-text'>
                <span className='app-header__logo-text--boss'>Boss</span>
                <span className='app-header__logo-text--millan'>Millan</span>
            </span>
        </a>
    );
};
