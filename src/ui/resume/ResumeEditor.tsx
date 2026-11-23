// The Resume tab: edits a draft copy of the resume and saves it when the user clicks Save.
import { useState } from 'react';
import type { Resume } from '../../core/types';
import { useT } from '../i18n/LanguageContext';
import { fromDraft, newExperienceDraft, toDraft, type ExperienceDraft } from '../resumeDraft';
import { ExperienceEditor } from './ExperienceEditor';
import { SkillListEditor } from './SkillListEditor';

// React: props are this component's inputs. `resume` is the saved version; `onSave` asks App to store a new one.
interface ResumeEditorProps {
  resume: Resume;
  onSave: (resume: Resume) => void;
}

export function ResumeEditor({ resume, onSave }: ResumeEditorProps) {
  const t = useT();
  // React: useState holds the draft between renders. The initial value is used only on the
  // first render; after that, React keeps whatever we last passed to setDraft.
  // Editing a draft (instead of the saved resume) means half-typed edits are never scored.
  const [draft, setDraft] = useState(() => toDraft(resume));

  // Derived value, recomputed on every render. No extra state is needed to know if something changed.
  const hasUnsavedChanges = JSON.stringify(fromDraft(draft)) !== JSON.stringify(resume);

  function updateExperience(updated: ExperienceDraft) {
    setDraft({ ...draft, experiences: draft.experiences.map((e) => (e.id === updated.id ? updated : e)) });
  }

  function removeExperience(id: string) {
    setDraft({ ...draft, experiences: draft.experiences.filter((e) => e.id !== id) });
  }

  function addExperience() {
    setDraft({ ...draft, experiences: [...draft.experiences, newExperienceDraft(crypto.randomUUID())] });
  }

  function save() {
    const saved = fromDraft(draft);
    onSave(saved);
    // Re-sync the form with what was actually stored (blank lines removed, text trimmed).
    setDraft(toDraft(saved));
  }

  return (
    <section className="page">
      <header className="page-header">
        <h2>{t.resume.title}</h2>
        <p className="hint">{t.resume.intro}</p>
      </header>

      <section className="card">
        <h3>{t.resume.skillsHeading}</h3>
        <SkillListEditor skills={draft.skills} onChange={(skills) => setDraft({ ...draft, skills })} />
      </section>

      <section className="card">
        <h3>{t.resume.experienceHeading}</h3>
        {draft.experiences.length === 0 && <p className="hint">{t.resume.noExperiences}</p>}
        {draft.experiences.map((experience) => (
          // React: `key` must be stable and unique. Using the id (not the array index) keeps each
          // editor attached to the right experience when one in the middle is removed.
          <ExperienceEditor
            key={experience.id}
            experience={experience}
            onChange={updateExperience}
            onRemove={() => removeExperience(experience.id)}
          />
        ))}
        <button type="button" className="secondary" onClick={addExperience}>
          {t.resume.addExperience}
        </button>
      </section>

      <div className="save-bar">
        <button type="button" onClick={save} disabled={!hasUnsavedChanges}>
          {t.resume.save}
        </button>
        <span className="hint" role="status">
          {hasUnsavedChanges ? t.resume.unsavedChanges : t.resume.allSaved}
        </span>
      </div>
    </section>
  );
}
