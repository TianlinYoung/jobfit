// Picks what to show below the JD box: an empty/error message, or the full result.
import type { MatchReport } from '../../core/types';
import { useT } from '../i18n/LanguageContext';
import { EmptyState } from '../shared/EmptyState';
import { GapList } from './GapList';
import { SaveApplicationForm } from './SaveApplicationForm';
import { ScoreSummary } from './ScoreSummary';
import { SkillBreakdownTable } from './SkillBreakdownTable';
import { UnrecognizedSkills } from './UnrecognizedSkills';

// React: props are the inputs. The callbacks let buttons here trigger actions that App handles.
interface MatchResultViewProps {
  report: MatchReport;
  isStale: boolean;
  onLoadSample: () => void;
  /** Saves the analyzed JD and this score as a new application. */
  onSaveApplication: (company: string, role: string, score: number) => void;
  onOpenBoard: () => void;
}

export function MatchResultView(props: MatchResultViewProps) {
  const { report, isStale, onLoadSample, onSaveApplication, onOpenBoard } = props;
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

  // Narrowed to number by the early return above; captured so the callback below keeps that type.
  const score = report.score;
  return (
    <div className="results">
      {isStale && (
        <p className="notice" role="status">
          {t.match.staleNotice}
        </p>
      )}
      <ScoreSummary report={report} score={report.score} />
      <SaveApplicationForm
        onSave={(company, role) => onSaveApplication(company, role, score)}
        onOpenBoard={onOpenBoard}
      />
      <UnrecognizedSkills skills={report.unrecognizedResumeSkills} />
      <SkillBreakdownTable breakdown={report.breakdown} />
      <GapList gaps={report.gaps} />
    </div>
  );
}
