import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  createFormatters,
  createTranslator,
  DEFAULT_LOCALE,
  en,
  loadCatalog,
  LOCALES,
  normalizeLocale,
  type Locale,
  type Messages,
} from '@zamindar/shared';
import { I18nContext, type I18nContextValue } from './context';

const LOCALE_STORAGE_KEY = 'zamindar-plus-locale';

function readStoredLocale(): Locale {
  if (typeof window === 'undefined') {
    return DEFAULT_LOCALE;
  }
  return normalizeLocale(window.localStorage.getItem(LOCALE_STORAGE_KEY));
}

function applyDocumentLocale(locale: Locale) {
  if (typeof document === 'undefined') {
    return;
  }
  const meta = LOCALES[locale];
  const root = document.documentElement;
  root.lang = meta.htmlLang;
  root.dir = meta.dir;
  root.dataset.locale = locale;
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(readStoredLocale);
  // English is bundled; other catalogs are lazy-loaded and cached here.
  const [catalogs, setCatalogs] = useState<Partial<Record<Locale, Messages>>>({
    en,
  });

  const catalog = catalogs[locale] ?? en;

  useEffect(() => {
    applyDocumentLocale(locale);
  }, [locale]);

  // Lazily load the active catalog. setState only runs inside the async
  // resolution, never synchronously, and is skipped once cached.
  useEffect(() => {
    if (catalogs[locale]) {
      return;
    }
    let cancelled = false;
    void loadCatalog(locale).then((loaded) => {
      if (!cancelled) {
        setCatalogs((current) => ({ ...current, [locale]: loaded }));
      }
    });
    return () => {
      cancelled = true;
    };
  }, [locale, catalogs]);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState((current) => {
      if (current === next) {
        return current;
      }
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(LOCALE_STORAGE_KEY, next);
      }
      applyDocumentLocale(next);
      return next;
    });
  }, []);

  const value = useMemo<I18nContextValue>(() => {
    const meta = LOCALES[locale];
    return {
      locale,
      localeMeta: meta,
      dir: meta.dir,
      isRtl: meta.dir === 'rtl',
      t: createTranslator(catalog, en),
      format: createFormatters(locale),
      setLocale,
    };
  }, [locale, catalog, setLocale]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}
