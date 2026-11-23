// A banner above the board listing applications whose follow-up is due today or overdue.
import { ReminderPolicy, type Reminder } from '../../core/ReminderPolicy';
import type { Application } from '../../core/types';
import type { Messages } from '../i18n/en';
import { useT } from '../i18n/LanguageContext';

// React: props are read-only inputs. `today` comes from App, so this component never reads the clock itself.
interface ReminderBannerProps {
  applications: Application[];
  today: string;
}

export function ReminderBanner({ applications, today }: ReminderBannerProps) {
  const t = useT();
  const reminders = ReminderPolicy.needingAction(applications, today);
  if (reminders.length === 0) {
    // React: returning null renders nothing.
    return null;
  }
  const byId = new Map(applications.map((a) => [a.id, a]));

  return (
    <section className="reminder-banner" role="status">
      <h3>{t.reminder.bannerTitle(reminders.length)}</h3>
      <ul>
        {reminders.map((reminder) => {
          const application = byId.get(reminder.applicationId);
          return (
            // React: `key` must be unique per list item; one reminder per application.
            <li key={reminder.applicationId} className={`reminder-${reminder.kind}`}>
              <strong>{application?.company}</strong> · {application?.role} — {reminderText(t, reminder)}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/** Shared with ApplicationCard so the banner and the card always say the same thing. */
export function reminderText(t: Messages, reminder: Reminder): string {
  switch (reminder.kind) {
    case 'overdue':
      return t.reminder.overdue(reminder.days);
    case 'dueToday':
      return t.reminder.dueToday;
    case 'upcoming':
      return t.reminder.upcoming(reminder.days);
  }
}
