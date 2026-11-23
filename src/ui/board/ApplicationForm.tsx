// Form for adding a new application or editing an existing one.
import { useState, type FormEvent } from 'react';
import { ApplicationRules, EMPTY_FIELDS, type EditableFields } from '../../core/ApplicationRules';
import { CalendarDate } from '../../core/CalendarDate';
import { LIMITS } from '../../core/limits';
import { APPLICATION_STATUSES, type Application, type ApplicationStatus } from '../../core/types';
import { useT } from '../i18n/LanguageContext';

// React: props are inputs. `initial` is null when adding, or the application being edited.
interface ApplicationFormProps {
  initial: Application | null;
  onSubmit: (fields: EditableFields) => void;
  onCancel: () => void;
}

/** Form state. Dates are strings because <input type="date"> uses "" for "no date". */
interface FormDraft {
  company: string;
  role: string;
  status: ApplicationStatus;
  appliedDate: string;
  followUpDate: string;
  notes: string;
  jdText: string;
}

function toDraft(application: Application | null): FormDraft {
  const source = application ?? EMPTY_FIELDS;
  return {
    company: source.company,
    role: source.role,
    status: source.status,
    appliedDate: source.appliedDate ?? '',
    followUpDate: source.followUpDate ?? '',
    notes: source.notes,
    jdText: source.jdText,
  };
}

/** "" (empty date input) → null; anything that is not a real date is also treated as "no date". */
function toNullableDate(value: string): string | null {
  return CalendarDate.isValid(value) ? value : null;
}

export function ApplicationForm({ initial, onSubmit, onCancel }: ApplicationFormProps) {
  const t = useT();
  // React: useState holds the form's current values between renders; initialized once from `initial`.
  const [draft, setDraft] = useState<FormDraft>(() => toDraft(initial));
  const [showRequired, setShowRequired] = useState(false);

  function update<K extends keyof FormDraft>(field: K, value: FormDraft[K]) {
    setDraft({ ...draft, [field]: value });
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (draft.company.trim() === '' || draft.role.trim() === '') {
      setShowRequired(true);
      return;
    }
    onSubmit({
      company: draft.company.trim(),
      role: draft.role.trim(),
      status: draft.status,
      appliedDate: toNullableDate(draft.appliedDate),
      followUpDate: toNullableDate(draft.followUpDate),
      notes: draft.notes,
      jdText: draft.jdText,
      lastScore: initial?.lastScore ?? null,
    });
  }

  return (
    <form className="card application-form" onSubmit={handleSubmit}>
      <h3>{initial === null ? t.applicationForm.addTitle : t.applicationForm.editTitle}</h3>
      <div className="field-row">
        <div className="field">
          <label htmlFor="app-company">{t.applicationForm.company}</label>
          {/* React: controlled inputs. Each value comes from `draft`, and each edit updates it. */}
          <input
            id="app-company"
            type="text"
            maxLength={LIMITS.company}
            value={draft.company}
            onChange={(e) => update('company', e.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="app-role">{t.applicationForm.role}</label>
          <input
            id="app-role"
            type="text"
            maxLength={LIMITS.role}
            value={draft.role}
            onChange={(e) => update('role', e.target.value)}
          />
        </div>
      </div>

      <div className="field-row">
        <div className="field">
          <label htmlFor="app-status">{t.applicationForm.status}</label>
          <select
            id="app-status"
            value={draft.status}
            onChange={(e) => {
              if (ApplicationRules.isStatus(e.target.value)) {
                update('status', e.target.value);
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
        </div>
        <div className="field">
          <label htmlFor="app-applied">{t.applicationForm.appliedDate}</label>
          <input id="app-applied" type="date" value={draft.appliedDate} onChange={(e) => update('appliedDate', e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="app-follow-up">{t.applicationForm.followUpDate}</label>
          <input
            id="app-follow-up"
            type="date"
            value={draft.followUpDate}
            aria-describedby="app-follow-up-hint"
            onChange={(e) => update('followUpDate', e.target.value)}
          />
        </div>
      </div>
      <p id="app-follow-up-hint" className="hint">
        {t.applicationForm.followUpHint}
      </p>

      <div className="field">
        <label htmlFor="app-notes">{t.applicationForm.notes}</label>
        <textarea
          id="app-notes"
          rows={3}
          maxLength={LIMITS.notes}
          value={draft.notes}
          onChange={(e) => update('notes', e.target.value)}
        />
      </div>
      <div className="field">
        <label htmlFor="app-jd">{t.applicationForm.jdText}</label>
        <textarea
          id="app-jd"
          rows={3}
          maxLength={LIMITS.jdText}
          value={draft.jdText}
          onChange={(e) => update('jdText', e.target.value)}
        />
      </div>
      {initial?.lastScore != null && <p className="hint">{t.applicationForm.lastScore(initial.lastScore)}</p>}

      {showRequired && (
        <p className="form-error" role="alert">
          {t.applicationForm.required}
        </p>
      )}
      <div className="button-row">
        <button type="submit">{t.applicationForm.save}</button>
        <button type="button" className="secondary" onClick={onCancel}>
          {t.applicationForm.cancel}
        </button>
      </div>
    </form>
  );
}
