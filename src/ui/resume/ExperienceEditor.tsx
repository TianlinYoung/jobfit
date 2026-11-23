// Edits one experience: title, organization, and its bullets (one per line).
import type { ExperienceDraft } from '../resumeDraft';

// React: props are read-only inputs. To "change" the experience, we build a new object
// and hand it to the parent via onChange. We never mutate `experience` directly.
interface ExperienceEditorProps {
  experience: ExperienceDraft;
  onChange: (experience: ExperienceDraft) => void;
  onRemove: () => void;
}

export function ExperienceEditor({ experience, onChange, onRemove }: ExperienceEditorProps) {
  // Returns a copy with one field replaced; `...experience` copies all existing fields.
  function update(field: keyof Omit<ExperienceDraft, 'id'>, value: string) {
    onChange({ ...experience, [field]: value });
  }

  const titleId = `${experience.id}-title`;
  const orgId = `${experience.id}-org`;
  const bulletsId = `${experience.id}-bullets`;

  return (
    <fieldset className="experience">
      <legend className="visually-hidden">Experience</legend>
      <div className="field-row">
        <div className="field">
          <label htmlFor={titleId}>Title</label>
          {/* React: controlled input. The value comes from props and every edit goes back up through onChange. */}
          <input id={titleId} type="text" value={experience.title} onChange={(e) => update('title', e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor={orgId}>Organization</label>
          <input
            id={orgId}
            type="text"
            value={experience.organization}
            onChange={(e) => update('organization', e.target.value)}
          />
        </div>
      </div>
      <div className="field">
        <label htmlFor={bulletsId}>Bullets (one per line)</label>
        <textarea
          id={bulletsId}
          rows={4}
          value={experience.bulletsText}
          placeholder={'Built a REST API in Java for ...\nCut query time by 80% by ...'}
          onChange={(e) => update('bulletsText', e.target.value)}
        />
      </div>
      <button type="button" className="link-button danger" onClick={onRemove}>
        Remove this experience
      </button>
    </fieldset>
  );
}
