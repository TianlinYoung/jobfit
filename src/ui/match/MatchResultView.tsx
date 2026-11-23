// Picks what to show below the JD box: an empty/error message, or the full result.
import type { MatchReport } from '../../core/types';
import { useT } from '../i18n/LanguageContext';
import { EmptyState } from '../shared/EmptyState';
import { GapList } from './GapList';
import { ScoreSummary } from './ScoreSummary';
import { SkillBreakdownTable } from './SkillBreakdownTable';
import { UnrecognizedSkills } from './UnrecognizedSkills';

// React: props are the inputs. The callback lets the empty state offer a button that App handles.
interface MatchResultViewProps {
  report: MatchReport;
  isStale: boolean;
  onLoadSample: () => void;
}

export function MatchResultView({ report, isStale, onLoadSample }: MatchResultViewProps) {
  const t = useT();
  if (report.score === null) {
    return (
      <EmptyState
        title={t.match.noSkillsTitle}
        message={t.match.noSkillsMessage}
        actions={
          <button type="button" className="secondary" onClick={onLoadSample}>
            {t.match.seeExample}
          </button>
        }
      />
    );
  }

  return (
    <div className="results">
      {isStale && (
        <p className="notice" role="status">
          {t.match.staleNotice}
        </p>
      )}
      <ScoreSummary report={report} score={report.score} />
      <UnrecognizedSkills skills={report.unrecognizedResumeSkills} />
      <SkillBreakdownTable breakdown={report.breakdown} />
      <GapList gaps={report.gaps} />
    </div>
  );
}
