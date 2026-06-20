import { useEffect, useRef, useState } from 'react';
import DisableDevtool from 'disable-devtool';
import './devtools-shield.scss';

const W = process.env.CONTACT_WHATSAPP as string;
const TG = process.env.CONTACT_TELEGRAM as string;
const TK = process.env.CONTACT_TIKTOK as string;
const IG = process.env.CONTACT_INSTAGRAM as string;

const socials = [
    { label: 'Instagram', emoji: '📸', href: IG ? `https://instagram.com/${IG.replace('@', '')}` : null },
    { label: 'WhatsApp', emoji: '💬', href: W ? `https://wa.me/${W.replace(/\D/g, '')}` : null },
    { label: 'TikTok', emoji: '🎵', href: TK ? `https://tiktok.com/@${TK.replace('@', '')}` : null },
    { label: 'Telegram', emoji: '✈️', href: TG ? `https://t.me/${TG.replace('@', '')}` : null },
].filter(s => s.href);

const DevToolsShield = () => {
    const [tick, setTick] = useState(0);
    const dots = ['.', '..', '...'][tick % 3];

    useEffect(() => {
        const id = setInterval(() => setTick(t => t + 1), 600);
        return () => clearInterval(id);
    }, []);

    return (
        <div className='dt-shield'>
            <div className='dt-shield__noise' />
            <div className='dt-shield__glow dt-shield__glow--teal' />
            <div className='dt-shield__glow dt-shield__glow--purple' />

            <div className='dt-shield__card'>
                <div className='dt-shield__top-line' />

                <div className='dt-shield__badges'>
                    <span className='dt-shield__badge dt-shield__badge--alert'>
                        <span className='dt-shield__badge-dot' />
                        ACCESS RESTRICTED
                    </span>
                    <span className='dt-shield__badge dt-shield__badge--warning'>⚠️ WORKSPACE DANGER SHIELD</span>
                </div>

                <h2 className='dt-shield__title'>Restricted danger zone</h2>

                <p className='dt-shield__msg'>
                    Developer tools are blocked on this workspace. Close inspection tools and reload the page to
                    continue.
                </p>

                <p className='dt-shield__arming'>Alarm siren arming{dots}</p>

                <div className='dt-shield__divider' />

                <span className='dt-shield__contact-label'>Follow our channels</span>

                <div className='dt-shield__socials'>
                    {socials.map(s => (
                        <a
                            key={s.label}
                            href={s.href!}
                            target='_blank'
                            rel='noopener noreferrer'
                            className='dt-shield__social'
                        >
                            <span className='dt-shield__social-emoji'>{s.emoji}</span>
                            {s.label}
                        </a>
                    ))}
                </div>
            </div>
        </div>
    );
};

const printConsoleWarning = () => {
    console.log(
        '%c⛔ STOP!',
        [
            'color: #ef4444',
            'font-size: 56px',
            'font-weight: 900',
            'font-family: IBM Plex Sans, system-ui, sans-serif',
            'text-shadow: 0 0 20px #ef444488',
            'padding: 8px 0',
            'display: block',
        ].join(';')
    );
    console.log(
        '%cThis is a restricted area.',
        [
            'color: #fff',
            'font-size: 18px',
            'font-weight: 700',
            'font-family: IBM Plex Sans, system-ui, sans-serif',
            'background: linear-gradient(135deg, #0bc4a6, #7625a8)',
            'padding: 10px 20px',
            'border-radius: 8px',
            'display: block',
        ].join(';')
    );
    console.log(
        '%cDeveloper tools are not permitted on BossMillan.\nIf someone told you to paste something here, it is a scam.\nClose DevTools and refresh the page to continue.',
        [
            'color: #fbbf24',
            'font-size: 13px',
            'font-weight: 600',
            'font-family: IBM Plex Sans, monospace, sans-serif',
            'line-height: 1.8',
            'padding: 4px 0',
            'display: block',
        ].join(';')
    );
    console.log(
        '%c🔒 BossMillan Security Shield',
        [
            'color: #0bc4a6',
            'font-size: 11px',
            'font-weight: 700',
            'font-family: IBM Plex Sans, monospace, sans-serif',
            'letter-spacing: 2px',
            'text-transform: uppercase',
            'opacity: 0.7',
            'padding-top: 4px',
            'display: block',
        ].join(';')
    );
};

export const useDevToolsDetect = () => {
    const [detected, setDetected] = useState(false);
    const started = useRef(false);

    useEffect(() => {
        if (started.current) return;
        started.current = true;

        DisableDevtool({
            clearLog: true,
            disableMenu: true,
            interval: 1000,
            // Exclude Debugger (2) — hijacks the Sources tab
            detectors: [0, 1, 3, 4, 6],
            ondevtoolopen(_type, _next) {
                console.clear();
                setTimeout(printConsoleWarning, 1);
                setDetected(true);
                DisableDevtool.isSuspend = true; // stop all probing — user must refresh to reset
            },
        });
    }, []);

    return detected;
};

export default DevToolsShield;
