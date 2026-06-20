import React, { lazy, Suspense, useEffect, useRef, useState } from 'react';
import classNames from 'classnames';
import { observer } from 'mobx-react-lite';
import { createPortal } from 'react-dom';
import { useLocation, useNavigate } from 'react-router-dom';
import TabLoader from '@/components/loader/tab-loader';
import DesktopWrapper from '@/components/shared_ui/desktop-wrapper';
import Dialog from '@/components/shared_ui/dialog';
import MobileWrapper from '@/components/shared_ui/mobile-wrapper';
import TradingViewModal from '@/components/trading-view-chart/trading-view-modal';
import { DBOT_TABS, TAB_IDS } from '@/constants/bot-contents';
import { api_base, updateWorkspaceName } from '@/external/bot-skeleton';
import { CONNECTION_STATUS } from '@/external/bot-skeleton/services/api/observables/connection-status-stream';
import { isDbotRTL } from '@/external/bot-skeleton/utils/workspace';
import { useApiBase } from '@/hooks/useApiBase';
import { useStore } from '@/hooks/useStore';
import { initiateLogin } from '@/services/deriv-auth';
import {
    LabelPairedChartLineCaptionRegularIcon,
    LabelPairedLaptopMobileCaptionRegularIcon,
    LabelPairedObjectsColumnCaptionRegularIcon,
    LabelPairedPuzzlePieceTwoCaptionBoldIcon,
} from '@deriv/quill-icons/LabelPaired';
import { LegacyGuide1pxIcon } from '@deriv/quill-icons/Legacy';
import { Localize, localize } from '@deriv-com/translations';
import { useDevice } from '@deriv-com/ui';
import AiFab from '../../components/ai-fab';
import RunPanel from '../../components/run-panel';
import ChartModal from '../chart/chart-modal';
import Dashboard from '../dashboard';
import RunStrategy from '../dashboard/run-strategy';
import './main.scss';

const ChartWrapper = lazy(() => import('../chart/chart-wrapper'));
const Tutorial = lazy(() => import('../tutorials'));
const FreeBots = lazy(() => import('../free-bots'));
const ExclusiveBots = lazy(() => import('../exclusive-bots'));
const CopyTrader = lazy(() => import('../copy-trader'));
const BulkTrader = lazy(() => import('../bulk-trader'));
const DCircles = lazy(() => import('../dcircles'));
const ManualTrader = lazy(() => import('../manual-trader'));

// Tab definitions: array index == the active_tab value used by the store.
const TAB_DEFS = [
    { id: 'id-dbot-dashboard', name: 'Dashboard' }, // 0
    { id: 'id-bot-builder', name: 'Bot Builder' }, // 1
    { id: 'id-charts', name: 'Charts' }, // 2
    { id: 'id-free-bots', name: 'Free Bots' }, // 3
    { id: 'id-exclusive-bots', name: 'Exclusive Bots' }, // 4
    { id: 'id-copy-trader', name: 'Copy Trader' }, // 5
    { id: 'id-bulk-trader', name: 'Bulk Trader' }, // 6
    { id: 'id-analysis-tool', name: 'Analysis Tool' }, // 7
    { id: 'id-manual-trader', name: 'Manual Trader' }, // 8
    { id: 'id-tutorials', name: 'Tutorials' }, // 9
] as const;

// Returns how many tabs fit in the tab bar at a given window width.
const getVisibleCount = (w: number) =>
    w >= 1440 ? 9 : w >= 1280 ? 8 : w >= 1100 ? 7 : w >= 960 ? 6 : w >= 768 ? 5 : 3;

