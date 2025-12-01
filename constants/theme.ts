/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

const tintColorLight = '#6366f1'; // Indigo
const tintColorDark = '#818cf8'; // Light Indigo

export const Colors = {
  light: {
    text: '#1f2937',
    background: '#f9fafb',
    tint: tintColorLight,
    icon: '#6b7280',
    tabIconDefault: '#9ca3af',
    tabIconSelected: tintColorLight,
    card: '#ffffff',
    cardBorder: '#e5e7eb',
    primary: '#6366f1',
    secondary: '#8b5cf6',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    gradient1: '#6366f1',
    gradient2: '#8b5cf6',
    progressBg: '#e0e7ff',
    progressFill: '#6366f1',
  },
  dark: {
    text: '#f3f4f6',
    background: '#111827',
    tint: tintColorDark,
    icon: '#9ca3af',
    tabIconDefault: '#6b7280',
    tabIconSelected: tintColorDark,
    card: '#1f2937',
    cardBorder: '#374151',
    primary: '#818cf8',
    secondary: '#a78bfa',
    success: '#34d399',
    warning: '#fbbf24',
    error: '#f87171',
    gradient1: '#818cf8',
    gradient2: '#a78bfa',
    progressBg: '#312e81',
    progressFill: '#818cf8',
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const BorderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

export const Elevation = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
};

export const FontFamily = {
  regular: 'OpenSans-Regular',
  medium: 'OpenSans-Medium',
  semiBold: 'OpenSans-SemiBold',
  bold: 'OpenSans-Bold',
  extraBold: 'OpenSans-ExtraBold',
  light: 'OpenSans-Light',
  italic: 'OpenSans-Italic',
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
