/**
 * Pure-logic tests for the parity-critical domain + formatting helpers.
 * (No native modules, so no RN mocking required.)
 */
import {formatCurrency, parseDisplayDate, toSquareFeet} from '../src/domain';
import {compactCurrency, compactNumber, formatArea, monthName} from '../src/format';

describe('area → square feet conversion', () => {
  test('acre and killa are 43,560 sqft', () => {
    expect(toSquareFeet(1, 'Acre')).toBe(43560);
    expect(toSquareFeet(2, 'Killa')).toBe(87120);
  });

  test('marla and kanal', () => {
    expect(toSquareFeet(1, 'Marla')).toBeCloseTo(272.25);
    expect(toSquareFeet(1, 'Kanal')).toBe(5445);
  });

  test('unknown units fall back to acre', () => {
    expect(toSquareFeet(1, 'Bogus')).toBe(43560);
  });
});

describe('formatCurrency', () => {
  test('formats rupees with separators', () => {
    expect(formatCurrency(1000)).toBe('Rs 1,000');
    expect(formatCurrency(0)).toBe('Rs 0');
  });
});

describe('parseDisplayDate', () => {
  test('parses a valid DD/MM/YYYY value', () => {
    const parsed = parseDisplayDate('15/02/2026');
    expect(parsed.month).toBe(2);
    expect(parsed.year).toBe(2026);
    expect(parsed.isoDate.startsWith('2026-02-15')).toBe(true);
  });

  test('rejects invalid dates', () => {
    expect(() => parseDisplayDate('99/99/2026')).toThrow();
    expect(() => parseDisplayDate('not-a-date')).toThrow();
  });
});

describe('format helpers', () => {
  test('compactNumber', () => {
    expect(compactNumber(500)).toBe('500');
    expect(compactNumber(1500)).toBe('1.5K');
    expect(compactNumber(2_000_000)).toBe('2M');
  });

  test('compactCurrency', () => {
    expect(compactCurrency(6_500_000)).toBe('Rs 6.5M');
  });

  test('monthName', () => {
    expect(monthName(2)).toBe('Feb');
    expect(monthName(12, true)).toBe('December');
  });

  test('formatArea', () => {
    expect(formatArea(50, 'Acre')).toBe('50 Acre');
  });
});
