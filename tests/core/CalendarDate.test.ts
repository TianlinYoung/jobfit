import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { inTimeZone, restoreTimeZone, setTimeZone } from '../timeZone';
import { CalendarDate } from '../../src/core/CalendarDate';

describe('CalendarDate.today', () => {
  it('uses the local date when UTC is already tomorrow (Seattle, 4:30 pm)', () => {
    // 2026-11-24 00:30 UTC is 2026-11-23 16:30 in Seattle (UTC-8).
    const now = new Date('2026-11-24T00:30:00Z');
    inTimeZone('America/Los_Angeles', () => {
      expect(now.toISOString().slice(0, 10)).toBe('2026-11-24'); // the bug we avoid
      expect(CalendarDate.today(now)).toBe('2026-11-23');
    });
  });

  it('uses the local date when UTC is still yesterday (Shanghai, 7 am)', () => {
    // 2026-11-22 23:00 UTC is 2026-11-23 07:00 in Shanghai (UTC+8).
    const now = new Date('2026-11-22T23:00:00Z');
    inTimeZone('Asia/Shanghai', () => {
      expect(now.toISOString().slice(0, 10)).toBe('2026-11-22');
      expect(CalendarDate.today(now)).toBe('2026-11-23');
    });
  });

  it('pads single-digit months and days', () => {
    inTimeZone('UTC', () => {
      expect(CalendarDate.today(new Date('2027-01-05T12:00:00Z'))).toBe('2027-01-05');
    });
  });
});

describe('CalendarDate.isValid', () => {
  it.each(['2026-11-23', '2028-02-29', '2026-12-31'])('accepts %s', (value) => {
    expect(CalendarDate.isValid(value)).toBe(true);
  });

  it.each([
    ['2026-02-30', 'impossible day'],
    ['2027-02-29', 'not a leap year'],
    ['2026-13-01', 'month 13'],
    ['2026-1-5', 'missing zero padding'],
    ['2026-11-23T00:00:00Z', 'a timestamp, not a date'],
    ['', 'empty'],
    [null, 'null'],
    [20261123, 'a number'],
  ])('rejects %j (%s)', (value, _reason) => {
    expect(CalendarDate.isValid(value)).toBe(false);
  });
});

describe('CalendarDate arithmetic', () => {
  // Arithmetic must not depend on the machine's time zone or daylight saving.
  beforeEach(() => setTimeZone('America/Los_Angeles'));
  afterEach(restoreTimeZone);

  it('adds days across month and year ends', () => {
    expect(CalendarDate.addDays('2026-11-23', 7)).toBe('2026-11-30');
    expect(CalendarDate.addDays('2026-12-30', 3)).toBe('2027-01-02');
    expect(CalendarDate.addDays('2026-03-01', -1)).toBe('2026-02-28');
  });

  it('adds days across a daylight-saving change without drifting', () => {
    // US clocks fall back on 2026-11-01.
    expect(CalendarDate.addDays('2026-10-31', 2)).toBe('2026-11-02');
  });

  it('counts whole days between dates', () => {
    expect(CalendarDate.daysBetween('2026-11-23', '2026-11-30')).toBe(7);
    expect(CalendarDate.daysBetween('2026-11-23', '2026-11-21')).toBe(-2);
    expect(CalendarDate.daysBetween('2026-10-31', '2026-11-02')).toBe(2);
  });

  it('throws on invalid input, which would be a programming error', () => {
    expect(() => CalendarDate.addDays('not-a-date', 1)).toThrow('Invalid calendar date');
  });
});
