import { describe, expect, it } from 'vitest';
import { AmbiguityRules } from '../../src/core/AmbiguityRules';

const rules = new AmbiguityRules();

/** Runs the rules on the first occurrence of `word` in `text`. */
function isFalsePositive(text: string, word: string): boolean {
  const start = text.indexOf(word);
  return rules.isFalsePositive(text, start, start + word.length);
}

describe('AmbiguityRules', () => {
  it.each([
    ['Work with our R&D team', 'R'],
    ['Partner with P&R leadership', 'R'],
    ['Present to the C-suite', 'C'],
    ['Explain the R-squared values', 'R'],
    ['Based in Washington, D.C. area', 'C'],
    ['Go above and beyond for customers', 'Go'],
    ['- Go the extra mile', 'Go'],
    ['Plan the Go-to-market launch', 'Go'],
    ['Ship it. Go further every day', 'Go'],
  ])('rejects %j', (text, word) => {
    expect(isFalsePositive(text, word)).toBe(true);
  });

  it.each([
    ['Experience with C or C++', 'C'],
    ['Strong skills in C.', 'C'],
    ['Statistics in R or Python', 'R'],
    ['Go or Rust experience', 'Go'],
    ['- Go, Python, Java', 'Go'],
    ['Backend services written in Go', 'Go'],
    ['Go', 'Go'],
  ])('accepts %j', (text, word) => {
    expect(isFalsePositive(text, word)).toBe(false);
  });

  it('ignores aliases that have no rule', () => {
    expect(isFalsePositive('Java & Kotlin', 'Java')).toBe(false);
  });
});
