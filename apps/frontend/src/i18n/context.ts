import { createContext } from 'react';
import type {
  Direction,
  Formatters,
  Locale,
  LocaleMeta,
  Translator,
} from '@zamindar/shared';

export type I18nContextValue = {
  locale: Locale;
  localeMeta: LocaleMeta;
  dir: Direction;
  isRtl: boolean;
  t: Translator;
  format: Formatters;
  setLocale: (locale: Locale) => void;
};

export const I18nContext = createContext<I18nContextValue | null>(null);
