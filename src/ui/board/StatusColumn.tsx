// One column of the board: all applications in a single status.
import type { Application, ApplicationStatus } from '../../core/types';
import { useT } from '../i18n/LanguageContext';
import { ApplicationCard } from './ApplicationCard';

// React: props are read-only inputs from BoardPage. The callbacks receive the application,
// so BoardPage does not need one handler per card.
interface StatusColumnProps {
  status: ApplicationStatus;
  applications: Application[];
  today: string;
  onEdit: (application: Application) => void;
  onDelete: (application: Application) => void;
  onChangeStatus: (application: Application, status: ApplicationStatus) => void;
}

export function StatusColumn({ status, applications, today, onEdit, onDelete, onChangeStatus }: StatusColumnProps) {
  const t = useT();
  return (
    <section className="status-column" aria-label={t.applicationStatus[status]}>
      <h3>
        {t.applicationStatus[status]} <span className="count">{applications.length}</span>
      </h3>
      {applications.length === 0 ? (
        <p className="hint">{t.board.columnEmpty}</p>
      ) : (
        sortForColumn(applications).map((application) => (
          // React: the id is a stable, unique `key`, so cards keep their identity when the list changes.
          <ApplicationCard
            key={application.id}
            application={application}
            today={today}
            onEdit={() => onEdit(application)}
            onDelete={() => onDelete(application)}
            onChangeStatus={(next) => onChangeStatus(application, next)}
          />
        ))
      )}
    </section>
  );
}

/** Soonest follow-up first (so overdue cards rise to the top), then most recently updated. */
function sortForColumn(applications: Application[]): Application[] {
  return [...applications].sort((a, b) => {
    if (a.followUpDate !== b.followUpDate) {
      if (a.followUpDate === null) return 1;
      if (b.followUpDate === null) return -1;
      return a.followUpDate.localeCompare(b.followUpDate);
    }
    return b.updatedAt.localeCompare(a.updatedAt);
  });
}
