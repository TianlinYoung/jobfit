// One row per JD skill: where the JD asks for it, how much it weighs, and what the resume earned.
import type { SkillScore } from '../../core/types';
import { formatPoints } from '../format';
import { useT } from '../i18n/LanguageContext';
import { HighlightedText } from './HighlightedText';

// React: props are inputs from the parent; this component only displays them.
interface SkillBreakdownTableProps {
  breakdown: SkillScore[];
}

export function SkillBreakdownTable({ breakdown }: SkillBreakdownTableProps) {
  const t = useT();
  return (
    <section className="card">
      <h3>{t.breakdown.title}</h3>
      {/* The wrapper scrolls sideways on small screens instead of squashing the columns. */}
      <div className="table-scroll">
        <table className="breakdown">
          <thead>
            <tr>
              <th scope="col">{t.breakdown.columnSkill}</th>
              <th scope="col">{t.breakdown.columnFromJd}</th>
              <th scope="col">{t.breakdown.columnImportance}</th>
              <th scope="col">{t.breakdown.columnResume}</th>
              <th scope="col" className="numeric">
                {t.breakdown.columnPoints}
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
                  {t.importance[row.importance]} <span className="weight">×{row.weight}</span>
                </td>
                <td>
                  <span className={`badge badge-${row.status}`}>{t.status[row.status]}</span>
                  <EvidenceList bullets={row.evidenceBullets} />
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

/** Resume bullets that mention the skill, quoted under the status badge. */
function EvidenceList({ bullets }: { bullets: string[] }) {
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
