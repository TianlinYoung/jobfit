import { describe, expect, it } from 'vitest';
import { JdSectionSplitter } from '../../src/core/JdSectionSplitter';
import type { Importance } from '../../src/core/types';
import { bundledMatcher } from './fixtures';

const splitter = new JdSectionSplitter(bundledMatcher());

/** [text, importance] pairs, which are easier to read in assertions than objects. */
function classify(jd: string): [string, Importance][] {
  return splitter.split(jd).lines.map((line) => [line.text, line.importance]);
}

describe('JdSectionSplitter', () => {
  it('returns no lines for empty or blank input', () => {
    expect(splitter.split('')).toEqual({ lines: [], hasRequirementHeaders: false });
    expect(splitter.split('  \n\n ').lines).toEqual([]);
  });

  it('labels lines under Required and Preferred headings', () => {
    const jd = ['Requirements', '- Java', 'Preferred Qualifications', '- Docker'].join('\n');
    expect(classify(jd)).toEqual([
      ['- Java', 'required'],
      ['- Docker', 'preferred'],
    ]);
  });

  it('marks text before the first heading as context when headings exist', () => {
    const jd = ['We are a fintech using Kafka.', 'Minimum Qualifications:', '- SQL'].join('\n');
    expect(classify(jd)).toEqual([
      ['We are a fintech using Kafka.', 'context'],
      ['- SQL', 'required'],
    ]);
    expect(splitter.split(jd).hasRequirementHeaders).toBe(true);
  });

  it('marks everything unspecified when the JD has no requirement headings', () => {
    const jd = ['About the role', 'You will write Python.', 'Experience with SQL.'].join('\n');
    expect(classify(jd)).toEqual([
      ['You will write Python.', 'unspecified'],
      ['Experience with SQL.', 'unspecified'],
    ]);
    expect(splitter.split(jd).hasRequirementHeaders).toBe(false);
  });

  it('ends a requirements section at a non-requirement heading such as Benefits', () => {
    const jd = ['Requirements', '- Java', 'Benefits', '- Free AWS credits'].join('\n');
    expect(classify(jd)).toEqual([
      ['- Java', 'required'],
      ['- Free AWS credits', 'context'],
    ]);
  });

  it('keeps content written on the same line as a heading', () => {
    expect(classify('Requirements: Java, SQL')).toEqual([['Java, SQL', 'required']]);
  });

  it('understands markdown and bold headings', () => {
    expect(classify('## **Nice to Have**\n- Rust')).toEqual([['- Rust', 'preferred']]);
  });

  it('does not treat a long sentence containing "required" as a heading', () => {
    // No skill in this sentence, so only the length rule keeps it from being a heading.
    const line = 'A strong understanding of our customers is required for this role.';
    expect(classify(line)).toEqual([[line, 'unspecified']]);
  });

  it('does not treat a bulleted line as a heading', () => {
    expect(classify('Preferred\n- Java required')).toEqual([['- Java required', 'preferred']]);
  });

  it('downgrades a single line that says "a plus" to preferred', () => {
    const jd = ['Requirements', '- Java', '- Kubernetes experience is a plus'].join('\n');
    expect(classify(jd)).toEqual([
      ['- Java', 'required'],
      ['- Kubernetes experience is a plus', 'preferred'],
    ]);
  });

  it('applies the "a plus" rule even without headings', () => {
    expect(classify('Python. Go is a plus.')).toEqual([['Python. Go is a plus.', 'preferred']]);
  });

  it('handles Windows line endings', () => {
    expect(classify('Requirements\r\n- Java\r\n')).toEqual([['- Java', 'required']]);
  });

  describe('short lines that name a skill are content, not headings', () => {
    it('keeps "Experience with React preferred" as a preferred content line', () => {
      const jd = ['Requirements', 'Experience with React preferred', 'Java'].join('\n');
      expect(classify(jd)).toEqual([
        ['Experience with React preferred', 'preferred'],
        ['Java', 'required'],
      ]);
    });

    it('keeps "Bonus points if you know Rust" as a preferred content line', () => {
      const jd = ['Requirements', 'Java', 'Bonus points if you know Rust', 'SQL'].join('\n');
      expect(classify(jd)).toEqual([
        ['Java', 'required'],
        ['Bonus points if you know Rust', 'preferred'],
        // Still required: the Rust line did not start a Preferred section.
        ['SQL', 'required'],
      ]);
    });

    it('keeps "About 2 years of Python experience" without turning later lines into context', () => {
      const jd = ['Requirements', 'About 2 years of Python experience', 'Knowledge of SQL'].join('\n');
      expect(classify(jd)).toEqual([
        ['About 2 years of Python experience', 'required'],
        ['Knowledge of SQL', 'required'],
      ]);
    });

    it('still reads a skill-free heading before a colon, keeping the skills after it', () => {
      expect(splitter.detectHeading('Nice to have: Rust')).toEqual({ kind: 'preferred', trailingContent: 'Rust' });
      expect(splitter.detectHeading('Rust: nice to have')).toBeNull();
    });
  });

  it('only treats "other" headings as headings when they start with the keyword', () => {
    expect(splitter.detectHeading('About the team')?.kind).toBe('other');
    expect(splitter.detectHeading('Learn about our stack')).toBeNull();
  });
});
