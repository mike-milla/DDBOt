type TTabsTitle = {
    [key: string]: string | number;
};

type TDashboardTabIndex = {
    [key: string]: number;
};

export const tabs_title: TTabsTitle = Object.freeze({
    WORKSPACE: 'Workspace',
    CHART: 'Chart',
});

export const DBOT_TABS: TDashboardTabIndex = Object.freeze({
    DASHBOARD: 0,
    BOT_BUILDER: 1,
    CHART: 2,
    TUTORIAL: 3,
    FREE_BOTS: 4,
    EXCLUSIVE_BOTS: 5,
    COPY_TRADER: 6,
    BULK_TRADER: 7,
    ANALYSIS_TOOL: 8,
    DCIRCLES: 9,
    MANUAL_TRADER: 10,
});

export const MAX_STRATEGIES = 10;

export const TAB_IDS = [
    'id-dbot-dashboard',
    'id-bot-builder',
    'id-charts',
    'id-tutorials',
    'id-free-bots',
    'id-exclusive-bots',
    'id-copy-trader',
    'id-bulk-trader',
    'id-analysis-tool',
    'id-dcircles',
    'id-manual-trader',
];

export const DEBOUNCE_INTERVAL_TIME = 500;
