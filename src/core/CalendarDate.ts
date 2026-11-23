// Calendar dates ("YYYY-MM-DD") with no time and no time zone, plus the one place that reads "today".
//
// Why not Date.toISOString().slice(0, 10)? toISOString() is UTC. At 4:30 pm in Seattle (UTC-8)
// it is already tomorrow in UTC, so a follow-up due "today" would show as due yesterday.
// We build the string from the *local* year/month/day instead.
//
// For arithmetic we treat a date string as midnight UTC. That has no daylight-saving jumps,
// so adding 1 day is always exactly 24 hours.

const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

export class CalendarDate {
  /**
   * The user's local calendar date at the instant `now`.
   * `now` is passed in rather than read inside, so tests can pick any moment.
   */
  static today(now: Date): string {
    return CalendarDate.format(now.getFullYear(), now.getMonth() + 1, now.getDate());
  }

  /** True for a real calendar date in "YYYY-MM-DD" form ("2026-02-30" is false). */
  static isValid(value: unknown): value is string {
    if (typeof value !== 'string') {
      return false;
    }
    const match = DATE_PATTERN.exec(value);
    if (match === null) {
      return false;
    }
    const [year, month, day] = [Number(match[1]), Number(match[2]), Number(match[3])];
    // Round-trip through Date: an impossible date like Feb 30 rolls over to March and won't match.
    const roundTrip = new Date(Date.UTC(year, month - 1, day));
    return (
      roundTrip.getUTCFullYear() === year && roundTrip.getUTCMonth() === month - 1 && roundTrip.getUTCDate() === day
    );
  }

  static addDays(date: string, days: number): string {
    const shifted = new Date(CalendarDate.toUtcMillis(date) + days * MS_PER_DAY);
    return CalendarDate.format(shifted.getUTCFullYear(), shifted.getUTCMonth() + 1, shifted.getUTCDate());
  }

  /** Whole days from `from` to `to`: positive if `to` is later. */
  static daysBetween(from: string, to: string): number {
    return Math.round((CalendarDate.toUtcMillis(to) - CalendarDate.toUtcMillis(from)) / MS_PER_DAY);
  }

  private static toUtcMillis(date: string): number {
    if (!CalendarDate.isValid(date)) {
      // Callers validate first; reaching this is a programming error, so fail loudly.
      throw new Error(`Invalid calendar date: ${date}`);
    }
    const [year, month, day] = date.split('-').map(Number) as [number, number, number];
    return Date.UTC(year, month - 1, day);
  }

  private static format(year: number, month: number, day: number): string {
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${year}-${pad(month)}-${pad(day)}`;
  }
}
