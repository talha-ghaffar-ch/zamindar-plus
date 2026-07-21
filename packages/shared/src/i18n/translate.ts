import type { Messages } from './messages';

export type TranslationVars = Record<string, string | number>;

/**
 * Dot-path union of every leaf string in the message catalog, so translation
 * keys are fully type-checked (e.g. `nav.dashboard`, `zameen.form.title`).
 */
export type TranslationKey = LeafPaths<Messages>;

type LeafPaths<T> = {
  [K in keyof T & string]: T[K] extends string
    ? K
    : T[K] extends object
      ? `${K}.${LeafPaths<T[K]>}`
      : never;
}[keyof T & string];

export type Translator = (key: TranslationKey, vars?: TranslationVars) => string;

function resolve(catalog: Messages, key: string): string | undefined {
  let current: unknown = catalog;
  for (const part of key.split('.')) {
    if (current && typeof current === 'object' && part in current) {
      current = (current as Record<string, unknown>)[part];
    } else {
      return undefined;
    }
  }
  return typeof current === 'string' ? current : undefined;
}

function interpolate(template: string, vars?: TranslationVars): string {
  if (!vars) {
    return template;
  }
  return template.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in vars ? String(vars[name]) : match,
  );
}

/**
 * Create a translator bound to an active catalog with a fallback catalog
 * (English). Missing keys fall back to English, then to the raw key, so the UI
 * never renders blank text while a catalog is still being completed.
 */
export function createTranslator(
  catalog: Messages,
  fallback: Messages,
): Translator {
  return (key, vars) => {
    const template = resolve(catalog, key) ?? resolve(fallback, key) ?? key;
    return interpolate(template, vars);
  };
}
