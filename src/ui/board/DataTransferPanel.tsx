// Export all data to a JSON file, or import one (validated first, then confirmed, then all-or-nothing).
import { useState, type ChangeEvent } from 'react';
import { ExportCodec } from '../../core/ExportCodec';
import type { ValidationIssue } from '../../core/FieldChecker';
import { LIMITS } from '../../core/limits';
import type { AppData } from '../../core/types';
import { useT } from '../i18n/LanguageContext';

const MAX_ISSUES_SHOWN = 10;

// React: props are inputs. Saving lives in App (it owns the data); this panel only handles the file.
interface DataTransferPanelProps {
  onExport: () => void;
  /** Resolves to true if the data was saved. */
  onImport: (data: AppData) => Promise<boolean>;
}

/** What to show after an import attempt. Stored as data, so it re-translates if the language changes. */
type ImportOutcome =
  | { kind: 'imported'; count: number }
  | { kind: 'rejected'; issues: ValidationIssue[] }
  | { kind: 'readFailed' }
  | { kind: 'saveFailed' };

export function DataTransferPanel({ onExport, onImport }: DataTransferPanelProps) {
  const t = useT();
  // React: useState remembers the last outcome between renders, so the message stays on screen.
  const [outcome, setOutcome] = useState<ImportOutcome | null>(null);

  async function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = ''; // allow choosing the same file again later
    if (file === undefined) {
      return;
    }
    if (file.size > LIMITS.importFile) {
      setOutcome({ kind: 'rejected', issues: [{ code: 'fileTooLarge', path: '(file)', limit: LIMITS.importFile }] });
      return;
    }
    let text: string;
    try {
      text = await file.text();
    } catch {
      setOutcome({ kind: 'readFailed' });
      return;
    }
    const result = ExportCodec.decode(text);
    if (!result.ok) {
      setOutcome({ kind: 'rejected', issues: result.issues });
      return;
    }
    const { applications, resume } = result.data;
    if (!window.confirm(t.dataTransfer.confirmImport(applications.length, resume !== null))) {
      setOutcome(null);
      return;
    }
    const saved = await onImport(result.data);
    setOutcome(saved ? { kind: 'imported', count: applications.length } : { kind: 'saveFailed' });
  }

  return (
    <section className="card data-transfer">
      <h3>{t.dataTransfer.title}</h3>
      <p className="hint">{t.dataTransfer.hint}</p>
      <div className="button-row">
        <button type="button" className="secondary" onClick={onExport}>
          {t.dataTransfer.export}
        </button>
        {/* A styled label opens the hidden file input; this is the usual way to restyle a file picker. */}
        <label className="button-like secondary">
          {t.dataTransfer.import}
          <input type="file" accept="application/json,.json" className="visually-hidden" onChange={handleFile} />
        </label>
      </div>
      {outcome !== null && <OutcomeMessage outcome={outcome} />}
    </section>
  );
}

function OutcomeMessage({ outcome }: { outcome: ImportOutcome }) {
  const t = useT();
  switch (outcome.kind) {
    case 'imported':
      return (
        <p className="success" role="status">
          {t.dataTransfer.imported(outcome.count)}
        </p>
      );
    case 'readFailed':
      return (
        <p className="form-error" role="alert">
          {t.dataTransfer.readFailed}
        </p>
      );
    case 'saveFailed':
      return (
        <p className="form-error" role="alert">
          {t.dataTransfer.saveFailed}
        </p>
      );
    case 'rejected': {
      const shown = outcome.issues.slice(0, MAX_ISSUES_SHOWN);
      const hidden = outcome.issues.length - shown.length;
      return (
        <div className="form-error" role="alert">
          <p>{t.dataTransfer.rejected}</p>
          <ul>
            {shown.map((issue, index) => (
              // React: `key` per item. Issues never reorder, so the position is a safe key here.
              <li key={index}>{t.importIssue[issue.code](issue.path, issue.limit ?? 0)}</li>
            ))}
          </ul>
          {hidden > 0 && <p>{t.dataTransfer.moreIssues(hidden)}</p>}
        </div>
      );
    }
  }
}
