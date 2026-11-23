// Edits the skills list: type a skill (or "Java, SQL"), press Enter or Add, remove with ×.
import { useState, type FormEvent } from 'react';
import { addSkills } from '../resumeDraft';

// React: props are inputs from the parent. This component does not own the skills list;
// it shows `skills` and asks the parent to change it through `onChange`.
interface SkillListEditorProps {
  skills: string[];
  onChange: (skills: string[]) => void;
}

export function SkillListEditor({ skills, onChange }: SkillListEditorProps) {
  // React: useState gives this component a private field that survives re-renders.
  // It returns the current value and a setter; calling the setter makes React re-render.
  const [input, setInput] = useState('');

  function handleSubmit(event: FormEvent) {
    event.preventDefault(); // stop the browser from reloading the page on form submit
    onChange(addSkills(skills, input));
    setInput('');
  }

  return (
    <div className="skill-editor">
      <form className="inline-form" onSubmit={handleSubmit}>
        <label className="visually-hidden" htmlFor="skill-input">
          Add a skill
        </label>
        {/* React: a "controlled input": its value always comes from state, and every keystroke
            updates state through onChange. The state, not the DOM, is the source of truth. */}
        <input
          id="skill-input"
          type="text"
          value={input}
          placeholder="e.g. Java, SQL, React"
          onChange={(event) => setInput(event.target.value)}
        />
        <button type="submit" disabled={input.trim() === ''}>
          Add
        </button>
      </form>

      {skills.length === 0 ? (
        <p className="hint">No skills yet. Add the ones listed on your resume.</p>
      ) : (
        <ul className="chip-list">
          {skills.map((skill) => (
            // React: `key` identifies each list item between renders. Skills are unique
            // (addSkills skips duplicates), so the text itself works as a key.
            <li key={skill} className="chip">
              {skill}
              <button
                type="button"
                className="chip-remove"
                aria-label={`Remove ${skill}`}
                onClick={() => onChange(skills.filter((s) => s !== skill))}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
