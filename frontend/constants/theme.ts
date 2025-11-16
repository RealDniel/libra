/**
 * Libra - Debate Training App Theme
 */

import { Platform } from 'react-native';

const tintColorLight = '#0a7ea4';
const tintColorDark = '#fff';

export const Colors = {
  light: {
    text: '#11181C',
    background: '#fff',
    tint: tintColorLight,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: '#ECEDEE',
    background: '#151718',
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
  },
};

// Debate-specific colors - Professional & Modern
export const DebateColors = {
  speaker1: {
    primary: '#4F7EF7',
    secondary: '#6B9BFF',
    gradient: ['#1E3A8A', '#3B5FCC', '#4F7EF7', '#6B9BFF'],
    text: '#FFFFFF',
    glow: 'rgba(79, 126, 247, 0.3)',
  },
  speaker2: {
    primary: '#EF476F',
    secondary: '#FF6B8A',
    gradient: ['#B91C3A', '#D63152', '#EF476F', '#FF6B8A'],
    text: '#FFFFFF',
    glow: 'rgba(239, 71, 111, 0.3)',
  },
  background: {
    primary: '#0A0E1A',
    secondary: '#141927',
    tertiary: '#1E2536',
    card: '#1A2032',
    border: 'rgba(255, 255, 255, 0.08)',
  },
  text: {
    primary: '#FFFFFF',
    secondary: 'rgba(255, 255, 255, 0.7)',
    tertiary: 'rgba(255, 255, 255, 0.5)',
    muted: 'rgba(255, 255, 255, 0.3)',
  },
  status: {
    verified: '#06D6A0',
    true: '#06D6A0',      // Green (same as verified)
    false: '#FF5A5F',
    uncertain: '#FFB400',
    warning: '#FF8C42',
  },
  accent: {
    purple: '#8B5CF6',
    cyan: '#06B6D4',
  },
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
