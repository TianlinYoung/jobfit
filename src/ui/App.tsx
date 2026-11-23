// Top-level component: owns the app's shared state (resume, JD text, current tab) and wires pages together.
import { useEffect, useState } from 'react';
import type { MatchService } from '../core/MatchService';
import type { Resume } from '../core/types';
import type { Repository } from '../storage/Repository';
import { useT } from './i18n/LanguageContext';
import { LanguageSelector } from './i18n/LanguageSelector';
import { MatchPage } from './match/MatchPage';
import { ResumeEditor } from './resume/ResumeEditor';
import { EMPTY_RESUME, isResumeEmpty } from './resumeDraft';
import { SAMPLE_JD, SAMPLE_RESUME } from './sampleData';
import { TabBar } from './shared/TabBar';

type TabId = 'match' | 'resume';

/** Which error to show. Stored as a key, not a sentence, so it re-translates when the language changes. */
type ErrorKind = 'loadFailed' | 'saveFailed';

// React: props are the component's inputs. App receives its dependencies from main.tsx,
// which is constructor injection in Java terms, so tests or a backend version can pass different ones.
interface AppProps {
  repository: Repository;
  matchService: MatchService;
}

export function App({ repository, matchService }: AppProps) {
  const t = useT();
  // React: each useState call is one private field of this component. Changing it via the
  // setter re-renders App and every child that receives the value as a prop.
  const [tab, setTab] = useState<TabId>('match');
  const [resume, setResume] = useState<Resume>(EMPTY_RESUME);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<ErrorKind | null>(null);
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

  async function saveResume(next: Resume) {
    // Update the screen first, then persist. If saving fails, the user still sees their edit
    // and gets an error message explaining it was not stored.
    setResume(next);
    try {
      await repository.saveResume(next);
      setError(null);
    } catch {
      setError('saveFailed');
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

  const tabs = [
    { id: 'match' as const, label: t.tabs.match },
    { id: 'resume' as const, label: t.tabs.resume },
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
          {t.app[error]}
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
          />
        ) : (
          <ResumeEditor resume={resume} onSave={(next) => void saveResume(next)} />
        )}
      </main>

      <footer className="app-footer">{t.app.footer}</footer>
    </div>
  );
}
