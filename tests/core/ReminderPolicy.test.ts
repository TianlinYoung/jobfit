import { describe, expect, it } from 'vitest';
import { ReminderPolicy } from '../../src/core/ReminderPolicy';
import type { ApplicationStatus } from '../../src/core/types';
import { makeApplication } from './applicationFixtures';

const TODAY = '2026-11-23';

describe('ReminderPolicy.reminderFor', () => {
  it.each([
    ['2026-11-20', { kind: 'overdue', days: 3 }],
    ['2026-11-22', { kind: 'overdue', days: 1 }],
    ['2026-11-23', { kind: 'dueToday', days: 0 }],
    ['2026-11-24', { kind: 'upcoming', days: 1 }],
    ['2026-11-26', { kind: 'upcoming', days: 3 }],
  ])('follow-up on %s → %j', (followUpDate, expected) => {
    expect(ReminderPolicy.reminderFor(makeApplication({ followUpDate }), TODAY)).toEqual({
      applicationId: 'a1',
      ...expected,
    });
  });

  it('shows nothing for follow-ups more than 3 days away', () => {
    expect(ReminderPolicy.reminderFor(makeApplication({ followUpDate: '2026-11-27' }), TODAY)).toBeNull();
  });

  it('shows nothing without a follow-up date', () => {
    expect(ReminderPolicy.reminderFor(makeApplication({ followUpDate: null }), TODAY)).toBeNull();
  });

  it('ignores an invalid follow-up date instead of crashing', () => {
    expect(ReminderPolicy.reminderFor(makeApplication({ followUpDate: '2026-02-30' }), TODAY)).toBeNull();
  });

  it.each<ApplicationStatus>(['Applied', 'OA', 'Interview'])('reminds for %s', (status) => {
    expect(ReminderPolicy.needsFollowUp(status)).toBe(true);
    expect(ReminderPolicy.reminderFor(makeApplication({ status, followUpDate: '2026-11-01' }), TODAY)).not.toBeNull();
  });

  it.each<ApplicationStatus>(['Saved', 'Offer', 'Rejected'])('never reminds for %s, even if overdue', (status) => {
    expect(ReminderPolicy.needsFollowUp(status)).toBe(false);
    expect(ReminderPolicy.reminderFor(makeApplication({ status, followUpDate: '2026-11-01' }), TODAY)).toBeNull();
  });
});

describe('ReminderPolicy.needingAction', () => {
  it('lists overdue and due-today reminders, most overdue first, and leaves out upcoming ones', () => {
    const applications = [
      makeApplication({ id: 'today', followUpDate: '2026-11-23' }),
      makeApplication({ id: 'late1', followUpDate: '2026-11-22' }),
      makeApplication({ id: 'soon', followUpDate: '2026-11-25' }),
      makeApplication({ id: 'late5', followUpDate: '2026-11-18' }),
      makeApplication({ id: 'done', status: 'Rejected', followUpDate: '2026-11-01' }),
    ];
    expect(ReminderPolicy.needingAction(applications, TODAY).map((r) => r.applicationId)).toEqual([
      'late5',
      'late1',
      'today',
    ]);
  });

  it('returns an empty list when nothing is due', () => {
    expect(ReminderPolicy.needingAction([], TODAY)).toEqual([]);
  });
});
