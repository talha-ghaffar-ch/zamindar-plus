import { en } from './en';
import type { Locale } from '../locales';

/**
 * The catalog shape, derived from the English source of truth. Every locale
 * must satisfy this type, so a missing or renamed key is a compile error.
 */
export type Messages = typeof en;

export { en };

/**
 * Lazily load a locale's catalog. English is bundled eagerly (it is the
 * fallback and the most common language); Urdu and Roman Urdu are code-split
 * and fetched on demand the first time they are selected.
 */
export async function loadCatalog(locale: Locale): Promise<Messages> {
  switch (locale) {
    case 'ur':
      return (await import('./ur')).ur;
    case 'roman':
      return (await import('./roman')).roman;
    default:
      return en;
  }
}
