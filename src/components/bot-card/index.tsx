import React from 'react';
import './bot-card.scss';

export interface BotCardProps {
    name: string;
    description: string;
    category: string;
    icon: React.ReactNode;
    color: string;
    glow: string;
    onLoad: () => void;
    isLoading?: boolean;
    tier?: 'gold' | 'platinum' | 'diamond';
    locked?: boolean;
    winRate?: string;
    trades?: string;
}

const TIER_LABEL: Record<string, string> = { gold: 'Gold', platinum: 'Platinum', diamond: 'Diamond' };

const LockIcon = () => (
    <svg
        width='13'
        height='13'
        viewBox='0 0 24 24'
        fill='none'
        stroke='currentColor'
        strokeWidth='2.2'
        strokeLinecap='round'
        strokeLinejoin='round'
    >
        <rect x='3' y='11' width='18' height='11' rx='2' />
        <path d='M7 11V7a5 5 0 0 1 10 0v4' />
    </svg>
);

const ArrowIcon = () => (
    <svg
        width='13'
        height='13'
        viewBox='0 0 24 24'
        fill='none'
        stroke='currentColor'
        strokeWidth='2.5'
        strokeLinecap='round'
        strokeLinejoin='round'
    >
        <path d='M5 12h14M12 5l7 7-7 7' />
    </svg>
);

const StarIcon = () => (
    <svg width='10' height='10' viewBox='0 0 24 24' fill='currentColor' stroke='none'>
        <polygon points='12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2' />
    </svg>
);

const BotCard = ({
    name,
    description,
    category,
    icon,
    color,
    glow,
    onLoad,
    isLoading,
    tier,
    locked,
    winRate,
    trades,
}: BotCardProps) => (
    <div
        className={`bot-card${locked ? ' bot-card--locked' : ''}`}
        style={{ '--bc-color': color, '--bc-glow': glow } as React.CSSProperties}
    >
        {tier && (
            <div className='bot-card__tier'>
                <StarIcon />
                {TIER_LABEL[tier]}
            </div>
        )}

        <div className='bot-card__top'>
            <div className='bot-card__icon'>{icon}</div>
            <span className='bot-card__category'>{category}</span>
        </div>

        <div className='bot-card__body'>
            <h3 className='bot-card__name'>{name}</h3>
            <p className='bot-card__desc'>{description}</p>
        </div>

        {(winRate || trades) && (
            <div className='bot-card__stats'>
                {winRate && (
                    <span className='bot-card__stat'>
                        <strong>{winRate}</strong> win
                    </span>
                )}
                {trades && (
                    <span className='bot-card__stat'>
                        <strong>{trades}</strong> trades
                    </span>
                )}
            </div>
        )}

        {locked ? (
            <button className='bot-card__btn bot-card__btn--locked' disabled>
                <LockIcon />
                Locked
            </button>
        ) : (
            <button className='bot-card__btn' onClick={onLoad} disabled={isLoading} aria-label={`Load ${name}`}>
                {isLoading ? (
                    <span className='bot-card__spinner' aria-hidden='true' />
                ) : (
                    <>
                        <span>Load</span>
                        <ArrowIcon />
                    </>
                )}
            </button>
        )}
    </div>
);

export default BotCard;
