import { describe, expect, it } from 'vitest';
import { JdParser } from '../../src/core/JdParser';
import { JdSectionSplitter } from '../../src/core/JdSectionSplitter';
import { bundledMatcher } from './fixtures';

const parser = new JdParser(new JdSectionSplitter(), bundledMatcher());

describe('JdParser', () => {
  it('returns no skills for an empty JD', () => {
    expect(parser.parse('')).toEqual({ skills: [], hasRequirementHeaders: false });
  });

  it('extracts skills with their importance and source line', () => {
    const parsed = parser.parse('Requirements\n- Java and SQL\nPreferred\n- Docker');
    expect(parsed.skills).toEqual([
      { skillId: 'java', importance: 'required', sourceLine: '- Java and SQL' },
      { skillId: 'sql', importance: 'required', sourceLine: '- Java and SQL' },
      { skillId: 'docker', importance: 'preferred', sourceLine: '- Docker' },
    ]);
  });

  it('counts a skill once, keeping the most important mention', () => {
    const jd = 'Preferred\n- Python\nRequirements\n- Python, Python again';
    expect(parser.parse(jd).skills).toEqual([
      { skillId: 'python', importance: 'required', sourceLine: '- Python, Python again' },
    ]);
  });

  it('does not let a later, less important mention overwrite a more important one', () => {
    const jd = 'Requirements\n- Java\nAbout us\nWe love Java';
    expect(parser.parse(jd).skills[0]?.importance).toBe('required');
  });

  it('prefers an explicit "preferred" over an intro mention, though both weigh 1', () => {
    const jd = 'We use React.\nRequirements\n- SQL\nNice to have\n- React';
    const react = parser.parse(jd).skills.find((s) => s.skillId === 'react');
    expect(react?.importance).toBe('preferred');
  });

  it('reports whether requirement headings were found', () => {
    expect(parser.parse('Python and SQL').hasRequirementHeaders).toBe(false);
  });
});
