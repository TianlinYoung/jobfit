// Top-level component: owns the app's shared state (resume, applications, JD text, current tab)
// and is the only place that talks to the repository.
import { useEffect, useState } from 'react';
import { ApplicationRules, type EditableFields } from '../core/ApplicationRules';
import { CalendarDate } from '../core/CalendarDate';
import { ExportCodec } from '../core/ExportCodec';
import type { MatchService } from '../core/MatchService';
import type { AppData, Application, ApplicationStatus, Resume } from '../core/types';
import type { Repository } from '../storage/Repository';
import { BoardPage } from './board/BoardPage';
import { downloadTextFile } from './fileDownload';
import type { Messages } from './i18n/en';
import { useT } from './i18n/LanguageContext';
import { LanguageSelector } from './i18n/LanguageSelector';
import { MatchPage } from './match/MatchPage';
import { ResumeEditor } from './resume/ResumeEditor';
import { EMPTY_RESUME, isResumeEmpty } from './resumeDraft';
import { createSampleApplications } from './sampleApplications';
import { SAMPLE_JD, SAMPLE_RESUME } from './sampleData';
import { TabBar } from './shared/TabBar';

type TabId = 'match' | 'resume' | 'board';

/** Which error to show. Stored as a key, not a sentence, so it re-translates when the language changes. */
type ErrorKind = 'loadFailed' | 'resumeSaveFailed' | 'applicationSaveFailed';

function errorText(t: Messages, kind: ErrorKind): string {
  switch (kind) {
    case 'loadFailed':
      return t.app.loadFailed;
    case 'resumeSaveFailed':
      return t.app.saveFailed;
    case 'applicationSaveFailed':
      return t.board.saveFailed;
  }
}

// React: props are the component's inputs. App receives its dependencies from main.tsx,
// which is constructor injection in Java terms, so tests or a backend version can pass different ones.
interface AppProps {
  repository: Repository;
  matchService: MatchService;
  /** Returns the current instant. Injected so "today" can be controlled; defaults to the real clock. */
  clock?: () => Date;
}

