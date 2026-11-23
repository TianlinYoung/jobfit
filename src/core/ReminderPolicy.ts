// Decides which applications need a follow-up, and how urgent each one is. Rules: docs/DECISIONS.md D12.
import { CalendarDate } from './CalendarDate';
import type { Application, ApplicationStatus } from './types';

/** Statuses where you are waiting on the company, so following up makes sense. */
export const STATUSES_NEEDING_FOLLOW_UP: ReadonlySet<ApplicationStatus> = new Set(['Applied', 'OA', 'Interview']);

/** Follow-ups this many days ahead (or fewer) are shown as "upcoming" on the card. */
export const UPCOMING_WINDOW_DAYS = 3;

/** Default gap between applying and following up, used when the status moves to Applied. */
export const DEFAULT_FOLLOW_UP_DAYS = 7;

export type ReminderKind = 'overdue' | 'dueToday' | 'upcoming';

export interface Reminder {
  applicationId: string;
  kind: ReminderKind;
  /** Days overdue (for overdue) or days until due (for upcoming); 0 for dueToday. */
  days: number;
}

export class ReminderPolicy {
  static needsFollowUp(status: ApplicationStatus): boolean {
    return STATUSES_NEEDING_FOLLOW_UP.has(status);
  }

  /** The reminder to show on one application's card, or null if there is nothing to show. */
  static reminderFor(application: Application, today: string): Reminder | null {
    const { followUpDate, status, id } = application;
    if (!ReminderPolicy.needsFollowUp(status) || !CalendarDate.isValid(followUpDate)) {
      return null;
    }
    const daysUntil = CalendarDate.daysBetween(today, followUpDate);
    if (daysUntil < 0) {
      return { applicationId: id, kind: 'overdue', days: -daysUntil };
    }
    if (daysUntil === 0) {
      return { applicationId: id, kind: 'dueToday', days: 0 };
    }
    if (daysUntil <= UPCOMING_WINDOW_DAYS) {
      return { applicationId: id, kind: 'upcoming', days: daysUntil };
    }
    return null;
  }

  /** Overdue and due-today reminders for the banner: most overdue first. Upcoming ones only show on cards. */
  static needingAction(applications: Application[], today: string): Reminder[] {
    return applications
      .map((application) => ReminderPolicy.reminderFor(application, today))
      .filter((reminder): reminder is Reminder => reminder !== null && reminder.kind !== 'upcoming')
      .sort((a, b) => b.days - a.days);
  }
}
