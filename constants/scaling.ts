import { Dimensions } from 'react-native';

export const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Design based on iPhone 13 resolution
const BASE_WIDTH = 390;
const BASE_HEIGHT = 844;

const scaleWidth = SCREEN_WIDTH / BASE_WIDTH;
const scaleHeight = SCREEN_HEIGHT / BASE_HEIGHT;
const scale = Math.min(scaleWidth, scaleHeight);

// Function to scale sizes
export const scaleSize = (size: number) => Math.round(size * scale);

// Font sizes
export const FONT_SIZE = {
    xs: scaleSize(10),
    sm: scaleSize(12),
    md: scaleSize(14),
    lg: scaleSize(16),
    xl: scaleSize(18),
    xxl: scaleSize(20),
    xxxl: scaleSize(24),
    display: scaleSize(32),
    hero: scaleSize(48),
    largeTitle: scaleSize(56),
};

// Spacing
export const SPACING = {
    xs: scaleSize(4),
    sm: scaleSize(8),
    md: scaleSize(12),
    lg: scaleSize(16),
    xl: scaleSize(20),
    xxl: scaleSize(24),
    xxxl: scaleSize(32),
    screenPadding: scaleSize(20), // Side padding for screens
};

// Border radius
export const RADIUS = {
    xs: scaleSize(4),
    sm: scaleSize(8),
    md: scaleSize(12),
    lg: scaleSize(16),
    xl: scaleSize(20),
    xxl: scaleSize(24),
    rounded: scaleSize(100),
};

// Icon sizes
export const ICON_SIZE = {
    xs: scaleSize(12),
    sm: scaleSize(16),
    md: scaleSize(20),
    lg: scaleSize(24),
    xl: scaleSize(32),
    xxl: scaleSize(40),
    xxxl: scaleSize(48),
};

// Component sizes
export const COMPONENT_SIZE = {
    buttonHeight: scaleSize(48),
    buttonHeightSm: scaleSize(40),
    buttonHeightLg: scaleSize(56),
    inputHeight: scaleSize(52),
    headerHeight: scaleSize(56),
    avatarSm: scaleSize(32),
    avatarMd: scaleSize(48),
    avatarLg: scaleSize(64),
    cardMinHeight: scaleSize(120),
    fabSize: scaleSize(56),
    appIconSize: scaleSize(44),
    touchableMin: scaleSize(44), // Minimum touch target
    iconButtonSize: scaleSize(44),
};
