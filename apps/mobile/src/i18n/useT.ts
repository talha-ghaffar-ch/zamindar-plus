import {useContext} from 'react';
import {I18nContext, type I18nContextValue} from './context';

/** Active locale, translator `t`, locale-aware formatters and `setLocale`. */
export function useI18n(): I18nContextValue {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
}

/** Convenience hook when a screen only needs the translator. */
export function useT() {
  return useI18n().t;
}
