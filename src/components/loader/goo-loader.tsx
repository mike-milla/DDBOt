import { getImageLocation } from '@/public-path';

const GooLoader = () => <img src={getImageLocation('loader.gif')} alt='loading' width={90} height={90} />;

export default GooLoader;
