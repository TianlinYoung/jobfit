// Core returns structured suggestions only; wording is tested in tests/ui/i18n.test.ts.
import { describe, expect, it } from 'vitest';
import { GapAdvisor } from '../../src/core/GapAdvisor';
import { ResumeIndex } from '../../src/core/ResumeIndex';
import { ScoreCalculator } from '../../src/core/ScoreCalculator';
import type { ExtractedSkill } from '../../src/core/types';
import { bundledDictionary, bundledMatcher, makeResume } from './fixtures';

const dictionary = bundledDictionary();

/** Runs scoring + advice for required skills against a resume. */
function advise(skillIds: string[], skills: string[], bullets: string[]) {
  const resume = new ResumeIndex(makeResume(skills, bullets), dictionary, bundledMatcher());
  const jdSkills: ExtractedSkill[] = skillIds.map((skillId) => ({
    skillId,
    importance: 'required',
    sourceLine: '',
    highlights: [],
  }));
  const { breakdown } = new ScoreCalculator(dictionary).calculate(jdSkills, resume);
  return new GapAdvisor(dictionary).advise(breakdown, resume);
}

describe('GapAdvisor', () => {
  it('gives no advice for skills already in the skills list', () => {
    expect(advise(['java'], ['Java'], [])).toEqual([]);
  });

  it('suggests adding a skill that only appears in a bullet to the skills list', () => {
    expect(advise(['sql'], [], ['Wrote SQL reports'])).toEqual([
      { kind: 'addToSkillsList', skillId: 'sql', skillName: 'SQL', bulletId: 'b1', bulletText: 'Wrote SQL reports' },
    ]);
  });

  it('points at the first related bullet and reports which keyword matched', () => {
    expect(advise(['docker'], [], ['Organized team events', 'Deployed the app to a staging server'])).toEqual([
      {
        kind: 'canHighlightInBullet',
        skillId: 'docker',
        skillName: 'Docker',
        bulletId: 'b2',
        bulletText: 'Deployed the app to a staging server',
        relatedKeyword: 'deploy',
      },
    ]);
  });

  it('marks a skill with no related bullet as truly missing, with no bullet fields', () => {
    expect(advise(['kubernetes'], [], ['Tutored first-year students'])).toEqual([
      { kind: 'trulyMissing', skillId: 'kubernetes', skillName: 'Kubernetes' },
    ]);
  });

  it('does not treat "applied" or "approach" as related to mobile apps', () => {
    expect(advise(['android'], [], ['Applied a new approach to grading'])[0]?.kind).toBe('trulyMissing');
    expect(advise(['android'], [], ['Shipped two apps used by 500 students'])[0]).toMatchObject({
      kind: 'canHighlightInBullet',
      bulletId: 'b1',
      relatedKeyword: 'apps',
    });
  });

  it('marks a skill as truly missing when the resume has no bullets at all', () => {
    expect(advise(['rust'], [], [])[0]?.kind).toBe('trulyMissing');
  });

  it('handles a skill id the dictionary does not know', () => {
    expect(advise(['made-up-skill'], [], ['Deployed things'])[0]?.kind).toBe('trulyMissing');
  });

  it('returns suggestions in breakdown order', () => {
    const gaps = advise(['docker', 'sql', 'rust'], [], ['Deployed a server', 'Wrote SQL']);
    expect(gaps.map((g) => g.kind)).toEqual(['canHighlightInBullet', 'trulyMissing', 'addToSkillsList']);
  });

  it('never contains user-facing text: only the documented fields', () => {
    const gaps = advise(['docker', 'sql', 'rust'], [], ['Deployed a server', 'Wrote SQL']);
    const allowed = new Set(['kind', 'skillId', 'skillName', 'bulletId', 'bulletText', 'relatedKeyword']);
    for (const gap of gaps) {
      expect(Object.keys(gap).every((key) => allowed.has(key))).toBe(true);
    }
  });
});
