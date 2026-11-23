// Shared test helpers: the real dictionary plus a small builder for resumes.
import bundledSkills from '../../src/core/data/skills.json';
import { SkillDictionary } from '../../src/core/SkillDictionary';
import { TextMatcher } from '../../src/core/TextMatcher';
import type { Resume, SkillEntry } from '../../src/core/types';

export function bundledDictionary(): SkillDictionary {
  return new SkillDictionary(bundledSkills as SkillEntry[]);
}

export function bundledMatcher(): TextMatcher {
  return new TextMatcher(bundledDictionary().aliasPatterns());
}

/** A resume with one experience; bullet ids are b1, b2, ... */
export function makeResume(skills: string[], bulletTexts: string[] = []): Resume {
  return {
    skills,
    experiences: [
      {
        id: 'e1',
        title: 'Software Engineering Intern',
        organization: 'Acme',
        bullets: bulletTexts.map((text, i) => ({ id: `b${i + 1}`, text })),
      },
    ],
  };
}
