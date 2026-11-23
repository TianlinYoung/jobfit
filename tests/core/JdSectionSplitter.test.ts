import { describe, expect, it } from 'vitest';
import { JdSectionSplitter } from '../../src/core/JdSectionSplitter';
import type { Importance } from '../../src/core/types';

const splitter = new JdSectionSplitter();

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
    const line = 'A strong understanding of distributed systems is required for this role.';
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

  it('only treats "other" headings as headings when they start with the keyword', () => {
    expect(splitter.detectHeading('About the team')?.kind).toBe('other');
    expect(splitter.detectHeading('Learn about our stack')).toBeNull();
  });
});
