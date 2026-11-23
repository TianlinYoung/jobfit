import { describe, expect, it } from 'vitest';
import { MIN_PREFIX_LENGTH, WordBoundary } from '../../src/core/WordBoundary';

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

  describe('containsKeyword', () => {
    it('matches keywords of 4+ letters as a word prefix, case-insensitively', () => {
      expect(WordBoundary.containsKeyword('Deployed the service', 'deploy')).toBe(true);
      expect(WordBoundary.containsKeyword('redeployed it', 'deploy')).toBe(false);
      expect(WordBoundary.containsKeyword('redeploy, then deployment', 'deploy')).toBe(true);
    });

    it('treats exactly 4 letters as long enough for prefix matching', () => {
      expect(MIN_PREFIX_LENGTH).toBe(4);
      expect(WordBoundary.containsKeyword('Wrote apps for Android', 'apps')).toBe(true);
      expect(WordBoundary.containsKeyword('Ran tests nightly', 'test')).toBe(true);
    });

    it('only matches keywords shorter than 4 letters as whole words', () => {
      expect(WordBoundary.containsKeyword('Applied a new approach', 'app')).toBe(false);
      expect(WordBoundary.containsKeyword('Built the app.', 'app')).toBe(true);
      expect(WordBoundary.containsKeyword('Exposed an API, then another api', 'api')).toBe(true);
      expect(WordBoundary.containsKeyword('Fixed rapid UI bugs', 'api')).toBe(false);
    });
  });
});
