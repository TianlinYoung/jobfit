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
  const jdSkills: ExtractedSkill[] = skillIds.map((skillId) => ({ skillId, importance: 'required', sourceLine: '' }));
  const { breakdown } = new ScoreCalculator(dictionary).calculate(jdSkills, resume);
  return new GapAdvisor(dictionary).advise(breakdown, resume);
}

describe('GapAdvisor', () => {
  it('gives no advice for skills already in the skills list', () => {
    expect(advise(['java'], ['Java'], [])).toEqual([]);
  });

  it('suggests adding a skill that only appears in a bullet to the skills list', () => {
    const [gap] = advise(['sql'], [], ['Wrote SQL reports']);
    expect(gap).toMatchObject({ kind: 'addToSkillsList', bulletId: 'b1', bulletText: 'Wrote SQL reports' });
  });

  it('points at a related bullet with conditional wording only', () => {
    const [gap] = advise(['docker'], [], ['Organized team events', 'Deployed the app to a staging server']);
    expect(gap).toMatchObject({ kind: 'canHighlightInBullet', bulletId: 'b2' });
    expect(gap?.message).toMatch(/^If you actually used Docker in this work/);
    expect(gap?.message).toContain('If you did not use it, leave the bullet as it is.');
    expect(gap?.message).toContain('"deploy"');
  });

  it('marks a skill with no related bullet as truly missing', () => {
    const [gap] = advise(['kubernetes'], [], ['Tutored first-year students']);
    expect(gap?.kind).toBe('trulyMissing');
    expect(gap?.bulletId).toBeUndefined();
  });

  it('marks a skill as truly missing when the resume has no bullets at all', () => {
    expect(advise(['rust'], [], [])[0]?.kind).toBe('trulyMissing');
  });

  it('handles a skill id the dictionary does not know', () => {
    expect(advise(['made-up-skill'], [], ['Deployed things'])[0]?.kind).toBe('trulyMissing');
  });

  it('never suggests claiming experience in any message', () => {
    const gaps = advise(['docker', 'sql', 'rust'], [], ['Deployed a server', 'Wrote SQL']);
    for (const gap of gaps) {
      expect(gap.message).not.toMatch(/\b(add|write) that you (used|have)\b/i);
    }
    expect(gaps.map((g) => g.kind)).toEqual(['canHighlightInBullet', 'trulyMissing', 'addToSkillsList']);
  });
});
