import { Suspense } from 'react';
import { observer } from 'mobx-react-lite';
import GooLoader from '@/components/loader/goo-loader';
import { useDevice } from '@deriv-com/ui';
import ChartModalDesktop from './chart-modal-desktop';

export const ChartModal = observer(() => {
    const { isDesktop } = useDevice();
    return <Suspense fallback={<GooLoader />}>{isDesktop && <ChartModalDesktop />}</Suspense>;
});

export default ChartModal;
