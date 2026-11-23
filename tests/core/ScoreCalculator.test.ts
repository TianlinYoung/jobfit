import { describe, expect, it } from 'vitest';
import { ResumeIndex } from '../../src/core/ResumeIndex';
import { ScoreCalculator } from '../../src/core/ScoreCalculator';
import type { ExtractedSkill, Importance } from '../../src/core/types';
import { bundledDictionary, bundledMatcher, makeResume } from './fixtures';

const calculator = new ScoreCalculator(bundledDictionary());

function jdSkill(skillId: string, importance: Importance): ExtractedSkill {
  return { skillId, importance, sourceLine: `line about ${skillId}`, highlights: [] };
}

function index(skills: string[], bullets: string[] = []): ResumeIndex {
  return new ResumeIndex(makeResume(skills, bullets), bundledDictionary(), bundledMatcher());
}

describe('ScoreCalculator', () => {
  it('returns a null score when the JD has no recognized skills', () => {
    expect(calculator.calculate([], index(['Java']))).toEqual({
      score: null,
      earnedPoints: 0,
      maxPoints: 0,
      breakdown: [],
    });
  });

  it('gives 100 when every skill is in the skills list', () => {
    const result = calculator.calculate([jdSkill('java', 'required'), jdSkill('sql', 'preferred')], index(['Java', 'SQL']));
    expect(result.score).toBe(100);
  });

  it('gives 0 when nothing matches', () => {
    expect(calculator.calculate([jdSkill('java', 'required')], index(['Python'])).score).toBe(0);
  });

  it('follows the documented worked example', () => {
    // Java required + listed:        3 × 1.0 = 3
    // SQL required, only in bullet:  3 × 0.5 = 1.5
    // Docker preferred, missing:     1 × 0   = 0
    // score = round(100 × 4.5 / 7) = 64
    const result = calculator.calculate(
      [jdSkill('java', 'required'), jdSkill('sql', 'required'), jdSkill('docker', 'preferred')],
      index(['Java'], ['Wrote SQL reports for the finance team']),
    );
    expect(result.earnedPoints).toBe(4.5);
    expect(result.maxPoints).toBe(7);
    expect(result.score).toBe(64);
  });

  it('uses weight 2 for unspecified and 1 for context', () => {
    const result = calculator.calculate([jdSkill('java', 'unspecified'), jdSkill('kafka', 'context')], index(['Java']));
    expect(result.maxPoints).toBe(3);
    expect(result.score).toBe(67);
  });

  it('explains each skill: status, credit, points and evidence', () => {
    const result = calculator.calculate(
      [jdSkill('sql', 'required'), jdSkill('java', 'required')],
      index(['Java'], ['Built Java services', 'Wrote SQL reports']),
    );
    const [java, sql] = result.breakdown;
    expect(java).toMatchObject({ skillName: 'Java', status: 'listed', credit: 1, points: 3 });
    expect(java?.evidenceBullets).toEqual(['Built Java services']);
    expect(sql).toMatchObject({ skillName: 'SQL', status: 'bulletOnly', credit: 0.5, points: 1.5 });
    expect(sql?.evidenceBullets).toEqual(['Wrote SQL reports']);
    expect(sql?.sourceLine).toBe('line about sql');
  });

  it('sorts the breakdown by weight, then name', () => {
    const result = calculator.calculate(
      [jdSkill('docker', 'preferred'), jdSkill('sql', 'required'), jdSkill('java', 'required')],
      index([]),
    );
    expect(result.breakdown.map((s) => s.skillName)).toEqual(['Java', 'SQL', 'Docker']);
  });
});
