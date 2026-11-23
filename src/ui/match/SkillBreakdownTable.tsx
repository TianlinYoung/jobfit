// One row per JD skill: where the JD asks for it, how much it weighs, and what the resume earned.
import { SKILLS_LIST_EVIDENCE } from '../../core/ScoreCalculator';
import type { SkillScore } from '../../core/types';
import { IMPORTANCE_LABEL, STATUS_LABEL, formatPoints } from '../format';
import { HighlightedText } from './HighlightedText';

// React: props are inputs from the parent; this component only displays them.
interface SkillBreakdownTableProps {
  breakdown: SkillScore[];
}

export function SkillBreakdownTable({ breakdown }: SkillBreakdownTableProps) {
  return (
    <section className="card">
      <h3>Score breakdown</h3>
      {/* The wrapper scrolls sideways on small screens instead of squashing the columns. */}
      <div className="table-scroll">
        <table className="breakdown">
          <thead>
            <tr>
              <th scope="col">Skill</th>
              <th scope="col">From the JD</th>
              <th scope="col">Importance</th>
              <th scope="col">Your resume</th>
              <th scope="col" className="numeric">
                Points
              </th>
            </tr>
          </thead>
          <tbody>
            {breakdown.map((row) => (
              // React: each row needs a unique `key`; a skill appears once in the breakdown.
              <tr key={row.skillId} className={`status-${row.status}`}>
                <th scope="row">{row.skillName}</th>
                <td className="source-line">
                  <HighlightedText text={row.sourceLine} ranges={row.highlights} />
                </td>
                <td>
                  {IMPORTANCE_LABEL[row.importance]} <span className="weight">×{row.weight}</span>
                </td>
                <td>
                  <span className={`badge badge-${row.status}`}>{STATUS_LABEL[row.status]}</span>
                  <EvidenceList evidence={row.evidence} />
                </td>
                <td className="numeric">
                  {formatPoints(row.points)} / {formatPoints(row.weight)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

/** Bullets that mention the skill. "Skills list" is already shown by the badge, so it is skipped here. */
function EvidenceList({ evidence }: { evidence: string[] }) {
  const bullets = evidence.filter((e) => e !== SKILLS_LIST_EVIDENCE);
  if (bullets.length === 0) {
    // React: returning null means "render nothing".
    return null;
  }
  return (
    <ul className="evidence">
      {bullets.map((text, index) => (
        // Two bullets could have identical text, so the position is the key. That is safe here
        // because this list is rebuilt from scratch and never reordered or edited in place.
        <li key={index}>“{text}”</li>
      ))}
    </ul>
  );
}
