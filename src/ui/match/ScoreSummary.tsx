// The big score number plus the arithmetic behind it ("17.5 / 26 points").
import type { MatchReport } from '../../core/types';
import { formatPoints } from '../format';
import { useT } from '../i18n/LanguageContext';

// React: props are read-only inputs from the parent. `score` is non-null here; the parent
// shows a different message when the JD has no recognized skills.
interface ScoreSummaryProps {
  report: MatchReport;
  score: number;
}

export function ScoreSummary({ report, score }: ScoreSummaryProps) {
  const t = useT();
  const listedCount = report.breakdown.filter((s) => s.status === 'listed').length;

  return (
    <section className="card score-summary" aria-label={t.score.ariaLabel}>
      <div className="score-number">
        <span className="score-value">{score}</span>
        <span className="score-max">/ 100</span>
      </div>
      <div className="score-explanation">
        <p className="score-formula">
          <strong>{t.score.formula(formatPoints(report.earnedPoints), formatPoints(report.maxPoints), score)}</strong>
        </p>
        <p className="hint">{t.score.listedCount(listedCount, report.breakdown.length)}</p>
        <p className="hint">{t.score.explanation}</p>
        {!report.hasRequirementHeaders && <p className="notice">{t.score.noHeadersNotice}</p>}
      </div>
    </section>
  );
}
