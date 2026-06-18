const lightMode = () => {
    const workspace = Blockly;
    workspace.Colours.RootBlock = {
        colour: '#064e72',
        colourSecondary: '#064e72',
        colourTertiary: '#6d7278',
    };

    workspace.Colours.Base = {
        colour: '#e5e5e5',
        colourSecondary: '#ffffff',
        colourTertiary: '#6d7278',
    };

    workspace.Colours.Special1 = {
        colour: '#e5e5e5',
        colourSecondary: '#ffffff',
        colourTertiary: '#6d7278',
    };

    workspace.Colours.Special2 = {
        colour: '#e5e5e5',
        colourSecondary: '#ffffff',
        colourTertiary: '#6d7278',
    };

    workspace.Colours.Special3 = {
        colour: '#e5e5e5',
        colourSecondary: '#ffffff',
        colourTertiary: '#6d7278',
    };

    workspace.Colours.Special4 = {
        colour: '#e5e5e5',
        colourSecondary: '#000000',
        colourTertiary: '#0e0e0e',
    };
};

const darkMode = () => {
    const workspace = Blockly;
    workspace.Colours.RootBlock = {
        colour: '#0bc4a6',
        colourSecondary: '#089c83',
        colourTertiary: '#242424',
    };

    workspace.Colours.Base = {
        colour: '#161616',
        colourSecondary: '#0d0d0d',
        colourTertiary: '#242424',
    };

    workspace.Colours.Special1 = {
        colour: '#161616',
        colourSecondary: '#0d0d0d',
        colourTertiary: '#242424',
    };

    workspace.Colours.Special2 = {
        colour: '#161616',
        colourSecondary: '#0d0d0d',
        colourTertiary: '#242424',
    };

    workspace.Colours.Special3 = {
        colour: '#161616',
        colourSecondary: '#0d0d0d',
        colourTertiary: '#7625a8',
    };

    workspace.Colours.Special4 = {
        colour: '#161616',
        colourSecondary: '#000000',
        colourTertiary: '#0d0d0d',
    };
};

export const setColors = isDarkMode => {
    const body = document.querySelector('body');
    const isBossMillan = body?.classList.contains('theme--bossmillan');
    if (isDarkMode || isBossMillan) {
        darkMode();
    } else {
        lightMode();
    }
};
