import React from 'react';
import classNames from 'classnames';
import { observer } from 'mobx-react-lite';
import { useStore } from '@/hooks/useStore';
import { useDevice } from '@deriv-com/ui';
import OnboardTourHandler from '../tutorials/dbot-tours/onboarding-tour';
import DashboardBotList from './bot-list/dashboard-bot-list';
import Announcements from './announcements';
import Cards from './cards';
import InfoPanel from './info-panel';

type TMobileIconGuide = {
    handleTabChange: (active_number: number) => void;
};

const DashboardComponent = observer(({ handleTabChange }: TMobileIconGuide) => {
    const { load_modal, dashboard, client } = useStore();
    const { dashboard_strategies } = load_modal;
    const { active_tab, active_tour } = dashboard;
    const has_dashboard_strategies = !!dashboard_strategies?.length;
    const { isDesktop, isTablet } = useDevice();

    return (
        <React.Fragment>
            <div
                className={classNames('db-dashboard', {
                    'db-dashboard--tour-active': active_tour,
                })}
            >
                <div className='db-dashboard__scroll'>
                    {client.is_logged_in && (
                        <Announcements is_mobile={!isDesktop} is_tablet={isTablet} handleTabChange={handleTabChange} />
                    )}

                    {/* ── Hero ── */}
                    <section className='db-hero'>
                        <div className='db-hero__brand'>
                            <img src='/assets/images/bossmillan-logo.jpeg' alt='BossMillan' className='db-hero__logo' />
                            <h1 className='db-hero__title'>Automate Your Trading</h1>
                            <p className='db-hero__sub'>
                                Build, import, or deploy a bot — no code required. Trade smarter with BossMillan.
                            </p>
                            <div className='db-hero__pills'>
                                <span className='db-hero__pill'>AI-Powered</span>
                                <span className='db-hero__pill'>No Code</span>
                                <span className='db-hero__pill'>10+ Strategies</span>
                            </div>
                        </div>

                        <Cards has_dashboard_strategies={has_dashboard_strategies} is_mobile={!isDesktop} />
                    </section>

                    {/* ── Bot list ── */}
                    {has_dashboard_strategies && (
                        <section className='db-bots'>
                            <div className='db-bots__head'>
                                <span className='db-bots__title'>Your bots</span>
                                <span className='db-bots__count'>{dashboard_strategies.length}</span>
                            </div>
                            <DashboardBotList />
                        </section>
                    )}
                </div>

                <InfoPanel />
            </div>

            {active_tab === 0 && <OnboardTourHandler is_mobile={!isDesktop} />}
        </React.Fragment>
    );
});

export default DashboardComponent;
