// Top-level component: owns the app's shared state (resume, JD text, current tab) and wires pages together.
import { useEffect, useState } from 'react';
import type { MatchService } from '../core/MatchService';
import type { Resume } from '../core/types';
import type { Repository } from '../storage/Repository';
import { MatchPage } from './match/MatchPage';
import { ResumeEditor } from './resume/ResumeEditor';
import { EMPTY_RESUME, isResumeEmpty } from './resumeDraft';
import { SAMPLE_JD, SAMPLE_RESUME } from './sampleData';
import { TabBar, type Tab } from './shared/TabBar';

type TabId = 'match' | 'resume';

const TABS: Tab<TabId>[] = [
  { id: 'match', label: 'Match a job' },
  { id: 'resume', label: 'My resume' },
];

// React: props are the component's inputs. App receives its dependencies from main.tsx,
// which is constructor injection in Java terms, so tests or a backend version can pass different ones.
interface AppProps {
  repository: Repository;
  matchService: MatchService;
}

export function App({ repository, matchService }: AppProps) {
  // React: each useState call is one private field of this component. Changing it via the
  // setter re-renders App and every child that receives the value as a prop.
  const [tab, setTab] = useState<TabId>('match');
  const [resume, setResume] = useState<Resume>(EMPTY_RESUME);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [jdText, setJdText] = useState('');
  const [analyzedJd, setAnalyzedJd] = useState<string | null>(null);

  // React: useEffect runs code *after* the component is drawn, for work outside rendering
  // (loading data, timers). The [repository] list says "run again only if repository changes",
  // so here it runs once at startup. The returned function is cleanup, run before the next effect
  // or when App goes away; the `cancelled` flag stops a late response from updating stale state.
  useEffect(() => {
    let cancelled = false;
    repository
      .loadResume()
      .then((saved) => {
        if (!cancelled) {
          setResume(saved ?? EMPTY_RESUME);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setErrorMessage('Could not read your saved resume. You can still use the app, but changes may not be saved.');
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

  async function saveResume(next: Resume) {
    // Update the screen first, then persist. If saving fails, the user still sees their edit
    // and gets an error message explaining it was not stored.
    setResume(next);
    try {
      await repository.saveResume(next);
      setErrorMessage(null);
    } catch {
      setErrorMessage('Could not save your resume (browser storage may be full or disabled).');
    }
  }

  function loadSampleData() {
    // Compare by content: after a page reload the saved sample is a new object, not SAMPLE_RESUME itself.
    const isAlreadySample = JSON.stringify(resume) === JSON.stringify(SAMPLE_RESUME);
    const replacesRealData = !isResumeEmpty(resume) && !isAlreadySample;
    if (replacesRealData && !window.confirm('Replace your saved resume with the sample resume?')) {
      return;
    }
    void saveResume(SAMPLE_RESUME);
    setJdText(SAMPLE_JD);
    setAnalyzedJd(SAMPLE_JD);
    setTab('match');
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>JobFit</h1>
        <p className="tagline">Internship tracker and job-description matcher</p>
      </header>

      <TabBar tabs={TABS} activeId={tab} onSelect={setTab} />

      {errorMessage !== null && (
        <p className="error-banner" role="alert">
          {errorMessage}
        </p>
      )}

      <main>
        {isLoading ? (
          <p className="hint">Loading your resume…</p>
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
          />
        ) : (
          <ResumeEditor resume={resume} onSave={(next) => void saveResume(next)} />
        )}
      </main>

      <footer className="app-footer">
        Everything runs in your browser. Nothing is uploaded.
      </footer>
    </div>
  );
}
