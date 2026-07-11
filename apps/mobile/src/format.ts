/**
 * Formatting helpers. Currency/date/area logic is re-exported from domain.ts so
 * there is one source of truth shared with the parity-critical form code.
 */
export {
  formatCurrency,
  formatDate,
  parseDisplayDate,
  todayDisplayDate,
  toSquareFeet,
} from './domain';

const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

const MONTHS_LONG = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export function monthName(month: number, long = false) {
  const index = Math.max(0, Math.min(11, month - 1));
  return (long ? MONTHS_LONG : MONTHS)[index];
}

export function formatArea(value: number, unit: string) {
  const rounded = Math.round(value * 100) / 100;
  return `${rounded.toLocaleString()} ${unit}`;
}

/** 12345 -> "12.3K", 2500000 -> "2.5M" — for compact stat tiles. */
export function compactNumber(value = 0) {
  const abs = Math.abs(value);
  if (abs >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
  }
  if (abs >= 1_000) {
    return `${(value / 1_000).toFixed(1).replace(/\.0$/, '')}K`;
  }
  return `${Math.round(value)}`;
}

export function compactCurrency(value = 0) {
  return `Rs ${compactNumber(value)}`;
}

export function initialsOf(firstName?: string | null, lastName?: string | null) {
  const a = (firstName ?? '').trim().charAt(0);
  const b = (lastName ?? '').trim().charAt(0);
  return `${a}${b}`.toUpperCase() || 'ZP';
}
