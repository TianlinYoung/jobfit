// Lists resume skills the dictionary does not know, so the user understands why they earned nothing.

// React: props are inputs from the parent.
interface UnrecognizedSkillsProps {
  skills: string[];
}

export function UnrecognizedSkills({ skills }: UnrecognizedSkillsProps) {
  if (skills.length === 0) {
    // React: a component may return null to draw nothing at all.
    return null;
  }
  return (
    <section className="card notice-card" aria-label="Unrecognized skills">
      <h3>Skills we could not compare</h3>
      <p>
        These skills from your resume are not in the skill dictionary, so they were not scored. Check the spelling
        or use a common name (for example "Spring Boot" instead of "Spring").
      </p>
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
