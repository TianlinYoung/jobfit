// Converts between the stored Resume and the editable form state shown in the resume editor.
//
// The editor shows each experience's bullets as one textarea (one bullet per line), which is
// simpler to edit than a list of inputs. These helpers translate that text to Bullet objects and back.
import type { Experience, Resume } from '../core/types';

export interface ExperienceDraft {
  id: string;
  title: string;
  organization: string;
  /** One bullet per line. */
  bulletsText: string;
}

export interface ResumeDraft {
  skills: string[];
  experiences: ExperienceDraft[];
}

export const EMPTY_RESUME: Resume = { skills: [], experiences: [] };

/** "- Built X" or "• Built X" pasted from a resume → "Built X" */
const BULLET_MARKER = /^\s*([-*•]|\d+[.)])\s*/;

export function toDraft(resume: Resume): ResumeDraft {
  return {
    skills: [...resume.skills],
    experiences: resume.experiences.map((e) => ({
      id: e.id,
      title: e.title,
      organization: e.organization,
      bulletsText: e.bullets.map((b) => b.text).join('\n'),
    })),
  };
}

export function fromDraft(draft: ResumeDraft): Resume {
  return {
    skills: draft.skills.map((s) => s.trim()).filter((s) => s !== ''),
    experiences: draft.experiences.map(toExperience).filter((e) => !isExperienceBlank(e)),
  };
}

export function newExperienceDraft(id: string): ExperienceDraft {
  return { id, title: '', organization: '', bulletsText: '' };
}

/** True when there is nothing to match against: no skills and no bullets. */
export function isResumeEmpty(resume: Resume): boolean {
  const bulletCount = resume.experiences.reduce((total, e) => total + e.bullets.length, 0);
  return resume.skills.length === 0 && bulletCount === 0;
}

/**
 * Adds what the user typed to the skills list. Accepts comma-separated input ("Java, SQL"),
 * ignores blanks, and skips duplicates regardless of case.
 */
export function addSkills(skills: string[], input: string): string[] {
  const result = [...skills];
  const seen = new Set(skills.map((s) => s.toLowerCase()));
  for (const part of input.split(',')) {
    const skill = part.trim();
    if (skill !== '' && !seen.has(skill.toLowerCase())) {
      seen.add(skill.toLowerCase());
      result.push(skill);
    }
  }
  return result;
}

// Bullet ids are derived from position. They only need to be unique within one resume,
// so that a gap suggestion can point at "this bullet".
function toExperience(draft: ExperienceDraft): Experience {
  const lines = draft.bulletsText
    .split(/\r?\n/)
    .map((line) => line.replace(BULLET_MARKER, '').trim())
    .filter((line) => line !== '');
  return {
    id: draft.id,
    title: draft.title.trim(),
    organization: draft.organization.trim(),
    bullets: lines.map((text, index) => ({ id: `${draft.id}-b${index + 1}`, text })),
  };
}

function isExperienceBlank(experience: Experience): boolean {
  return experience.title === '' && experience.organization === '' && experience.bullets.length === 0;
}
