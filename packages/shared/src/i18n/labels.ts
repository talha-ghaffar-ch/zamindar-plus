import type { TranslationKey } from './translate';

/**
 * Values such as ownership types and area units are stored in English in the
 * database. These helpers map a stored value to its display translation key so
 * the data stays stable while the label follows the active language.
 */

const OWNERSHIP_KEYS: Record<string, TranslationKey> = {
  'Own Land': 'units.ownershipOwn',
  'Thekka Land': 'units.ownershipThekka',
  'Batai Land': 'units.ownershipBatai',
  'Family Land': 'units.ownershipFamily',
  'Managed Land': 'units.ownershipManaged',
};

const AREA_UNIT_KEYS: Record<string, TranslationKey> = {
  Acre: 'units.areaAcre',
  Killa: 'units.areaKilla',
  Murabba: 'units.areaMurabba',
  Kanal: 'units.areaKanal',
  Marla: 'units.areaMarla',
  'Square feet': 'units.areaSquareFeet',
};

/** Translation key for a stored ownership type, or null when unknown/unset. */
export function ownershipTypeKey(value?: string | null): TranslationKey | null {
  return value ? (OWNERSHIP_KEYS[value] ?? null) : null;
}

/** Translation key for a stored area unit, or null when unknown. */
export function areaUnitKey(value?: string | null): TranslationKey | null {
  return value ? (AREA_UNIT_KEYS[value] ?? null) : null;
}
