// Number and date formatting shared by the UI. Labels and sentences live in the i18n dictionaries.
import { CalendarDate } from '../core/CalendarDate';
import type { Language } from './i18n/language';

/** 3 → "3", 1.5 → "1.5". Points are always whole or halves, so one decimal is enough. */
export function formatPoints(points: number): string {
  return Number.isInteger(points) ? String(points) : points.toFixed(1);
}

/**
 * "2026-11-23" → "Nov 23, 2026" (English) or "2026年11月23日" (Chinese).
 * Formatted in UTC on purpose: the string is a calendar date with no time zone, and formatting it in
 * local time could shift it by a day (midnight UTC is still "yesterday" in Seattle).
 */
export function formatDate(date: string, language: Language): string {
  if (!CalendarDate.isValid(date)) {
    return date;
  }
  const [year, month, day] = date.split('-').map(Number) as [number, number, number];
  const locale = language === 'zh' ? 'zh-CN' : 'en-US';
  const formatter = new Intl.DateTimeFormat(locale, { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC' });
  return formatter.format(new Date(Date.UTC(year, month - 1, day)));
}
