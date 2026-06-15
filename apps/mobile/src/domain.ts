export const areaUnits = [
  'Acre',
  'Killa',
  'Murabba',
  'Kanal',
  'Marla',
  'Square feet',
] as const;

export const cropNames = [
  'Wheat',
  'Rice',
  'Sugarcane',
  'Cotton',
  'Maize',
  'Vegetables',
] as const;

export const expenseCategories = [
  'Seed',
  'Fertilizer',
  'Spray',
  'Diesel',
  'Labour',
  'Water',
  'Other',
] as const;

export const quantityUnits = [
  'Maund',
  'Kg',
  'Ton',
  'Bag',
  'Crate',
  'Tray',
] as const;

const areaToSquareFeet: Record<(typeof areaUnits)[number], number> = {
  Acre: 43560,
  Killa: 43560,
  Murabba: 1089000,
  Kanal: 5445,
  Marla: 272.25,
  'Square feet': 1,
};

export function toSquareFeet(value: number, unit: string) {
  const safeUnit = areaUnits.includes(unit as (typeof areaUnits)[number])
    ? (unit as (typeof areaUnits)[number])
    : 'Acre';

  return value * areaToSquareFeet[safeUnit];
}

export function formatCurrency(value = 0) {
  return `Rs ${Math.round(value).toLocaleString()}`;
}

export function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString('en-GB');
}

export function parseDisplayDate(value: string) {
  const parts = value.trim().split('/');

  if (parts.length !== 3) {
    throw new Error('Use date format DD/MM/YYYY.');
  }

  const [dayText, monthText, yearText] = parts;
  const day = Number(dayText);
  const month = Number(monthText);
  const year = Number(yearText);
  const date = new Date(Date.UTC(year, month - 1, day));

  if (
    !day ||
    !month ||
    !year ||
    date.getUTCDate() !== day ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCFullYear() !== year
  ) {
    throw new Error('Enter a valid date as DD/MM/YYYY.');
  }

  return {
    isoDate: date.toISOString(),
    month,
    year,
  };
}

export function todayDisplayDate() {
  return new Date().toLocaleDateString('en-GB');
}
