import React from 'react';
import './bot-card.scss';

export interface BotCardProps {
    name: string;
    description: string;
    category?: string;
    onLoad: () => void;
    isLoading?: boolean;
    locked?: boolean;
    winRate?: string;
    trades?: string;
}

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

const BotCard = ({ name, description, category, onLoad, isLoading, locked, winRate, trades }: BotCardProps) => (
    <div className={`bot-card${locked ? ' bot-card--locked' : ''}`}>
        <div className='bot-card__accent' />

        <div className='bot-card__body'>
            <h3 className='bot-card__name'>{name}</h3>
            {category && <span className='bot-card__category'>{category}</span>}
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
                        <span>Load Bot</span>
                        <ArrowIcon />
                    </>
                )}
            </button>
        )}
    </div>
);

export default BotCard;
