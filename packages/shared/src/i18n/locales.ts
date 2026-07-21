export const LOCALE_CODES = ['en', 'ur', 'roman'] as const;

export type Locale = (typeof LOCALE_CODES)[number];

export const DEFAULT_LOCALE: Locale = 'en';

export type Direction = 'ltr' | 'rtl';

export type LocaleMeta = {
  /** Internal code used in storage, URLs and the API. */
  code: Locale;
  /** English name of the language. */
  label: string;
  /** The language written in its own script. */
  nativeLabel: string;
  /** Short endonym shown in compact switchers. */
  shortLabel: string;
  /** Text direction for the language. */
  dir: Direction;
  /** BCP-47 tag used for `lang` attributes and Intl formatting. */
  htmlLang: string;
  /** Intl locale used for date / number / currency formatting. */
  intlLocale: string;
};

export const LOCALES: Record<Locale, LocaleMeta> = {
  en: {
    code: 'en',
    label: 'English',
    nativeLabel: 'English',
    shortLabel: 'EN',
    dir: 'ltr',
    htmlLang: 'en',
    intlLocale: 'en-PK',
  },
  ur: {
    code: 'ur',
    label: 'Urdu',
    nativeLabel: 'اردو',
    shortLabel: 'اردو',
    dir: 'rtl',
    htmlLang: 'ur',
    intlLocale: 'ur-PK',
  },
  roman: {
    code: 'roman',
    label: 'Roman Urdu',
    nativeLabel: 'Roman Urdu',
    shortLabel: 'Roman',
    dir: 'ltr',
    // Roman Urdu has no BCP-47 tag; render Latin glyphs but keep PK formatting.
    htmlLang: 'en',
    intlLocale: 'en-PK',
  },
};

export const LOCALE_LIST: LocaleMeta[] = LOCALE_CODES.map((code) => LOCALES[code]);

export function isLocale(value: unknown): value is Locale {
  return (
    typeof value === 'string' && (LOCALE_CODES as readonly string[]).includes(value)
  );
}

/**
 * Map a stored `preferredLanguage` (from the user profile / older builds) to a
 * runtime locale. Keeps backward compatibility with the earlier
 * English / Urdu / Punjabi dropdown.
 */
export function normalizeLocale(value: unknown): Locale {
  if (isLocale(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (normalized === 'english') return 'en';
    if (normalized === 'urdu' || normalized === 'اردو') return 'ur';
    if (
      normalized === 'roman urdu' ||
      normalized === 'roman' ||
      normalized === 'romanurdu'
    ) {
      return 'roman';
    }
  }

  return DEFAULT_LOCALE;
}

/** The label stored in the user's `preferredLanguage` column for a locale. */
export function localeToPreferredLanguage(locale: Locale): string {
  switch (locale) {
    case 'ur':
      return 'Urdu';
    case 'roman':
      return 'Roman Urdu';
    default:
      return 'English';
  }
}
