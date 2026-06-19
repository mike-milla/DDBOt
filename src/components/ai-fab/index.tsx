import React, { useCallback, useEffect, useRef, useState } from 'react';
import Dialog from '@/components/shared_ui/dialog';
import './ai-fab.scss';

// ── Entry Scanner Dialog Content ─────────────────────────────────────────────

const PRESETS = [
    { label: 'Over1 / Under8', mode: '01 / U8' },
    { label: 'Over2 / Under7', mode: '02 / U7' },
    { label: 'Over3 / Under6', mode: '03 / U6' },
];

const ScannerRingIcon = () => (
    <svg className='es-hero__ring-icon' viewBox='0 0 48 48' fill='none' xmlns='http://www.w3.org/2000/svg'>
        <circle cx='24' cy='24' r='22' stroke='rgba(96,165,250,0.3)' strokeWidth='1.5' strokeDasharray='4 3' />
        <circle cx='24' cy='24' r='15' stroke='rgba(96,165,250,0.5)' strokeWidth='1.5' />
        <circle cx='24' cy='24' r='8' stroke='rgba(96,165,250,0.8)' strokeWidth='1.5' />
        <circle cx='24' cy='24' r='3' fill='#60a5fa' />
        <line x1='24' y1='2' x2='24' y2='9' stroke='rgba(96,165,250,0.6)' strokeWidth='1.5' strokeLinecap='round' />
        <line x1='24' y1='39' x2='24' y2='46' stroke='rgba(96,165,250,0.6)' strokeWidth='1.5' strokeLinecap='round' />
        <line x1='2' y1='24' x2='9' y2='24' stroke='rgba(96,165,250,0.6)' strokeWidth='1.5' strokeLinecap='round' />
        <line x1='39' y1='24' x2='46' y2='24' stroke='rgba(96,165,250,0.6)' strokeWidth='1.5' strokeLinecap='round' />
    </svg>
);

const ScanMarketsIcon = () => (
    <svg
        width='16'
        height='16'
        viewBox='0 0 24 24'
        fill='none'
        stroke='currentColor'
        strokeWidth='2'
        strokeLinecap='round'
        strokeLinejoin='round'
    >
        <circle cx='11' cy='11' r='8' />
        <path d='m21 21-4.35-4.35' />
    </svg>
);

const BotIcon = () => (
    <svg
        width='15'
        height='15'
        viewBox='0 0 24 24'
        fill='none'
        stroke='currentColor'
        strokeWidth='2'
        strokeLinecap='round'
        strokeLinejoin='round'
    >
        <rect width='18' height='14' x='3' y='8' rx='2' />
        <path d='M9 8V6a3 3 0 0 1 6 0v2' />
        <circle cx='9' cy='14' r='1' fill='currentColor' />
        <circle cx='15' cy='14' r='1' fill='currentColor' />
        <path d='M9 17h6' />
    </svg>
);

const SparkleIcon = () => (
    <svg width='12' height='12' viewBox='0 0 24 24' fill='currentColor'>
        <path d='M12 2L13.09 8.26L19 6L14.74 10.91L21 12L14.74 13.09L19 18L13.09 15.74L12 22L10.91 15.74L5 18L9.26 13.09L3 12L9.26 10.91L5 6L10.91 8.26L12 2Z' />
    </svg>
);

const NotScannedIcon = () => (
    <svg
        width='16'
        height='16'
        viewBox='0 0 24 24'
        fill='none'
        stroke='currentColor'
        strokeWidth='2'
        strokeLinecap='round'
        strokeLinejoin='round'
    >
        <rect width='18' height='14' x='3' y='8' rx='2' />
        <path d='M9 8V6a3 3 0 0 1 6 0v2' />
        <circle cx='12' cy='14' r='2' />
    </svg>
);

