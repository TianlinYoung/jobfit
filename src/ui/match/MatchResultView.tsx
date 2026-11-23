// Picks what to show below the JD box: an empty/error message, or the full result.
import type { MatchReport } from '../../core/types';
import { EmptyState } from '../shared/EmptyState';
import { GapList } from './GapList';
import { ScoreSummary } from './ScoreSummary';
import { SkillBreakdownTable } from './SkillBreakdownTable';
import { UnrecognizedSkills } from './UnrecognizedSkills';

// React: props are the inputs. The callbacks let the empty states offer buttons
// that App handles (switching tabs, loading sample data).
interface MatchResultViewProps {
  report: MatchReport;
  isStale: boolean;
  onLoadSample: () => void;
}

export function MatchResultView({ report, isStale, onLoadSample }: MatchResultViewProps) {
  if (report.score === null) {
    return (
      <EmptyState
        title="No recognizable skills in this JD"
        message="We could not find any skill from our dictionary in this text. Make sure you pasted the full job description, including the qualifications section."
        actions={
          <button type="button" className="secondary" onClick={onLoadSample}>
            See an example instead
          </button>
        }
      />
    );
  }

  return (
    <div className="results">
      {isStale && (
        <p className="notice" role="status">
          You edited the JD since the last analysis. Click Analyze to update the results.
        </p>
      )}
      <ScoreSummary report={report} score={report.score} />
      <UnrecognizedSkills skills={report.unrecognizedResumeSkills} />
      <SkillBreakdownTable breakdown={report.breakdown} />
      <GapList gaps={report.gaps} />
    </div>
  );
}
