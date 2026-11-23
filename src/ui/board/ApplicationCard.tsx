// One application on the board: company, role, dates, reminder, and quick actions.
import { ApplicationRules } from '../../core/ApplicationRules';
import { ReminderPolicy } from '../../core/ReminderPolicy';
import { APPLICATION_STATUSES, type Application, type ApplicationStatus } from '../../core/types';
import { formatDate } from '../format';
import { useLanguage, useT } from '../i18n/LanguageContext';
import { reminderText } from './ReminderBanner';

// React: props are read-only inputs. The card never changes the application itself; it reports
// what the user wants (edit, delete, move) to the parent through the callbacks.
interface ApplicationCardProps {
  application: Application;
  today: string;
  onEdit: () => void;
  onDelete: () => void;
  onChangeStatus: (status: ApplicationStatus) => void;
}

export function ApplicationCard({ application, today, onEdit, onDelete, onChangeStatus }: ApplicationCardProps) {
  const t = useT();
  const { language } = useLanguage();
  const reminder = ReminderPolicy.reminderFor(application, today);
  const statusSelectId = `status-${application.id}`;

  return (
    <article className={`application-card${reminder !== null ? ` has-reminder reminder-${reminder.kind}` : ''}`}>
      <header>
        <strong className="company">{application.company}</strong>
        <span className="role">{application.role}</span>
      </header>

      {reminder !== null && <p className={`reminder-badge reminder-${reminder.kind}`}>{reminderText(t, reminder)}</p>}

      <ul className="card-facts">
        {application.appliedDate !== null && <li>{t.board.appliedOn(formatDate(application.appliedDate, language))}</li>}
        {application.followUpDate !== null && ReminderPolicy.needsFollowUp(application.status) && (
          <li>{t.board.followUpOn(formatDate(application.followUpDate, language))}</li>
        )}
        {application.lastScore !== null && <li>{t.board.matchScore(application.lastScore)}</li>}
      </ul>

      {application.notes !== '' && <p className="card-notes">{application.notes}</p>}

      <footer>
        <label className="visually-hidden" htmlFor={statusSelectId}>
          {t.board.statusLabel}
        </label>
        {/* React: controlled <select>; its value is the application's status, and a change is sent to the parent. */}
        <select
          id={statusSelectId}
          value={application.status}
          onChange={(event) => {
            if (ApplicationRules.isStatus(event.target.value)) {
              onChangeStatus(event.target.value);
            }
          }}
        >
          {APPLICATION_STATUSES.map((status) => (
            // React: unique `key` per option.
            <option key={status} value={status}>
              {t.applicationStatus[status]}
            </option>
          ))}
        </select>
        <button type="button" className="link-button" onClick={onEdit}>
          {t.board.edit}
        </button>
        <button type="button" className="link-button danger" onClick={onDelete}>
          {t.board.delete}
        </button>
      </footer>
    </article>
  );
}
