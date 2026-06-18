import React from 'react';
import classNames from 'classnames';
import { observer } from 'mobx-react-lite';
import Modal from '@/components/shared_ui/modal';
import { DBOT_TABS } from '@/constants/bot-contents';
import useIsTNCNeeded from '@/hooks/useIsTNCNeeded';
import { useStore } from '@/hooks/useStore';
import { LegacyClose1pxIcon } from '@deriv/quill-icons/Legacy';
import { useDevice } from '@deriv-com/ui';
import { SIDEBAR_INTRO } from './constants';
import './info-panel.scss';

const InfoPanel = observer(() => {
    const { isDesktop } = useDevice();
    const { dashboard } = useStore();
    const is_tnc_needed = useIsTNCNeeded();
    const [is_tour_open, setIsTourOpen] = React.useState(false);

    const {
        active_tour,
        is_info_panel_visible,
        setActiveTab,
        setActiveTabTutorial,
        setInfoPanelVisibility,
        setFaqTitle,
    } = dashboard;

    const switchTab = (link: boolean, label: string, faq_id: string) => {
        const tutorial_link = link ? setActiveTab(DBOT_TABS.TUTORIAL) : null;
        const tutorial_label = label === 'Guide' ? setActiveTabTutorial(0) : setActiveTabTutorial(1);
        setFaqTitle(faq_id);
        return { tutorial_link, tutorial_label };
    };

    const handleClose = () => {
        setInfoPanelVisibility(false);
        setIsTourOpen(false);
        localStorage.setItem('dbot_should_show_info', JSON.stringify(Date.now()));
    };

    React.useEffect(() => {
        if (is_tnc_needed) {
            setIsTourOpen(false);
        } else {
            setIsTourOpen(is_info_panel_visible);
        }
    }, [is_tnc_needed, is_info_panel_visible]);

    const renderInfo = () => {
        const [intro, guide, faqs] = SIDEBAR_INTRO();

        return (
            <div className='db-info-panel'>
                <button
                    data-testid='close-icon'
                    className='db-info-panel__close'
                    onClick={handleClose}
                    aria-label='Close'
                >
                    <LegacyClose1pxIcon height='16px' width='16px' />
                </button>

                {/* ── Hero ── */}
                <div className='db-info-panel__hero'>
                    <div className='db-info-panel__hero-icon'>
                        <svg
                            viewBox='0 0 24 24'
                            fill='none'
                            stroke='#10B981'
                            strokeWidth='1.75'
                            strokeLinecap='round'
                            strokeLinejoin='round'
                        >
                            <rect x='3' y='8' width='18' height='13' rx='2' />
                            <path d='M8 8V6a4 4 0 0 1 8 0v2' />
                            <circle cx='9' cy='14' r='1' fill='#10B981' stroke='none' />
                            <circle cx='15' cy='14' r='1' fill='#10B981' stroke='none' />
                            <path d='M9 18h6' />
                        </svg>
                    </div>
                    <h2 className='db-info-panel__title'>{intro.label}</h2>
                    {intro.content.map(item => (
                        <p key={item.data} className='db-info-panel__subtitle'>
                            {item.data}
                        </p>
                    ))}
                </div>

                {/* ── Guide ── */}
                <div className='db-info-panel__section'>
                    <p className='db-info-panel__section-label'>{guide.label}</p>
                    {guide.content.map(item => (
                        <button
                            key={item.data}
                            className='db-info-panel__guide-card'
                            onClick={() => switchTab(guide.link, guide.label, item.faq_id ?? '')}
                        >
                            <span className='db-info-panel__guide-icon'>
                                <svg
                                    viewBox='0 0 24 24'
                                    fill='none'
                                    stroke='currentColor'
                                    strokeWidth='2'
                                    strokeLinecap='round'
                                    strokeLinejoin='round'
                                >
                                    <path d='M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z' />
                                    <polyline points='14 2 14 8 20 8' />
                                    <line x1='9' y1='13' x2='15' y2='13' />
                                    <line x1='9' y1='17' x2='13' y2='17' />
                                </svg>
                            </span>
                            <span className='db-info-panel__guide-text'>{item.data}</span>
                            <span className='db-info-panel__guide-arrow'>
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
                                    <polyline points='9 18 15 12 9 6' />
                                </svg>
                            </span>
                        </button>
                    ))}
                </div>

                {/* ── FAQs ── */}
                <div className='db-info-panel__section'>
                    <p className='db-info-panel__section-label'>{faqs.label}</p>
                    <ul className='db-info-panel__faq-list'>
                        {faqs.content.map((item, i) => (
                            <li key={item.faq_id}>
                                <button
                                    className='db-info-panel__faq-item'
                                    onClick={() => switchTab(faqs.link, faqs.label, item.faq_id ?? '')}
                                >
                                    <span className='db-info-panel__faq-num'>{i + 1}</span>
                                    <span className='db-info-panel__faq-text'>{item.data}</span>
                                    <span className='db-info-panel__faq-arrow'>
                                        <svg
                                            width='14'
                                            height='14'
                                            viewBox='0 0 24 24'
                                            fill='none'
                                            stroke='currentColor'
                                            strokeWidth='2'
                                            strokeLinecap='round'
                                            strokeLinejoin='round'
                                        >
                                            <polyline points='9 18 15 12 9 6' />
                                        </svg>
                                    </span>
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        );
    };

    return isDesktop ? (
        !active_tour && (
            <div
                className={classNames('tab__dashboard__info-panel', {
                    'tab__dashboard__info-panel--active': is_info_panel_visible,
                })}
            >
                {renderInfo()}
            </div>
        )
    ) : (
        <Modal
            className='statistics__modal statistics__modal--mobile'
            is_open={is_tour_open}
            toggleModal={handleClose}
            width={'440px'}
        >
            <Modal.Body>{renderInfo()}</Modal.Body>
        </Modal>
    );
});

export default InfoPanel;
