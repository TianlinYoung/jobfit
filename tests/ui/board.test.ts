// UI-layer helpers for the board: date display, sample data, and reminder/status wording in both languages.
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { restoreTimeZone, setTimeZone } from '../timeZone';
import { ApplicationValidator } from '../../src/core/ApplicationValidator';
import { ExportCodec } from '../../src/core/ExportCodec';
import { ReminderPolicy } from '../../src/core/ReminderPolicy';
import { APPLICATION_STATUSES } from '../../src/core/types';
import { reminderText } from '../../src/ui/board/ReminderBanner';
import { formatDate } from '../../src/ui/format';
import { DICTIONARIES } from '../../src/ui/i18n/language';
import { createSampleApplications } from '../../src/ui/sampleApplications';

beforeAll(() => setTimeZone('America/Los_Angeles'));
afterAll(restoreTimeZone);

describe('formatDate', () => {
  it('formats a calendar date per language without shifting the day', () => {
    // In Seattle, midnight UTC on Nov 23 is still Nov 22 locally; the date must not move.
    expect(formatDate('2026-11-23', 'en')).toBe('Nov 23, 2026');
    expect(formatDate('2026-11-23', 'zh')).toBe('2026年11月23日');
  });

  it('shows an invalid value as-is rather than "Invalid Date"', () => {
    expect(formatDate('someday', 'en')).toBe('someday');
  });
});

describe('sample applications', () => {
  // 4:30 pm in Seattle on Nov 23 = 00:30 UTC on Nov 24.
  const now = new Date('2026-11-24T00:30:00Z');
  const samples = createSampleApplications(now);
  const today = '2026-11-23';

  it('are valid, importable data covering every status', () => {
    expect(ApplicationValidator.parseStoredList(samples)).toEqual(samples);
    expect(ExportCodec.decode(ExportCodec.encode({ resume: null, applications: samples }, now)).ok).toBe(true);
    expect(new Set(samples.map((a) => a.status))).toEqual(new Set(APPLICATION_STATUSES));
  });

  it('show one overdue, one due-today and one upcoming reminder relative to the local date', () => {
    const kinds = samples.map((a) => ReminderPolicy.reminderFor(a, today)?.kind).filter((k) => k !== undefined);
    expect(kinds.sort()).toEqual(['dueToday', 'overdue', 'upcoming']);
  });
});

describe('board wording', () => {
  it.each(['en', 'zh'] as const)('%s: every status has a label', (language) => {
    for (const status of APPLICATION_STATUSES) {
      expect(DICTIONARIES[language].applicationStatus[status].trim()).not.toBe('');
    }
  });

  it('reminder text in both languages, with singular/plural in English', () => {
    const overdue1 = { applicationId: 'a', kind: 'overdue' as const, days: 1 };
    const overdue3 = { ...overdue1, days: 3 };
    const upcoming2 = { applicationId: 'a', kind: 'upcoming' as const, days: 2 };
    const today = { applicationId: 'a', kind: 'dueToday' as const, days: 0 };
    const { en, zh } = DICTIONARIES;
    expect(reminderText(en, overdue1)).toBe('Follow-up overdue by 1 day');
    expect(reminderText(en, overdue3)).toBe('Follow-up overdue by 3 days');
    expect(reminderText(en, upcoming2)).toBe('Follow up in 2 days');
    expect(reminderText(en, today)).toBe('Follow up today');
    expect(reminderText(zh, overdue3)).toBe('跟进已逾期 3 天');
    expect(reminderText(zh, upcoming2)).toBe('2 天后跟进');
    expect(reminderText(zh, today)).toBe('今天需要跟进');
  });

  it.each(['en', 'zh'] as const)('%s: every import problem has a message that names the field', (language) => {
    const messages = DICTIONARIES[language].importIssue;
    expect(messages.invalidStatus('applications[2].status', 0)).toContain('applications[2].status');
    expect(messages.tooLong('applications[0].notes', 10000)).toContain('10000');
    expect(messages.fileTooLarge('(file)', 5_000_000)).toContain('5 MB');
  });
});
