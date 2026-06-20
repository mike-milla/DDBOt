import { getImageLocation } from '@/public-path';
import GooLoader from './goo-loader';
import './page-loader.scss';

const PageLoader = ({ message = 'Loading…' }: { message?: string }) => (
    <div className='page-loader'>
        <div className='page-loader__grid' />
        <div className='page-loader__glow page-loader__glow--teal' />
        <div className='page-loader__glow page-loader__glow--purple' />

        <div className='page-loader__brand'>
            <img src={getImageLocation('bossmillan-logo.jpeg')} alt='BossMillan' className='page-loader__logo' />
            <span className='page-loader__name'>
                <span className='page-loader__boss'>Boss</span>
                <span className='page-loader__millan'>Millan</span>
            </span>
        </div>

        <div className='page-loader__spinner'>
            <div className='page-loader__ring' />
            <GooLoader />
        </div>

        <span className='page-loader__label'>{message}</span>
    </div>
);

export default PageLoader;
