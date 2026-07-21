import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
import {I18nContext, type I18nContextValue} from './context';

const LOCALE_STORAGE_KEY = 'zamindar-plus-locale';

/**
 * Mobile counterpart of the web provider. It reads the same shared catalogs so
 * both apps stay in step, and persists the choice with AsyncStorage.
 */
export function I18nProvider({children}: {children: ReactNode}) {
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);
  const [catalogs, setCatalogs] = useState<Partial<Record<Locale, Messages>>>({
    en,
  });

  const catalog = catalogs[locale] ?? en;

  // Restore the saved language on launch.
  useEffect(() => {
    let cancelled = false;
    AsyncStorage.getItem(LOCALE_STORAGE_KEY).then(stored => {
      if (!cancelled && stored) {
        setLocaleState(normalizeLocale(stored));
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Load (and cache) the active catalog; English is bundled.
  useEffect(() => {
    if (catalogs[locale]) {
      return;
    }
    let cancelled = false;
    loadCatalog(locale).then(loaded => {
      if (!cancelled) {
        setCatalogs(current => ({...current, [locale]: loaded}));
      }
    });
    return () => {
      cancelled = true;
    };
  }, [locale, catalogs]);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(current => {
      if (current === next) {
        return current;
      }
      AsyncStorage.setItem(LOCALE_STORAGE_KEY, next).catch(() => {});
      return next;
    });
  }, []);

  const value = useMemo<I18nContextValue>(
    () => ({
      locale,
      localeMeta: LOCALES[locale],
      t: createTranslator(catalog, en),
      format: createFormatters(locale),
      setLocale,
    }),
    [locale, catalog, setLocale],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}
