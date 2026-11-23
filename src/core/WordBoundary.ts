// Decides whether a piece of text stands on its own as a word, so "Java" is not found inside "JavaScript".

const LETTER_OR_DIGIT = /[A-Za-z0-9]/;
// After a match we also reject "+" and "#": otherwise "C" would match the start of "C++" or "C#"
// even if those skills were missing from the dictionary.
const CONTINUES_AFTER = /[A-Za-z0-9+#]/;

/** Keywords shorter than this are too likely to be the start of an unrelated word. */
export const MIN_PREFIX_LENGTH = 4;

export class WordBoundary {
  /** True if nothing word-like comes right before `start`. */
  static isStartBoundary(text: string, start: number): boolean {
    if (start === 0) {
      return true;
    }
    return !LETTER_OR_DIGIT.test(text.charAt(start - 1));
  }

  /** True if nothing word-like comes right after `end` (exclusive). */
  static isEndBoundary(text: string, end: number): boolean {
    if (end >= text.length) {
      return true;
    }
    return !CONTINUES_AFTER.test(text.charAt(end));
  }

  static isWholeWord(text: string, start: number, end: number): boolean {
    return WordBoundary.isStartBoundary(text, start) && WordBoundary.isEndBoundary(text, end);
  }

  /**
   * Case-insensitive keyword check used for "related" hints.
   * - Keywords of MIN_PREFIX_LENGTH+ letters match as a word prefix, so "deploy" also covers
   *   "deployed" and "deployment" without a stemming library.
   * - Shorter keywords must be a whole word: as a prefix, "app" would match "applied" and "approach".
   */
  static containsKeyword(text: string, keyword: string): boolean {
    const haystack = text.toLowerCase();
    const needle = keyword.toLowerCase();
    const wholeWordOnly = needle.length < MIN_PREFIX_LENGTH;
    let index = haystack.indexOf(needle);
    while (index !== -1) {
      const end = index + needle.length;
      const endOk = !wholeWordOnly || WordBoundary.isEndBoundary(haystack, end);
      if (WordBoundary.isStartBoundary(haystack, index) && endOk) {
        return true;
      }
      index = haystack.indexOf(needle, index + 1);
    }
    return false;
  }
}
