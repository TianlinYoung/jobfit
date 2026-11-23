// The Match tab: paste a JD, click Analyze, see the score. Also the landing page of the app.
import type { MatchService } from '../../core/MatchService';
import type { Resume } from '../../core/types';
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
}

export function MatchPage(props: MatchPageProps) {
  const { matchService, resume, jdText, analyzedJd, onJdChange, onAnalyze, onLoadSample, onGoToResume } = props;
  const jdIsBlank = jdText.trim() === '';

  return (
    <section className="page">
      <header className="page-header hero">
        <div>
          <h2>How well does your resume match this job?</h2>
          <p className="hint">
            Paste a job description. JobFit finds the skills it asks for, checks them against your resume, and
            shows exactly where every point comes from.
          </p>
        </div>
        <button type="button" className="secondary" onClick={onLoadSample}>
          Try with sample data
        </button>
      </header>

      <section className="card">
        <h3>
          <label htmlFor="jd-input">Job description</label>
        </h3>
        {/* React: controlled textarea. Its value comes from App's state, and each keystroke is sent back through onJdChange. */}
        <textarea
          id="jd-input"
          rows={10}
          value={jdText}
          placeholder="Paste the full job description here, including the qualifications sections."
          onChange={(event) => onJdChange(event.target.value)}
        />
        <div className="button-row">
          <button type="button" onClick={onAnalyze} disabled={jdIsBlank}>
            Analyze
          </button>
          {jdIsBlank && <span className="hint">Paste a job description to enable Analyze.</span>}
        </div>
      </section>

      <Results
        matchService={matchService}
        resume={resume}
        jdText={jdText}
        analyzedJd={analyzedJd}
        onLoadSample={onLoadSample}
        onGoToResume={onGoToResume}
      />
    </section>
  );
}

type ResultsProps = Pick<
  MatchPageProps,
  'matchService' | 'resume' | 'jdText' | 'analyzedJd' | 'onLoadSample' | 'onGoToResume'
>;

/** Everything below the JD box. Split out so each "nothing to show" case reads as one early return. */
function Results({ matchService, resume, jdText, analyzedJd, onLoadSample, onGoToResume }: ResultsProps) {
  if (analyzedJd === null) {
    return null;
  }
  if (isResumeEmpty(resume)) {
    return (
      <EmptyState
        title="Your resume is empty"
        message="Add your skills and experience bullets first, so there is something to compare against this JD."
        actions={
          <>
            <button type="button" onClick={onGoToResume}>
              Add your resume
            </button>
            <button type="button" className="secondary" onClick={onLoadSample}>
              Try with sample data
            </button>
          </>
        }
      />
    );
  }

  // Computed during render instead of stored in state: the report always matches the current
  // resume, and analysis is fast (milliseconds), so there is nothing to cache.
  const report = matchService.analyze(analyzedJd, resume);
  return <MatchResultView report={report} isStale={jdText !== analyzedJd} onLoadSample={onLoadSample} />;
}
