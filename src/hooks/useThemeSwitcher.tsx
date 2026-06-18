import { useCallback } from 'react';
import { useStore } from './useStore';

const useThemeSwitcher = () => {
    const { ui } = useStore() ?? {
        ui: {
            setDarkMode: () => {},
            is_dark_mode_on: false,
        },
    };
    const { setDarkMode, is_dark_mode_on } = ui;

    const toggleTheme = useCallback(() => {
        const body = document.querySelector('body');
        if (!body) return;
        const isDark = body.classList.contains('theme--bossmillan') || body.classList.contains('theme--dark');
        if (isDark) {
            body.classList.remove('theme--bossmillan', 'theme--dark');
            body.classList.add('theme--light');
            setDarkMode(false);
        } else {
            body.classList.remove('theme--light');
            body.classList.add('theme--bossmillan');
            setDarkMode(true);
        }
    }, [setDarkMode]);

    return {
        toggleTheme,
        is_dark_mode_on,
        setDarkMode,
    };
};

export default useThemeSwitcher;