const MoreToolsMenu = ({ activeTab, onSelect }: { activeTab: number; onSelect: (i: number) => void }) => {
    const [open, setOpen] = useState(false);
    const [width, setWidth] = useState(window.innerWidth);
    const [dropPos, setDropPos] = useState({ top: 0, left: 0 });
    const btnRef = useRef<HTMLButtonElement>(null);
    const dropRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handler = () => setWidth(window.innerWidth);
        window.addEventListener('resize', handler);
        return () => window.removeEventListener('resize', handler);
    }, []);

    useEffect(() => {
        if (!open) return;
        const recalc = () => {
            if (btnRef.current) {
                const r = btnRef.current.getBoundingClientRect();
                setDropPos({ top: r.bottom + 4, left: r.left });
            }
        };
        recalc();
        window.addEventListener('resize', recalc);
        return () => window.removeEventListener('resize', recalc);
    }, [open]);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (!btnRef.current?.contains(e.target as Node) && !dropRef.current?.contains(e.target as Node))
                setOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const visibleCount = getVisibleCount(width);
    const hidden = TAB_DEFS.slice(visibleCount);
    const isActiveInMore = hidden.some((_, i) => visibleCount + i === activeTab);

    const toggleOpen = (e: React.MouseEvent) => {
        e.stopPropagation();
        setOpen(o => !o);
    };

    return (
        <div className='main__more' onClick={e => e.stopPropagation()}>
            {hidden.length > 0 && (
                <button
                    ref={btnRef}
                    className={`main__more-btn${isActiveInMore ? ' main__more-btn--active' : ''}${open ? ' main__more-btn--open' : ''}`}
                    onClick={toggleOpen}
                    aria-label='More tools'
                >
                    <svg width='15' height='15' viewBox='0 0 24 24' fill='currentColor' stroke='none'>
                        <circle cx='5' cy='12' r='2' />
                        <circle cx='12' cy='12' r='2' />
                        <circle cx='19' cy='12' r='2' />
                    </svg>
                    <span>More Tools</span>
                    <svg
                        width='11'
                        height='11'
                        viewBox='0 0 24 24'
                        fill='none'
                        stroke='currentColor'
                        strokeWidth='2.5'
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s ease' }}
                    >
                        <polyline points='6 9 12 15 18 9' />
                    </svg>
                </button>
            )}

            {open &&
                createPortal(
                    <div
                        ref={dropRef}
                        className='main__more-dropdown'
                        style={{ position: 'fixed', top: dropPos.top, left: dropPos.left }}
                    >
                        {hidden.map((tab, i) => {
                            const tabIndex = visibleCount + i;
                            return (
                                <button
                                    key={tab.id}
                                    className={`main__more-item${activeTab === tabIndex ? ' main__more-item--active' : ''}`}
                                    onClick={() => {
                                        onSelect(tabIndex);
                                        setOpen(false);
                                    }}
                                >
                                    {tab.name}
                                    {activeTab === tabIndex && (
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
                                            <polyline points='20 6 9 17 4 12' />
                                        </svg>
                                    )}
                                </button>
                            );
                        })}
                    </div>,
                    document.body
                )}
        </div>
    );
};

/** Returns the icon for a tab at the given index. */
const TabIcon = ({ idx, active }: { idx: number; active: boolean }) => {
    const fill = active ? '#0bc4a6' : 'currentColor';
    const s20 = { height: '20px', width: '20px' };
    switch (idx) {
        case 0:
            return <LabelPairedObjectsColumnCaptionRegularIcon {...s20} fill={fill} />;
        case 1:
            return <LabelPairedPuzzlePieceTwoCaptionBoldIcon {...s20} fill={fill} />;
        case 2:
            return <LabelPairedChartLineCaptionRegularIcon {...s20} fill={fill} />;
        case 3:
            return <LabelPairedObjectsColumnCaptionRegularIcon {...s20} fill={fill} />;
        case 4:
            return <LabelPairedObjectsColumnCaptionRegularIcon {...s20} fill={fill} />;
        case 5:
            return <LabelPairedObjectsColumnCaptionRegularIcon {...s20} fill={fill} />;
        case 6:
            return <LabelPairedObjectsColumnCaptionRegularIcon {...s20} fill={fill} />;
        case 7:
            return <LabelPairedChartLineCaptionRegularIcon {...s20} fill={fill} />;
        case 8:
            return <LabelPairedLaptopMobileCaptionRegularIcon {...s20} fill={fill} />;
        case 9:
            return <LegacyGuide1pxIcon height='18px' width='18px' fill={fill} className='icon-general-fill-g-path' />;
        default:
            return null;
    }
};

