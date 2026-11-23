// Lists resume skills the dictionary does not know, so the user understands why they earned nothing.
import { useT } from '../i18n/LanguageContext';

// React: props are inputs from the parent.
interface UnrecognizedSkillsProps {
  skills: string[];
}

export function UnrecognizedSkills({ skills }: UnrecognizedSkillsProps) {
  const t = useT();
  if (skills.length === 0) {
    // React: a component may return null to draw nothing at all.
    return null;
  }
  return (
    <section className="card notice-card" aria-label={t.unrecognized.ariaLabel}>
      <h3>{t.unrecognized.title}</h3>
      <p>{t.unrecognized.message}</p>
      <ul className="chip-list">
        {skills.map((skill) => (
          // React: `key` identifies each list item; the list has no duplicates.
          <li key={skill} className="chip muted">
            {skill}
          </li>
        ))}
      </ul>
    </section>
  );
}
