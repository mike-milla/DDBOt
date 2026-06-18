import { standalone_routes } from '@/components/shared';
import { useDevice } from '@deriv-com/ui';
import './app-logo.scss';

export const AppLogo = () => {
    const { isDesktop } = useDevice();

    if (!isDesktop) return null;
    return (
        <a className='app-header__logo' href={standalone_routes.deriv_com} target='_blank' rel='noreferrer'>
            <img src='/assets/images/bossmillan-logo.jpeg' alt='BossMillan' height='48' />
        </a>
    );
};
