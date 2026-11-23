import { describe, expect, it } from 'vitest';
import { WordBoundary } from '../../src/core/WordBoundary';

describe('WordBoundary', () => {
  it('treats text edges as boundaries', () => {
    expect(WordBoundary.isWholeWord('Java', 0, 4)).toBe(true);
  });

  it('rejects a match glued to letters on either side', () => {
    expect(WordBoundary.isWholeWord('JavaScript', 0, 4)).toBe(false);
    expect(WordBoundary.isWholeWord('xJava', 1, 5)).toBe(false);
  });

  it('accepts punctuation around a word', () => {
    expect(WordBoundary.isWholeWord('(Java),', 1, 5)).toBe(true);
  });

  it('rejects "+" and "#" right after a match so "C" never matches "C++" or "C#"', () => {
    expect(WordBoundary.isEndBoundary('C++', 1)).toBe(false);
    expect(WordBoundary.isEndBoundary('C#', 1)).toBe(false);
  });

  it('finds keywords at the start of a word, case-insensitively', () => {
    expect(WordBoundary.containsWordStartingWith('Deployed the app', 'deploy')).toBe(true);
    expect(WordBoundary.containsWordStartingWith('redeployed it', 'deploy')).toBe(false);
    expect(WordBoundary.containsWordStartingWith('redeploy, then deployment', 'deploy')).toBe(true);
  });
});
