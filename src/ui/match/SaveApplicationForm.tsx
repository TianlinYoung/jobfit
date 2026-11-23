// "Save as application" on the result page: asks for company and role, then saves JD + score to the board.
import { useState, type FormEvent } from 'react';
import { LIMITS } from '../../core/limits';
import { useT } from '../i18n/LanguageContext';

// React: props are inputs. The JD text and score are already known by the parent;
// this form only collects what the JD alone can't reliably tell us: company and role.
interface SaveApplicationFormProps {
  onSave: (company: string, role: string) => void;
  onOpenBoard: () => void;
}

/** closed → open (typing) → saved (showing a confirmation). */
type Step = { kind: 'closed' } | { kind: 'open' } | { kind: 'saved'; company: string; role: string };

export function SaveApplicationForm({ onSave, onOpenBoard }: SaveApplicationFormProps) {
  const t = useT();
  // React: several small useState fields; each is independent, so separate state is simplest.
  const [step, setStep] = useState<Step>({ kind: 'closed' });
  const [company, setCompany] = useState('');
  const [role, setRole] = useState('');
  const [showRequired, setShowRequired] = useState(false);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (company.trim() === '' || role.trim() === '') {
      setShowRequired(true);
      return;
    }
    onSave(company.trim(), role.trim());
    setStep({ kind: 'saved', company: company.trim(), role: role.trim() });
    setCompany('');
    setRole('');
    setShowRequired(false);
  }

  if (step.kind === 'closed' || step.kind === 'saved') {
    return (
      <div className="save-application">
        <button type="button" className="secondary" onClick={() => setStep({ kind: 'open' })}>
          {t.saveApplication.button}
        </button>
        {step.kind === 'saved' && (
          <span className="success" role="status">
            {t.saveApplication.saved(step.role, step.company)}{' '}
            <button type="button" className="link-button" onClick={onOpenBoard}>
              {t.saveApplication.openBoard}
            </button>
          </span>
        )}
      </div>
    );
  }

  return (
    <form className="card save-application-form" onSubmit={handleSubmit}>
      <h3>{t.saveApplication.title}</h3>
      <div className="field-row">
        <div className="field">
          <label htmlFor="save-company">{t.applicationForm.company}</label>
          {/* React: controlled inputs; the typed text lives in state. */}
          <input
            id="save-company"
            type="text"
            maxLength={LIMITS.company}
            value={company}
            onChange={(e) => setCompany(e.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="save-role">{t.applicationForm.role}</label>
          <input id="save-role" type="text" maxLength={LIMITS.role} value={role} onChange={(e) => setRole(e.target.value)} />
        </div>
      </div>
      {showRequired && (
        <p className="form-error" role="alert">
          {t.applicationForm.required}
        </p>
      )}
      <div className="button-row">
        <button type="submit">{t.saveApplication.save}</button>
        <button type="button" className="secondary" onClick={() => setStep({ kind: 'closed' })}>
          {t.applicationForm.cancel}
        </button>
      </div>
    </form>
  );
}
