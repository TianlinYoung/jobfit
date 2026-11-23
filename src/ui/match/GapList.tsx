// Shows one suggestion per skill the resume is weak on, with the bullet it refers to.
import type { GapSuggestion } from '../../core/types';
import { GAP_KIND_LABEL } from '../format';

// React: props are read-only inputs passed in by the parent.
interface GapListProps {
  gaps: GapSuggestion[];
}

export function GapList({ gaps }: GapListProps) {
  return (
    <section className="card">
      <h3>Suggestions</h3>
      {gaps.length === 0 ? (
        <p className="hint">Every skill in this JD is already in your skills list. Nothing to suggest.</p>
      ) : (
        <ul className="gap-list">
          {gaps.map((gap) => (
            // React: unique `key` per item; each skill gets at most one suggestion.
            <li key={gap.skillId} className={`gap gap-${gap.kind}`}>
              <div className="gap-header">
                <strong>{gap.skillName}</strong>
                <span className={`badge badge-gap-${gap.kind}`}>{GAP_KIND_LABEL[gap.kind]}</span>
              </div>
              <p>{gap.message}</p>
              {gap.bulletText !== undefined && <blockquote>{gap.bulletText}</blockquote>}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
