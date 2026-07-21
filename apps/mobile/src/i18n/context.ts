import {createContext} from 'react';
import type {
  Formatters,
  Locale,
  LocaleMeta,
  Translator,
} from '@zamindar/shared';

export type I18nContextValue = {
  locale: Locale;
  localeMeta: LocaleMeta;
  t: Translator;
  format: Formatters;
  setLocale: (locale: Locale) => void;
};

export const I18nContext = createContext<I18nContextValue | null>(null);
