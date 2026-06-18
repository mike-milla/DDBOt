import GooLoader from './goo-loader';

export default function ChunkLoader({ message }: { message: string }) {
    return (
        <div className='app-root'>
            <GooLoader />
            <div className='load-message'>{message}</div>
        </div>
    );
}
