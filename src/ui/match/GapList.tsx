// Shows one suggestion per skill the resume is weak on, with the bullet it refers to.
import type { GapSuggestion } from '../../core/types';
import { gapMessage } from '../i18n/gapMessage';
import { useT } from '../i18n/LanguageContext';

// React: props are read-only inputs passed in by the parent.
interface GapListProps {
  gaps: GapSuggestion[];
}

export function GapList({ gaps }: GapListProps) {
  const t = useT();
  return (
    <section className="card">
      <h3>{t.gaps.title}</h3>
      {gaps.length === 0 ? (
        <p className="hint">{t.gaps.none}</p>
      ) : (
        <ul className="gap-list">
          {gaps.map((gap) => (
            // React: unique `key` per item; each skill gets at most one suggestion.
            <li key={gap.skillId} className={`gap gap-${gap.kind}`}>
              <div className="gap-header">
                <strong>{gap.skillName}</strong>
                <span className={`badge badge-gap-${gap.kind}`}>{t.gaps.kindLabel[gap.kind]}</span>
              </div>
              <p>{gapMessage(t, gap)}</p>
              {/* Only two of the three kinds point at a bullet; `in` checks which one we have. */}
              {'bulletText' in gap && <blockquote>{gap.bulletText}</blockquote>}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