const EntryScanner = () => {
    const [activePreset, setActivePreset] = useState(0);
    const [ticks, setTicks] = useState(3000);

    return (
        <div className='entry-scanner'>
            {/* ── Hero card ── */}
            <div className='es-hero'>
                <div className='es-hero__left'>
                    <span className='es-hero__badge'>
                        <SparkleIcon />
                        RECOVERY ENGINE
                    </span>
                    <h2 className='es-hero__title'>Digits Scanner</h2>
                    <p className='es-hero__desc'>Scans Over 1 and Under 8 with recovery confirmation.</p>
                </div>
                <div className='es-hero__right'>
                    <div className='es-hero__ring-wrap'>
                        <div className='es-hero__ring-orbit' />
                        <ScannerRingIcon />
                    </div>
                </div>
            </div>

            {/* ── Preset tabs ── */}
            <div className='es-presets'>
                {PRESETS.map((p, i) => (
                    <button
                        key={p.label}
                        className={`es-presets__btn${activePreset === i ? ' es-presets__btn--active' : ''}`}
                        onClick={() => setActivePreset(i)}
                    >
                        {p.label}
                    </button>
                ))}
            </div>

            {/* ── Fields row 1 ── */}
            <div className='es-fields'>
                <div className='es-field'>
                    <span className='es-field__label'>SCAN DEPTH</span>
                    <span className='es-field__value'>3000</span>
                </div>
                <div className='es-field'>
                    <span className='es-field__label'>MODE</span>
                    <span className='es-field__value'>{PRESETS[activePreset].mode}</span>
                </div>
                <div className='es-field es-field--ticks'>
                    <span className='es-field__label'>TICKS</span>
                    <input
                        className='es-field__input'
                        type='number'
                        value={ticks}
                        min={100}
                        max={10000}
                        onChange={e => setTicks(Number(e.target.value))}
                    />
                </div>
            </div>

            {/* ── Fields row 2 ── */}
            <div className='es-fields es-fields--row2'>
                <div className='es-field es-field--wide'>
                    <span className='es-field__label'>SELECTED MARKET</span>
                    <span className='es-field__value es-field__value--muted'>Scan to find the best market</span>
                </div>
                <div className='es-field'>
                    <span className='es-field__label'>TRADE TYPE</span>
                    <span className='es-field__value es-field__value--muted'>Waiting for scan</span>
                </div>
            </div>

            {/* ── Status ── */}
            <div className='es-status'>
                <NotScannedIcon />
                <span>Not scanned yet</span>
            </div>

            {/* ── Footer ── */}
            <div className='es-footer'>
                <button className='es-footer__btn es-footer__btn--primary'>
                    <ScanMarketsIcon />
                    Scan Markets
                </button>
                <button className='es-footer__btn es-footer__btn--secondary'>
                    <BotIcon />
                    Load Scanner Bot
                </button>
            </div>
        </div>
    );
};

// ── Draggable AI FAB ─────────────────────────────────────────────────────────

const AiFab = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [pos, setPos] = useState({ x: -1, y: -1 });
    const isDragging = useRef(false);
    const dragStart = useRef({ x: 0, y: 0 });
    const posStart = useRef({ x: 0, y: 0 });
    const hasMoved = useRef(false);

    useEffect(() => {
        setPos({ x: window.innerWidth - 72, y: window.innerHeight - 72 });
    }, []);

    const onPointerDown = useCallback(
        (e: React.PointerEvent<HTMLButtonElement>) => {
            isDragging.current = true;
            hasMoved.current = false;
            dragStart.current = { x: e.clientX, y: e.clientY };
            posStart.current = { ...pos };
            (e.currentTarget as HTMLButtonElement).setPointerCapture(e.pointerId);
            e.preventDefault();
        },
        [pos]
    );

    const onPointerMove = useCallback((e: React.PointerEvent<HTMLButtonElement>) => {
        if (!isDragging.current) return;
        const dx = e.clientX - dragStart.current.x;
        const dy = e.clientY - dragStart.current.y;
        if (Math.abs(dx) > 4 || Math.abs(dy) > 4) hasMoved.current = true;
        setPos({
            x: Math.max(32, Math.min(window.innerWidth - 32, posStart.current.x + dx)),
            y: Math.max(32, Math.min(window.innerHeight - 32, posStart.current.y + dy)),
        });
    }, []);

    const onPointerUp = useCallback(() => {
        isDragging.current = false;
    }, []);

    const handleClick = useCallback(() => {
        if (!hasMoved.current) setIsOpen(true);
    }, []);

    if (pos.x < 0) return null;

    return (
        <>
            <button
                className='ai-fab'
                style={{ left: pos.x, top: pos.y }}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onClick={handleClick}
                aria-label='Open AI Entry Scanner'
            >
                {/* Pulsing rings */}
                <span className='ai-fab__pulse ai-fab__pulse--1' />
                <span className='ai-fab__pulse ai-fab__pulse--2' />
                {/* Rotating scanner arc */}
                <span className='ai-fab__arc' />
                {/* Core */}
                <span className='ai-fab__core'>
                    <span className='ai-fab__label'>AI</span>
                    <span className='ai-fab__dot' />
                </span>
            </button>

            {isOpen && (
                <Dialog
                    className='entry-scanner-dialog'
                    title='Entry Scanner'
                    has_close_icon
                    is_visible={isOpen}
                    onClose={() => setIsOpen(false)}
                    onConfirm={() => setIsOpen(false)}
                    login={() => {
                        /* noop */
                    }}
                    dismissable
                    is_mobile_full_width={false}
                    portal_element_id='modal_root'
                >
                    <EntryScanner />
                </Dialog>
            )}
        </>
    );
};

export default AiFab;
