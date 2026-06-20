import './tab-loader.scss';

const TabLoader = ({ message = 'Loading…' }: { message?: string }) => (
    <div className='tab-loader'>
        <div className='tab-loader__ring-wrap'>
            <div className='tab-loader__ring' />
            <div className='tab-loader__dot' />
        </div>
        <span className='tab-loader__label'>{message}</span>
    </div>
);

export default TabLoader;
