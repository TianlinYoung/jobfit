import { describe, expect, it } from 'vitest';
import { ResumeIndex } from '../../src/core/ResumeIndex';
import { bundledDictionary, bundledMatcher, makeResume } from './fixtures';

function index(skills: string[], bullets: string[] = []): ResumeIndex {
  return new ResumeIndex(makeResume(skills, bullets), bundledDictionary(), bundledMatcher());
}

describe('ResumeIndex', () => {
  it('normalizes skills-list aliases to skill ids', () => {
    const resume = index(['JS', 'golang', 'c++']);
    expect(resume.isListed('javascript')).toBe(true);
    expect(resume.isListed('go')).toBe(true);
    expect(resume.isListed('cpp')).toBe(true);
    expect(resume.isListed('java')).toBe(false);
  });

  it('collects unrecognized skills once each, as typed, ignoring blanks', () => {
    const resume = index(['COBOL', ' cobol ', '', '   ', 'Lisp', 'Java']);
    expect(resume.unrecognizedSkills()).toEqual(['COBOL', 'Lisp']);
  });

  it('finds bullets that mention a skill', () => {
    const resume = index([], ['Built a REST API in Flask', 'Wrote unit tests with pytest']);
    expect(resume.bulletsMentioning('flask').map((b) => b.id)).toEqual(['b1']);
    expect(resume.bulletsMentioning('rest').map((b) => b.id)).toEqual(['b1']);
    expect(resume.bulletsMentioning('java')).toEqual([]);
    expect(resume.allBullets()).toHaveLength(2);
  });

  it('applies the same ambiguity rules to bullets as to the JD', () => {
    const resume = index([], ['Go above and beyond on the R&D team']);
    expect(resume.bulletsMentioning('go')).toEqual([]);
    expect(resume.bulletsMentioning('r')).toEqual([]);
  });

  it('handles a resume with no experiences', () => {
    const resume = new ResumeIndex({ skills: [], experiences: [] }, bundledDictionary(), bundledMatcher());
    expect(resume.allBullets()).toEqual([]);
  });
});
