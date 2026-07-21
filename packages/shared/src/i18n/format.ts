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

  const pluralRules = new Intl.PluralRules(intlLocale);

  return {
    number(value, options) {
      return new Intl.NumberFormat(numericLocale, options).format(value);
    },
    currency(value, currency = 'PKR') {
      // Render as "Rs 1,234" style: symbol from a narrow currency format,
      // grouped Latin digits, no forced decimals.
      const formatted = new Intl.NumberFormat(numericLocale, {
        maximumFractionDigits: 2,
      }).format(value);
      const prefix = currency === 'PKR' ? 'Rs' : currency;
      return `${prefix} ${formatted}`;
    },
    date(value, options) {
      return new Intl.DateTimeFormat(numericLocale, {
        ...DEFAULT_DATE_OPTIONS,
        ...options,
      }).format(toDate(value));
    },
    monthYear(month, year) {
      const date = new Date(Date.UTC(year, Math.max(0, month - 1), 1));
      return new Intl.DateTimeFormat(numericLocale, {
        month: 'long',
        year: 'numeric',
        timeZone: 'UTC',
      }).format(date);
    },
    plural(count) {
      return pluralRules.select(count);
    },
  };
}