export function App({ repository, matchService, clock = () => new Date() }: AppProps) {
  const t = useT();
  // React: each useState call is one private field of this component. Changing it via the
  // setter re-renders App and every child that receives the value as a prop.
  const [tab, setTab] = useState<TabId>('match');
  const [resume, setResume] = useState<Resume>(EMPTY_RESUME);
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<ErrorKind | null>(null);
  const [jdText, setJdText] = useState('');
  const [analyzedJd, setAnalyzedJd] = useState<string | null>(null);

  // Local calendar date, recomputed on every render. If the tab stays open past midnight, nothing
  // re-renders by itself, so reminders update only after the next interaction (any click or edit).
  // Known limitation; a midnight timer would fix it but is not needed for v1.
  const today = CalendarDate.today(clock());

  // React: useEffect runs code *after* the component is drawn, for work outside rendering
  // (loading data, timers). The [repository] list says "run again only if repository changes",
  // so here it runs once at startup. The returned function is cleanup, run before the next effect
  // or when App goes away; the `cancelled` flag stops a late response from updating stale state.
  useEffect(() => {
    let cancelled = false;
    Promise.all([repository.loadResume(), repository.listApplications()])
      .then(([savedResume, savedApplications]) => {
        if (!cancelled) {
          setResume(savedResume ?? EMPTY_RESUME);
          setApplications(savedApplications);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError('loadFailed');
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [repository]);

  // ---------- Resume ----------

  async function saveResume(next: Resume) {
    // Update the screen first, then persist. If saving fails, the user still sees their edit
    // and gets an error message explaining it was not stored.
    setResume(next);
    try {
      await repository.saveResume(next);
      setError(null);
    } catch {
      setError('resumeSaveFailed');
    }
  }

  function loadSampleData() {
    // Compare by content: after a page reload the saved sample is a new object, not SAMPLE_RESUME itself.
    const isAlreadySample = JSON.stringify(resume) === JSON.stringify(SAMPLE_RESUME);
    const replacesRealData = !isResumeEmpty(resume) && !isAlreadySample;
    if (replacesRealData && !window.confirm(t.app.confirmReplaceWithSample)) {
      return;
    }
    void saveResume(SAMPLE_RESUME);
    setJdText(SAMPLE_JD);
    setAnalyzedJd(SAMPLE_JD);
    setTab('match');
  }

  // ---------- Applications ----------

  async function persistApplication(application: Application) {
    // React: passing a function to the setter ("updater") uses the latest state, which matters
    // when several updates happen quickly (for example loading the samples one by one).
    setApplications((current) => [...current.filter((a) => a.id !== application.id), application]);
    try {
      await repository.saveApplication(application);
      setError(null);
    } catch {
      setError('applicationSaveFailed');
    }
  }

  function addApplication(fields: Partial<EditableFields>) {
    void persistApplication(ApplicationRules.create(fields, crypto.randomUUID(), clock()));
  }

  function updateApplication(application: Application, fields: Partial<EditableFields>) {
    void persistApplication(ApplicationRules.update(application, fields, clock()));
  }

  function changeStatus(application: Application, status: ApplicationStatus) {
    void persistApplication(ApplicationRules.changeStatus(application, status, clock()));
  }

  async function deleteApplication(application: Application) {
    setApplications((current) => current.filter((a) => a.id !== application.id));
    try {
      await repository.deleteApplication(application.id);
    } catch {
      setError('applicationSaveFailed');
    }
  }

  function loadSampleApplications() {
    // Starting all saves at once is safe: the repository reads and writes storage in one
    // synchronous step, and setApplications uses the updater form, so no save overwrites another.
    for (const application of createSampleApplications(clock())) {
      void persistApplication(application);
    }
  }

  // ---------- Import / export ----------

  function exportData() {
    const text = ExportCodec.encode({ resume: isResumeEmpty(resume) ? null : resume, applications }, clock());
    downloadTextFile(`jobfit-backup-${today}.json`, text, 'application/json');
  }

  /** Saves validated, user-confirmed data. Screen state changes only if saving worked. */
  async function importData(data: AppData): Promise<boolean> {
    try {
      await repository.replaceAll(data);
    } catch {
      return false;
    }
    setResume(data.resume ?? EMPTY_RESUME);
    setApplications(data.applications);
    setError(null);
    return true;
  }

  const tabs = [
    { id: 'match' as const, label: t.tabs.match },
    { id: 'resume' as const, label: t.tabs.resume },
    { id: 'board' as const, label: t.tabs.board },
  ];

  return (
    <div className="app">
      <header className="app-header">
        <div className="brand">
          <h1>JobFit</h1>
          <p className="tagline">{t.app.tagline}</p>
        </div>
        <LanguageSelector />
      </header>

      <TabBar tabs={tabs} activeId={tab} onSelect={setTab} ariaLabel="JobFit" />

      {error !== null && (
        <p className="error-banner" role="alert">
          {errorText(t, error)}
        </p>
      )}

      <main>
        {isLoading ? (
          <p className="hint">{t.app.loading}</p>
        ) : tab === 'match' ? (
          <MatchPage
            matchService={matchService}
            resume={resume}
            jdText={jdText}
            analyzedJd={analyzedJd}
            onJdChange={setJdText}
            onAnalyze={() => setAnalyzedJd(jdText)}
            onLoadSample={loadSampleData}
            onGoToResume={() => setTab('resume')}
            onSaveApplication={(fields) => addApplication({ ...fields, status: 'Saved' })}
            onOpenBoard={() => setTab('board')}
          />
        ) : tab === 'resume' ? (
          <ResumeEditor resume={resume} onSave={(next) => void saveResume(next)} />
        ) : (
          <BoardPage
            applications={applications}
            today={today}
            onAdd={addApplication}
            onUpdate={updateApplication}
            onChangeStatus={changeStatus}
            onDelete={(application) => void deleteApplication(application)}
            onLoadSample={loadSampleApplications}
            onExport={exportData}
            onImport={importData}
          />
        )}
      </main>

      <footer className="app-footer">{t.app.footer}</footer>
    </div>
  );
}
