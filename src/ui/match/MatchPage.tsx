// The Match tab: paste a JD, click Analyze, see the score. Also the landing page of the app.
import type { MatchService } from '../../core/MatchService';
import type { Resume } from '../../core/types';
import { useT } from '../i18n/LanguageContext';
import { isResumeEmpty } from '../resumeDraft';
import { EmptyState } from '../shared/EmptyState';
import { MatchResultView } from './MatchResultView';

// React: props are this component's inputs. MatchPage keeps no state of its own; App owns the
// JD text and the resume, and this page reports user actions back through the callbacks.
interface MatchPageProps {
  matchService: MatchService;
  resume: Resume;
  jdText: string;
  /** The JD text at the moment Analyze was clicked; null if never analyzed. */
  analyzedJd: string | null;
  onJdChange: (text: string) => void;
  onAnalyze: () => void;
  onLoadSample: () => void;
  onGoToResume: () => void;
  /** Creates an application from the analyzed JD and its score. */
  onSaveApplication: (fields: { company: string; role: string; jdText: string; lastScore: number }) => void;
  onOpenBoard: () => void;
}

export function MatchPage(props: MatchPageProps) {
  const { matchService, resume, jdText, analyzedJd, onJdChange, onAnalyze, onLoadSample, onGoToResume } = props;
  const { onSaveApplication, onOpenBoard } = props;
  // useT() returns the dictionary for the current language (see i18n/LanguageContext.tsx).
  const t = useT();
  const jdIsBlank = jdText.trim() === '';

  return (
    <section className="page">
      <header className="page-header hero">
        <div>
          <h2>{t.match.heroTitle}</h2>
          <p className="hint">{t.match.heroIntro}</p>
        </div>
        <button type="button" id="try-sample" className="secondary" onClick={onLoadSample}>
          {t.match.trySample}
        </button>
      </header>

      <section className="card">
        <div className="label-row">
          <h3>
            <label htmlFor="jd-input">{t.match.jdLabel}</label>
          </h3>
          <span className="hint">{t.match.jdLanguageNote}</span>
        </div>
        {/* React: controlled textarea. Its value comes from App's state, and each keystroke is sent back through onJdChange. */}
        <textarea
          id="jd-input"
          rows={10}
          value={jdText}
          placeholder={t.match.jdPlaceholder}
          onChange={(event) => onJdChange(event.target.value)}
        />
        <div className="button-row">
          <button type="button" onClick={onAnalyze} disabled={jdIsBlank}>
            {t.match.analyze}
          </button>
          {jdIsBlank && <span className="hint">{t.match.jdBlankHint}</span>}
        </div>
      </section>

      <Results
        matchService={matchService}
        resume={resume}
        jdText={jdText}
        analyzedJd={analyzedJd}
        onLoadSample={onLoadSample}
        onGoToResume={onGoToResume}
        onSaveApplication={onSaveApplication}
        onOpenBoard={onOpenBoard}
      />
    </section>
  );
}

type ResultsProps = Pick<
  MatchPageProps,
  'matchService' | 'resume' | 'jdText' | 'analyzedJd' | 'onLoadSample' | 'onGoToResume' | 'onSaveApplication' | 'onOpenBoard'
>;

/** Everything below the JD box. Split out so each "nothing to show" case reads as one early return. */
function Results(props: ResultsProps) {
  const { matchService, resume, jdText, analyzedJd, onLoadSample, onGoToResume, onSaveApplication, onOpenBoard } = props;
  const t = useT();
  if (analyzedJd === null) {
    return null;
  }
  if (isResumeEmpty(resume)) {
    return (
      <EmptyState
        title={t.match.resumeEmptyTitle}
        message={t.match.resumeEmptyMessage}
        actions={
          <>
            <button type="button" onClick={onGoToResume}>
              {t.match.addYourResume}
            </button>
            <button type="button" className="secondary" onClick={onLoadSample}>
              {t.match.trySample}
            </button>
          </>
        }
      />
    );
  }

  // Computed during render instead of stored in state: the report always matches the current
  // resume, and analysis is fast (milliseconds), so there is nothing to cache.
  const report = matchService.analyze(analyzedJd, resume);
  return (
    <MatchResultView
      report={report}
      isStale={jdText !== analyzedJd}
      onLoadSample={onLoadSample}
      onSaveApplication={(company, role, score) =>
        // Save the JD that produced this score, even if the text box was edited since.
        onSaveApplication({ company, role, jdText: analyzedJd, lastScore: score })
      }
      onOpenBoard={onOpenBoard}
    />
  );
}
