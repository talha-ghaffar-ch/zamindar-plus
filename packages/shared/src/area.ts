export const AREA_UNITS = [
  'Acre',
  'Killa',
  'Murabba',
  'Kanal',
  'Marla',
  'Square feet',
] as const;

export type AreaUnit = (typeof AREA_UNITS)[number];

const AREA_TO_SQUARE_FEET: Record<AreaUnit, number> = {
  Acre: 43560,
  Killa: 43560,
  Murabba: 1089000,
  Kanal: 5445,
  Marla: 272.25,
  'Square feet': 1,
};

export function toSquareFeet(value: number, unit: AreaUnit) {
  return value * AREA_TO_SQUARE_FEET[unit];
}