import { LOCALES, type Locale } from './locales';

export type Formatters = {
  /** Format a number with locale-aware grouping. */
  number: (value: number, options?: Intl.NumberFormatOptions) => string;
  /** Format an amount as currency (defaults to PKR). */
  currency: (value: number, currency?: string) => string;
  /** Format a date (defaults to a medium, day-month-year style). */
  date: (value: Date | string, options?: Intl.DateTimeFormatOptions) => string;
  /** Format a month + year label (e.g. reports, ledgers). */
  monthYear: (month: number, year: number) => string;
  /** Pick a plural category for a count using CLDR rules. */
  plural: (count: number) => Intl.LDMLPluralRule;
};

const DEFAULT_DATE_OPTIONS: Intl.DateTimeFormatOptions = {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
};

function toDate(value: Date | string): Date {
  return value instanceof Date ? value : new Date(value);
}

/**
 * Build a set of Intl-based formatters bound to a locale. Numbers, currency and
 * dates all follow the locale so switching language also localises formatting.
 *
 * Urdu uses Western (Latin) digits here for consistency with the ledgers and
 * data-entry forms, which stay in Latin digits across the app.
 */
export function createFormatters(locale: Locale): Formatters {
  const { intlLocale } = LOCALES[locale];
  const numericLocale = `${intlLocale}-u-nu-latn`;

  return {
    number(value, options) {
      return safeNumber(numericLocale, value, options);
    },
    currency(value, currency = 'PKR') {
      // Render as "Rs 1,234": grouped Latin digits, no forced decimals.
      const formatted = safeNumber(numericLocale, value, {
        maximumFractionDigits: 2,
      });
      const prefix = currency === 'PKR' ? 'Rs' : currency;
      return `${prefix} ${formatted}`;
    },
    date(value, options) {
      return safeDate(numericLocale, toDate(value), {
        ...DEFAULT_DATE_OPTIONS,
        ...options,
      });
    },
    monthYear(month, year) {
      const date = new Date(Date.UTC(year, Math.max(0, month - 1), 1));
      return safeDate(numericLocale, date, {
        month: 'long',
        year: 'numeric',
        timeZone: 'UTC',
      });
    },
    plural(count) {
      try {
        return new Intl.PluralRules(intlLocale).select(count);
      } catch {
        return count === 1 ? 'one' : 'other';
      }
    },
  };
}

/**
 * React Native's Hermes engine ships a reduced Intl implementation, and some
 * builds omit it entirely. These wrappers fall back to plain formatting rather
 * than throwing, so the same shared code runs on web and mobile.
 */
function safeNumber(
  locale: string,
  value: number,
  options?: Intl.NumberFormatOptions,
): string {
  try {
    return new Intl.NumberFormat(locale, options).format(value);
  } catch {
    // Group thousands manually so amounts stay readable.
    const [whole, fraction] = String(value).split('.');
    const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return fraction ? `${grouped}.${fraction}` : grouped;
  }
}

const SHORT_MONTHS = [
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

function safeDate(
  locale: string,
  date: Date,
  options: Intl.DateTimeFormatOptions,
): string {
  try {
    return new Intl.DateTimeFormat(locale, options).format(date);
  } catch {
    const day = String(date.getUTCDate()).padStart(2, '0');
    const month = SHORT_MONTHS[date.getUTCMonth()] ?? '';
    const year = date.getUTCFullYear();
    return options.day === undefined
      ? `${month} ${year}`
      : `${day} ${month} ${year}`;
  }
}
