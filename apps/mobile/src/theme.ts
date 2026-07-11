/**
 * Design system ported from the Zamindar Plus website (apps/frontend App.css).
 * Light, airy, frosted-white surfaces with a green -> cyan gradient identity,
 * heavy type weights, consistent 8px radii, and soft elevation.
 */
import {TextStyle, ViewStyle} from 'react-native';

export const palette = {
  // Ink / text
  ink: '#10211D',
  inkSoft: '#1E2B25',
  muted: '#60716B',
  mutedSoft: '#75847F',

  // Lines / surfaces
  line: 'rgba(100,121,114,0.20)',
  lineStrong: 'rgba(100,121,114,0.32)',
  hairline: 'rgba(100,121,114,0.14)',
  pageBg: '#F2F7F2',
  pageBgAlt: '#EEF6F4',
  surface: '#FFFFFF',
  panel: 'rgba(255,255,255,0.94)',
  soft: '#F7FAF8',
  softStrong: '#EEF7F2',

  // Brand accents (from the site's CSS variables)
  green: '#17784F',
  greenBright: '#24B57C',
  greenSoft: '#E6F6ED',
  greenInk: '#146643',
  cyan: '#168BA0',
  cyanSoft: '#E5F5F8',
  amber: '#D89432',
  amberSoft: '#FFF4DE',
  amberInk: '#996317',
  rose: '#B84455',
  roseSoft: '#FFF0F2',
  roseInk: '#983245',
  blue: '#3D6EB7',
  blueSoft: '#EDF3FF',
  violet: '#7257B5',
  violetSoft: '#F4F0FF',

  // Dark surfaces used for the hero / nav accents
  night: '#10231F',
  night2: '#15322C',

  white: '#FFFFFF',
  black: '#000000',
  onDark: '#F7FFF9',
};

/** Gradient stop arrays (use with react-native-svg / custom gradient views). */
export const gradients = {
  primary: ['#17784F', '#168BA0'] as const, // green -> cyan (brand)
  brand: ['#24B57C', '#168BA0'] as const,
  ready: ['#0F8458', '#13A6AE', '#D89432'] as const,
  summaryBar: ['#17784F', '#168BA0', '#D89432'] as const,
  income: ['#17784F', '#55C48D'] as const,
  expense: ['#B84455', '#EE8795'] as const,
  profit: ['#168BA0', '#5FC4D4'] as const,
  hero: ['rgba(13,31,28,0.92)', 'rgba(21,65,53,0.58)'] as const,
  orbit: ['#83E3B9', '#F1B457', '#168BA0', '#83E3B9'] as const,
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 40,
} as const;

export const radius = {
  sm: 8,
  md: 8,
  lg: 12,
  xl: 16,
  pill: 999,
} as const;

export const typography = {
  display: {fontSize: 34, lineHeight: 38, fontWeight: '800', letterSpacing: -0.4},
  h1: {fontSize: 28, lineHeight: 32, fontWeight: '800', letterSpacing: -0.3},
  h2: {fontSize: 22, lineHeight: 27, fontWeight: '800', letterSpacing: -0.2},
  h3: {fontSize: 18, lineHeight: 23, fontWeight: '800'},
  numeric: {fontSize: 28, lineHeight: 32, fontWeight: '800', letterSpacing: -0.5},
  bodyStrong: {fontSize: 15, lineHeight: 22, fontWeight: '700'},
  body: {fontSize: 15, lineHeight: 22, fontWeight: '500'},
  small: {fontSize: 13, lineHeight: 18, fontWeight: '700'},
  label: {fontSize: 11, lineHeight: 14, fontWeight: '900', letterSpacing: 0.4},
  caption: {fontSize: 11, lineHeight: 15, fontWeight: '800', letterSpacing: 0.3},
} satisfies Record<string, TextStyle>;

export const shadow = {
  card: {
    shadowColor: '#16211D',
    shadowOpacity: 0.1,
    shadowRadius: 22,
    shadowOffset: {width: 0, height: 14},
    elevation: 3,
  },
  soft: {
    shadowColor: '#16211D',
    shadowOpacity: 0.07,
    shadowRadius: 14,
    shadowOffset: {width: 0, height: 8},
    elevation: 2,
  },
  floating: {
    shadowColor: '#16211D',
    shadowOpacity: 0.16,
    shadowRadius: 30,
    shadowOffset: {width: 0, height: 18},
    elevation: 8,
  },
  brand: {
    shadowColor: '#168BA0',
    shadowOpacity: 0.28,
    shadowRadius: 20,
    shadowOffset: {width: 0, height: 12},
    elevation: 6,
  },
} satisfies Record<string, ViewStyle>;

export const theme = {
  colors: {
    background: palette.pageBg,
    backgroundAlt: palette.pageBgAlt,
    surface: palette.surface,
    surfaceAlt: palette.soft,
    card: palette.surface,
    panel: palette.panel,
    soft: palette.soft,
    softStrong: palette.softStrong,
    border: palette.line,
    borderStrong: palette.lineStrong,
    hairline: palette.hairline,

    primary: palette.green,
    primaryBright: palette.greenBright,
    cyan: palette.cyan,
    accent: palette.amber,

    // money / entity tones
    income: palette.green,
    expense: palette.rose,
    profit: palette.cyan,
    land: palette.amber,
    crop: palette.blue,
    activity: palette.violet,

    success: palette.green,
    successInk: palette.greenInk,
    danger: palette.rose,
    dangerInk: palette.roseInk,
    warning: palette.amber,
    warningInk: palette.amberInk,

    text: palette.ink,
    textSecondary: palette.muted,
    textMuted: palette.mutedSoft,
    onPrimary: '#FFFFFF',
    onDark: palette.onDark,

    night: palette.night,
    night2: palette.night2,
    overlay: 'rgba(16,33,29,0.45)',
    scrim: 'rgba(16,33,29,0.28)',
  },
  gradients,
  spacing,
  radius,
  typography,
  shadow,
  palette,
} as const;

export type Theme = typeof theme;
export const useTheme = () => theme;
