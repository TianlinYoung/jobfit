// The big score number plus the arithmetic behind it ("17.5 / 26 points").
import type { MatchReport } from '../../core/types';
import { formatPoints } from '../format';

// React: props are read-only inputs from the parent. `score` is non-null here; the parent
// shows a different message when the JD has no recognized skills.
interface ScoreSummaryProps {
  report: MatchReport;
  score: number;
}

export function ScoreSummary({ report, score }: ScoreSummaryProps) {
  const listedCount = report.breakdown.filter((s) => s.status === 'listed').length;

  return (
    <section className="card score-summary" aria-label="Match score">
      <div className="score-number">
        <span className="score-value">{score}</span>
        <span className="score-max">/ 100</span>
      </div>
      <div className="score-explanation">
        <p className="score-formula">
          <strong>
            {formatPoints(report.earnedPoints)} / {formatPoints(report.maxPoints)} points
          </strong>{' '}
          = {score}%
        </p>
        <p className="hint">
          {listedCount} of {report.breakdown.length} JD skills are in your skills list.
        </p>
        <p className="hint">
          Each JD skill is worth its weight (Required ×3, Preferred ×1, mentioned elsewhere ×1). You earn the full
          weight if the skill is in your skills list, half if it only appears in a bullet, and nothing if it is
          missing.
        </p>
        {!report.hasRequirementHeaders && (
          <p className="notice">
            This JD has no Required / Preferred headings, so every skill is weighted ×2.
          </p>
        )}
      </div>
    </section>
  );
}
