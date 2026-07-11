/**
 * "Harvest Ledger" design system.
 *
 * A dark-first, green-tinted premium palette for an agriculture ledger app:
 * Zamindar green as the brand, warm gold as the harvest accent, and a
 * semantic income-green / expense-brick split for money movement.
 */
import {TextStyle, ViewStyle} from 'react-native';

export const palette = {
  // Brand greens
  green900: '#04241A',
  green800: '#064A34',
  green700: '#0B6E4F', // Zamindar Green (primary)
  green600: '#0E8A62',
  green500: '#12A46B',
  green400: '#34C186',
  green300: '#5FD6A2',

  // Harvest accents
  gold: '#E8B84B',
  goldSoft: '#F5CF6B',
  wheat: '#D8A24A',

  // Money semantics
  income: '#2FBF71',
  incomeSoft: '#34D399',
  expense: '#E9573F',
  expenseSoft: '#F97362',

  // Surfaces (near-black, green tinted)
  bg: '#07120E',
  surface: '#0D1B15',
  surfaceAlt: '#11241C',
  card: '#112019',
  cardElevated: '#16291F',
  border: '#22362C',
  hairline: 'rgba(255,255,255,0.07)',

  // Text
  textPrimary: '#F1F6F2',
  textSecondary: '#A6B8AD',
  textMuted: '#6C8177',
  onPrimary: '#FFFFFF',

  overlay: 'rgba(2,7,5,0.62)',
  scrim: 'rgba(0,0,0,0.4)',
  white: '#FFFFFF',
  black: '#000000',
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
  sm: 10,
  md: 14,
  lg: 20,
  xl: 26,
  pill: 999,
} as const;

export const typography = {
  display: {fontSize: 34, lineHeight: 40, fontWeight: '800', letterSpacing: 0.2},
  h1: {fontSize: 27, lineHeight: 33, fontWeight: '800', letterSpacing: 0.2},
  h2: {fontSize: 22, lineHeight: 28, fontWeight: '700'},
  h3: {fontSize: 18, lineHeight: 24, fontWeight: '700'},
  bodyStrong: {fontSize: 15, lineHeight: 22, fontWeight: '600'},
  body: {fontSize: 15, lineHeight: 22, fontWeight: '400'},
  small: {fontSize: 13, lineHeight: 18, fontWeight: '500'},
  caption: {fontSize: 11, lineHeight: 15, fontWeight: '600', letterSpacing: 0.6},
  numeric: {fontSize: 22, lineHeight: 26, fontWeight: '800', letterSpacing: 0.3},
} satisfies Record<string, TextStyle>;

export const shadow = {
  card: {
    shadowColor: '#000000',
    shadowOpacity: 0.28,
    shadowRadius: 14,
    shadowOffset: {width: 0, height: 8},
    elevation: 6,
  },
  floating: {
    shadowColor: '#000000',
    shadowOpacity: 0.38,
    shadowRadius: 20,
    shadowOffset: {width: 0, height: 12},
    elevation: 12,
  },
  glow: {
    shadowColor: palette.green500,
    shadowOpacity: 0.5,
    shadowRadius: 18,
    shadowOffset: {width: 0, height: 6},
    elevation: 10,
  },
} satisfies Record<string, ViewStyle>;

export const theme = {
  colors: {
    background: palette.bg,
    surface: palette.surface,
    surfaceAlt: palette.surfaceAlt,
    card: palette.card,
    cardElevated: palette.cardElevated,
    border: palette.border,
    hairline: palette.hairline,

    primary: palette.green700,
    primaryBright: palette.green500,
    primaryDim: palette.green800,
    accent: palette.gold,
    accentSoft: palette.goldSoft,

    income: palette.income,
    expense: palette.expense,
    success: palette.income,
    danger: palette.expense,
    warning: palette.gold,

    text: palette.textPrimary,
    textSecondary: palette.textSecondary,
    textMuted: palette.textMuted,
    onPrimary: palette.onPrimary,

    overlay: palette.overlay,
    scrim: palette.scrim,
  },
  spacing,
  radius,
  typography,
  shadow,
  palette,
} as const;

export type Theme = typeof theme;

export const useTheme = () => theme;