const AppWrapper = observer(() => {
    const { connectionStatus } = useApiBase();
    const { dashboard, load_modal, run_panel, quick_strategy, summary_card } = useStore();
    const {
        active_tab,
        active_tour,
        is_chart_modal_visible,
        is_trading_view_modal_visible,
        setActiveTab,
        setWebSocketState,
        setActiveTour,
        setTourDialogVisibility,
    } = dashboard;
    const { dashboard_strategies } = load_modal;
    const {
        is_dialog_open,
        is_drawer_open,
        dialog_options,
        onCancelButtonClick,
        onCloseDialog,
        onOkButtonClick,
        stopBot,
    } = run_panel;
    const { is_open } = quick_strategy;
    const { cancel_button_text, ok_button_text, title, message, dismissable, is_closed_on_cancel } = dialog_options as {
        [key: string]: string;
    };
    const { clear } = summary_card;
    const { DASHBOARD, BOT_BUILDER } = DBOT_TABS;
    const init_render = React.useRef(true);

    const [winWidth, setWinWidth] = useState(window.innerWidth);
    useEffect(() => {
        const handler = () => setWinWidth(window.innerWidth);
        window.addEventListener('resize', handler);
        return () => window.removeEventListener('resize', handler);
    }, []);
    const visibleCount = getVisibleCount(winWidth);

    const [left_tab_shadow, setLeftTabShadow] = useState<boolean>(false);
    const [right_tab_shadow, setRightTabShadow] = useState<boolean>(false);

    const { isDesktop } = useDevice();
    const location = useLocation();
    const navigate = useNavigate();

    const hash = [
        'dashboard',
        'bot_builder',
        'chart',
        'free_bots',
        'exclusive_bots',
        'copy_trader',
        'bulk_trader',
        'analysis_tool',
        'manual_trader',
        'tutorial',
    ];

    let tab_value: number | string = active_tab;
    const GetHashedValue = (tab: number) => {
        tab_value = location.hash?.split('#')[1];
        if (!tab_value) return tab;
        return Number(hash.indexOf(String(tab_value)));
    };
    const active_hash_tab = GetHashedValue(active_tab);

    // ── Tab shadows ───────────────────────────────────────────────────────────
    React.useEffect(() => {
        const el_first = document.getElementById('id-dbot-dashboard');
        const el_last = document.getElementById('id-tutorials');

        const obs_first = new window.IntersectionObserver(([entry]) => setLeftTabShadow(!entry.isIntersecting), {
            root: null,
            threshold: 0.5,
        });
        const obs_last = new window.IntersectionObserver(([entry]) => setRightTabShadow(!entry.isIntersecting), {
            root: null,
            threshold: 0.5,
        });
        if (el_first) obs_first.observe(el_first);
        if (el_last) obs_last.observe(el_last);
        return () => {
            obs_first.disconnect();
            obs_last.disconnect();
        };
    });

    // ── Stop bot on disconnect ────────────────────────────────────────────────
    React.useEffect(() => {
        if (connectionStatus !== CONNECTION_STATUS.OPENED) {
            const is_bot_running = document.getElementById('db-animation__stop-button') !== null;
            if (is_bot_running) {
                clear();
                stopBot();
                api_base.setIsRunning(false);
                setWebSocketState(false);
            }
        }
    }, [clear, connectionStatus, setWebSocketState, stopBot]);

    // ── Tab change side-effects ───────────────────────────────────────────────
    React.useEffect(() => {
        // Update trashcan position after Blockly renders
        const id = setTimeout(() => {
            if (active_tab === BOT_BUILDER && Blockly?.derivWorkspace?.trashcan) {
                const trashcanY = window.innerHeight - 250;
                const trashcanX = is_drawer_open
                    ? isDbotRTL()
                        ? 380
                        : window.innerWidth - 460
                    : isDbotRTL()
                      ? 20
                      : window.innerWidth - 100;
                Blockly?.derivWorkspace?.trashcan?.setTrashcanPosition(trashcanX, trashcanY);
            }
        }, 100);
        return () => clearTimeout(id);
        //eslint-disable-next-line react-hooks/exhaustive-deps
    }, [active_tab, is_drawer_open]);

    React.useEffect(() => {
        if (is_open) setTourDialogVisibility(false);

        if (init_render.current) {
            setActiveTab(Number(active_hash_tab));
            if (!isDesktop) handleTabChange(Number(active_hash_tab));
            init_render.current = false;
        } else {
            navigate(`#${hash[active_tab] || hash[0]}`);
        }
        if (active_tour !== '') setActiveTour('');

        // Prevent body scroll on tutorial tab (mobile only)
        const mainEl = document.querySelector('.main__container');
        if (active_tab === DBOT_TABS.TUTORIAL && !isDesktop) {
            document.body.style.overflow = 'hidden';
            (mainEl as HTMLElement)?.classList.add('no-scroll');
        } else {
            document.body.style.overflow = '';
            (mainEl as HTMLElement)?.classList.remove('no-scroll');
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [active_tab]);

    useEffect(() => {
        let timer: ReturnType<typeof setTimeout>;
        if (dashboard_strategies.length > 0) {
            timer = setTimeout(() => updateWorkspaceName());
        }
        return () => {
            if (timer) clearTimeout(timer);
        };
    }, [dashboard_strategies, active_tab]);

    const handleTabChange = React.useCallback(
        (tab_index: number) => {
            setActiveTab(tab_index);
            const el_id = TAB_IDS[tab_index];
            if (el_id) {
                const el_tab = document.getElementById(el_id);
                setTimeout(() => el_tab?.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' }), 10);
            }
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [active_tab]
    );

    const panel = (idx: number) => (active_tab === idx ? ' bm-tabs__panel--active' : '');

    return (
        <React.Fragment>
            <div className='main'>
                <div
                    className={classNames('main__container', {
                        'main__container--active': active_tour && active_tab === DASHBOARD && !isDesktop,
                    })}
                >
                    {/* ── Tab bar ── */}
                    <div className='main__tab-bar-wrap'>
                        {!isDesktop && left_tab_shadow && <span className='tabs-shadow tabs-shadow--left' />}
                        {!isDesktop && right_tab_shadow && <span className='tabs-shadow tabs-shadow--right' />}

                        <div className='bm-tabs__list' role='tablist'>
                            {TAB_DEFS.slice(0, visibleCount).map((tab, idx) => (
                                <button
                                    key={tab.id}
                                    id={tab.id}
                                    role='tab'
                                    aria-selected={active_tab === idx}
                                    className={`bm-tabs__item${active_tab === idx ? ' bm-tabs__item--active' : ''}`}
                                    onClick={() => handleTabChange(idx)}
                                >
                                    <TabIcon idx={idx} active={active_tab === idx} />
                                    <Localize i18n_default_text={tab.name} />
                                </button>
                            ))}
                            <MoreToolsMenu activeTab={active_tab} onSelect={handleTabChange} />
                        </div>
                    </div>

                    {/* ── Tab content ── */}
                    <div className='bm-tabs__content'>
                        {/* 0 – Dashboard */}
                        <div className={`bm-tabs__panel${panel(0)}`}>
                            <Dashboard handleTabChange={handleTabChange} />
                        </div>

                        {/* 1 – Bot Builder: always in DOM so Blockly can inject into it */}
                        <div id='id-bot-builder' />

                        {/* 2 – Charts */}
                        <div
                            id={
                                is_chart_modal_visible || is_trading_view_modal_visible
                                    ? 'id-charts--disabled'
                                    : 'id-charts'
                            }
                            className={`bm-tabs__panel${panel(2)}`}
                        >
                            <Suspense fallback={<TabLoader message='Loading chart…' />}>
                                <ChartWrapper show_digits_stats={false} />
                            </Suspense>
                        </div>

                        {/* 3 – Free Bots */}
                        <div className={`bm-tabs__panel${panel(3)}`}>
                            <div className='free-bots-wrapper'>
                                <Suspense fallback={<TabLoader message='Loading free bots…' />}>
                                    <FreeBots />
                                </Suspense>
                            </div>
                        </div>

                        {/* 4 – Exclusive Bots */}
                        <div className={`bm-tabs__panel${panel(4)}`}>
                            <div className='exclusive-bots-wrapper'>
                                <Suspense fallback={<TabLoader message='Loading exclusive bots…' />}>
                                    <ExclusiveBots />
                                </Suspense>
                            </div>
                        </div>

                        {/* 5 – Copy Trader */}
                        <div className={`bm-tabs__panel${panel(5)}`}>
                            <div className='copy-trader-wrapper'>
                                <Suspense fallback={<TabLoader message='Loading Copy Trader…' />}>
                                    <CopyTrader />
                                </Suspense>
                            </div>
                        </div>

                        {/* 6 – Bulk Trader */}
                        <div className={`bm-tabs__panel${panel(6)}`}>
                            <div className='bulk-trader-wrapper'>
                                <Suspense fallback={<TabLoader message='Loading Bulk Trader…' />}>
                                    <BulkTrader />
                                </Suspense>
                            </div>
                        </div>

                        {/* 7 – Analysis Tool */}
                        <div className={`bm-tabs__panel${panel(7)}`}>
                            <div className='dcircles-wrapper'>
                                <Suspense fallback={<TabLoader message='Loading Analysis Tool…' />}>
                                    <DCircles />
                                </Suspense>
                            </div>
                        </div>

                        {/* 8 – Manual Trader */}
                        <div className={`bm-tabs__panel${panel(8)}`}>
                            <Suspense fallback={<TabLoader message='Loading Manual Trader…' />}>
                                <ManualTrader />
                            </Suspense>
                        </div>

                        {/* 9 – Tutorials */}
                        <div className={`bm-tabs__panel${panel(9)}`}>
                            <div className='tutorials-wrapper'>
                                <Suspense fallback={<TabLoader message='Loading tutorials…' />}>
                                    <Tutorial handleTabChange={handleTabChange} />
                                </Suspense>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <DesktopWrapper>
                <div className='main__run-strategy-wrapper'>
                    <RunStrategy />
                    <RunPanel />
                </div>
                <ChartModal />
                <TradingViewModal />
            </DesktopWrapper>
            <MobileWrapper>{!is_open && <RunPanel />}</MobileWrapper>
            <AiFab />
            <Dialog
                cancel_button_text={cancel_button_text || localize('Cancel')}
                className='dc-dialog__wrapper--fixed'
                confirm_button_text={ok_button_text || localize('Ok')}
                has_close_icon
                is_mobile_full_width={false}
                is_visible={is_dialog_open}
                onCancel={onCancelButtonClick}
                onClose={onCloseDialog}
                onConfirm={onOkButtonClick || onCloseDialog}
                portal_element_id='modal_root'
                title={title}
                login={() => initiateLogin()}
                dismissable={dismissable}
                is_closed_on_cancel={is_closed_on_cancel}
            >
                {message}
            </Dialog>
        </React.Fragment>
    );
});

export default AppWrapper;
