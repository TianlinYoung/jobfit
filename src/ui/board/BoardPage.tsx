// The Applications tab: reminder banner, add/edit form, one column per status, and backup tools.
import { useState } from 'react';
import type { EditableFields } from '../../core/ApplicationRules';
import { APPLICATION_STATUSES, type AppData, type Application, type ApplicationStatus } from '../../core/types';
import { useT } from '../i18n/LanguageContext';
import { EmptyState } from '../shared/EmptyState';
import { ApplicationForm } from './ApplicationForm';
import { DataTransferPanel } from './DataTransferPanel';
import { ReminderBanner } from './ReminderBanner';
import { StatusColumn } from './StatusColumn';

// React: props are the inputs. App owns the applications and does the saving; this page
// shows them and reports what the user did through the callbacks.
interface BoardPageProps {
  applications: Application[];
  /** Local calendar date, decided by App so the whole page agrees on what "today" is. */
  today: string;
  onAdd: (fields: EditableFields) => void;
  onUpdate: (application: Application, fields: EditableFields) => void;
  onChangeStatus: (application: Application, status: ApplicationStatus) => void;
  onDelete: (application: Application) => void;
  onLoadSample: () => void;
  onExport: () => void;
  onImport: (data: AppData) => Promise<boolean>;
}

/** Whether the form is closed, adding a new application, or editing one. */
type FormMode = { kind: 'closed' } | { kind: 'add' } | { kind: 'edit'; application: Application };

export function BoardPage(props: BoardPageProps) {
  const { applications, today, onAdd, onUpdate, onChangeStatus, onDelete, onLoadSample, onExport, onImport } = props;
  const t = useT();
  // React: useState for which form (if any) is open. Only this page cares, so the state lives here, not in App.
  const [formMode, setFormMode] = useState<FormMode>({ kind: 'closed' });

  function handleSubmit(fields: EditableFields) {
    if (formMode.kind === 'edit') {
      onUpdate(formMode.application, fields);
    } else {
      onAdd(fields);
    }
    setFormMode({ kind: 'closed' });
  }

  function confirmDelete(application: Application) {
    if (window.confirm(t.board.confirmDelete(application.role, application.company))) {
      onDelete(application);
    }
  }

  return (
    <section className="page">
      <header className="page-header">
        <div>
          <h2>{t.board.title}</h2>
          <p className="hint">{t.board.intro}</p>
        </div>
        <button type="button" onClick={() => setFormMode({ kind: 'add' })}>
          {t.board.add}
        </button>
      </header>

      <ReminderBanner applications={applications} today={today} />

      {formMode.kind !== 'closed' && (
        <ApplicationForm
          // React: a new `key` makes React throw away the old form and build a fresh one,
          // so switching from editing A to editing B starts from B's values.
          key={formMode.kind === 'edit' ? formMode.application.id : 'new'}
          initial={formMode.kind === 'edit' ? formMode.application : null}
          onSubmit={handleSubmit}
          onCancel={() => setFormMode({ kind: 'closed' })}
        />
      )}

      {applications.length === 0 ? (
        <EmptyState
          title={t.board.emptyTitle}
          message={t.board.emptyMessage}
          actions={
            <>
              <button type="button" onClick={() => setFormMode({ kind: 'add' })}>
                {t.board.add}
              </button>
              <button type="button" id="load-sample-applications" className="secondary" onClick={onLoadSample}>
                {t.board.loadSample}
              </button>
            </>
          }
        />
      ) : (
        <div className="board">
          {APPLICATION_STATUSES.map((status) => (
            <StatusColumn
              key={status}
              status={status}
              applications={applications.filter((a) => a.status === status)}
              today={today}
              onEdit={(application) => setFormMode({ kind: 'edit', application })}
              onDelete={confirmDelete}
              onChangeStatus={onChangeStatus}
            />
          ))}
        </div>
      )}

      <DataTransferPanel onExport={onExport} onImport={onImport} />
    </section>
  );
}
