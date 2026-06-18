import { useNavigate } from 'react-router-dom';
import './landing.scss';

const LandingPage = () => {
    const navigate = useNavigate();

    return (
        <div className='landing'>
            <div className='landing__bg' style={{ backgroundImage: "url('/assets/images/landing-bg.png')" }}>
                <div className='landing__bg-grid' />
                <div className='landing__bg-glow landing__bg-glow--1' />
                <div className='landing__bg-glow landing__bg-glow--2' />
            </div>

            <nav className='landing__nav'>
                <div className='landing__nav-logo'>
                    <img src='/assets/images/bossmillan-logo.jpeg' alt='BossMillan' className='landing__nav-logo-img' />
                </div>
                <button className='landing__nav-cta' onClick={() => navigate('/app')}>
                    Launch App
                </button>
            </nav>

            <main className='landing__main'>
                <div className='landing__badge'>BossMillan · Deriv Trading Automation</div>

                <h1 className='landing__headline'>
                    <span className='landing__headline-line'>Trade Smarter.</span>
                    <span className='landing__headline-line landing__headline-line--accent'>Bot Faster.</span>
                </h1>

                <p className='landing__description'>
                    Build, deploy, and automate trading strategies on Deriv — no code required. Visual drag-and-drop bot
                    builder with real-time execution.
                </p>

                <div className='landing__actions'>
                    <button className='landing__btn landing__btn--primary' onClick={() => navigate('/app')}>
                        <svg
                            width='18'
                            height='18'
                            viewBox='0 0 24 24'
                            fill='none'
                            stroke='currentColor'
                            strokeWidth='2.5'
                            strokeLinecap='round'
                            strokeLinejoin='round'
                        >
                            <polygon points='5 3 19 12 5 21 5 3' />
                        </svg>
                        Start Building
                    </button>
                    <button className='landing__btn landing__btn--secondary' onClick={() => navigate('/app/free-bots')}>
                        <svg
                            width='18'
                            height='18'
                            viewBox='0 0 24 24'
                            fill='none'
                            stroke='currentColor'
                            strokeWidth='2'
                            strokeLinecap='round'
                            strokeLinejoin='round'
                        >
                            <path d='M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4' />
                            <polyline points='7 10 12 15 17 10' />
                            <line x1='12' y1='15' x2='12' y2='3' />
                        </svg>
                        Free Bots
                    </button>
                </div>

                <div className='landing__stats'>
                    <div className='landing__stat'>
                        <span className='landing__stat-value'>100+</span>
                        <span className='landing__stat-label'>Strategy blocks</span>
                    </div>
                    <div className='landing__stat-divider' />
                    <div className='landing__stat'>
                        <span className='landing__stat-value'>Real-time</span>
                        <span className='landing__stat-label'>Execution engine</span>
                    </div>
                    <div className='landing__stat-divider' />
                    <div className='landing__stat'>
                        <span className='landing__stat-value'>Zero</span>
                        <span className='landing__stat-label'>Code needed</span>
                    </div>
                </div>
            </main>

            <footer className='landing__footer'>
                <span>Powered by Deriv API</span>
                <a href='https://deriv.com' target='_blank' rel='noreferrer'>
                    deriv.com
                </a>
            </footer>
        </div>
    );
};

export default LandingPage;
