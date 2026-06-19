import React from 'react';
import { observer } from 'mobx-react-lite';
import GoogleDrive from '@/components/load-modal/google-drive';
import Dialog from '@/components/shared_ui/dialog';
import MobileFullPageModal from '@/components/shared_ui/mobile-full-page-modal';
import { DBOT_TABS } from '@/constants/bot-contents';
import { useStore } from '@/hooks/useStore';
import {
    DerivLightBotBuilderIcon,
    DerivLightGoogleDriveIcon,
    DerivLightLocalDeviceIcon,
    DerivLightMyComputerIcon,
    DerivLightQuickStrategyIcon,
} from '@deriv/quill-icons/Illustration';
import { Localize, localize } from '@deriv-com/translations';
import { useDevice } from '@deriv-com/ui';
import { rudderStackSendOpenEvent } from '../../analytics/rudderstack-common-events';
import { rudderStackSendDashboardClickEvent } from '../../analytics/rudderstack-dashboard';

type TCardProps = {
    has_dashboard_strategies: boolean;
    is_mobile: boolean;
};

type TCardDef = {
    id: string;
    icon: React.ReactElement;
    label: React.ReactElement;
    desc: string;
    color: string;
    iconBg: string;
    callback: () => void;
};

const ArrowIcon = () => (
    <svg
        width='14'
        height='14'
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

const Cards = observer(({ is_mobile }: TCardProps) => {
    const { dashboard, load_modal, quick_strategy } = useStore();
    const { toggleLoadModal, setActiveTabIndex } = load_modal;
    const { isDesktop } = useDevice();
    const { onCloseDialog, dialog_options, is_dialog_open, setActiveTab, setPreviewOnPopup } = dashboard;
    const { setFormVisibility } = quick_strategy;

    const openGoogleDriveDialog = () => {
        toggleLoadModal();
        setActiveTabIndex(is_mobile ? 1 : 2);
        setActiveTab(DBOT_TABS.BOT_BUILDER);
    };

    const openFileLoader = () => {
        toggleLoadModal();
        setActiveTabIndex(is_mobile ? 0 : 1);
        setActiveTab(DBOT_TABS.BOT_BUILDER);
    };

    const cards: TCardDef[] = [
        {
            id: 'my-computer',
            icon: is_mobile ? (
                <DerivLightLocalDeviceIcon height='28px' width='28px' />
            ) : (
                <DerivLightMyComputerIcon height='28px' width='28px' />
            ),
            label: is_mobile ? <Localize i18n_default_text='Local' /> : <Localize i18n_default_text='My computer' />,
            desc: 'Load a saved bot file from your device',
            color: '#0bc4a6',
            iconBg: 'rgba(11,196,166,0.12)',
            callback: () => {
                openFileLoader();
                rudderStackSendOpenEvent({
                    subpage_name: 'bot_builder',
                    subform_source: 'dashboard',
                    subform_name: 'load_strategy',
                    load_strategy_tab: 'local',
                });
            },
        },
        {
            id: 'google-drive',
            icon: <DerivLightGoogleDriveIcon height='28px' width='28px' />,
            label: <Localize i18n_default_text='Google Drive' />,
            desc: 'Connect and load a bot from Google Drive',
            color: '#3b82f6',
            iconBg: 'rgba(59,130,246,0.12)',
            callback: () => {
                openGoogleDriveDialog();
                rudderStackSendOpenEvent({
                    subpage_name: 'bot_builder',
                    subform_source: 'dashboard',
                    subform_name: 'load_strategy',
                    load_strategy_tab: 'google drive',
                });
            },
        },
        {
            id: 'bot-builder',
            icon: <DerivLightBotBuilderIcon height='28px' width='28px' />,
            label: <Localize i18n_default_text='Bot builder' />,
            desc: 'Build your strategy visually with blocks',
            color: '#a855f7',
            iconBg: 'rgba(168,85,247,0.12)',
            callback: () => {
                setActiveTab(DBOT_TABS.BOT_BUILDER);
                rudderStackSendDashboardClickEvent({
                    dashboard_click_name: 'bot_builder',
                    subpage_name: 'bot_builder',
                });
            },
        },
        {
            id: 'quick-strategy',
            icon: <DerivLightQuickStrategyIcon height='28px' width='28px' />,
            label: <Localize i18n_default_text='Quick strategy' />,
            desc: 'Launch a pre-built strategy in seconds',
            color: '#f59e0b',
            iconBg: 'rgba(245,158,11,0.12)',
            callback: () => {
                setActiveTab(DBOT_TABS.BOT_BUILDER);
                setFormVisibility(true);
                rudderStackSendOpenEvent({
                    subpage_name: 'bot_builder',
                    subform_source: 'dashboard',
                    subform_name: 'quick_strategy',
                });
            },
        },
    ];

    return React.useMemo(
        () => (
            <>
                <div className='db-hero__actions'>
                    {cards.map(({ id, icon, label, desc, color, iconBg, callback }) => (
                        <button
                            key={id}
                            className='db-action-card'
                            style={
                                {
                                    '--db-card-color': color,
                                    '--db-icon-bg': iconBg,
                                } as React.CSSProperties
                            }
                            onClick={callback}
                            aria-label={typeof label === 'string' ? label : id}
                        >
                            <div className='db-action-card__icon-wrap'>{icon}</div>
                            <span className='db-action-card__title'>{label}</span>
                            <span className='db-action-card__desc'>{desc}</span>
                            <span className='db-action-card__arrow'>
                                <ArrowIcon />
                            </span>
                        </button>
                    ))}
                </div>

                {!isDesktop ? (
                    <Dialog
                        title={dialog_options.title}
                        is_visible={is_dialog_open}
                        onCancel={onCloseDialog}
                        is_mobile_full_width
                        className='dc-dialog__wrapper--google-drive'
                        has_close_icon
                    >
                        <GoogleDrive />
                    </Dialog>
                ) : (
                    <MobileFullPageModal
                        is_modal_open={is_dialog_open}
                        className='load-strategy__wrapper'
                        header={localize('Load strategy')}
                        onClickClose={() => {
                            setPreviewOnPopup(false);
                            onCloseDialog();
                        }}
                        height_offset='80px'
                        page_overlay
                    >
                        <div label='Google Drive' className='google-drive-label'>
                            <GoogleDrive />
                        </div>
                    </MobileFullPageModal>
                )}
            </>
        ),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [is_dialog_open]
    );
});

export default Cards;
