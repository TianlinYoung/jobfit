// Decides whether a piece of text stands on its own as a word, so "Java" is not found inside "JavaScript".

const LETTER_OR_DIGIT = /[A-Za-z0-9]/;
// After a match we also reject "+" and "#": otherwise "C" would match the start of "C++" or "C#"
// even if those skills were missing from the dictionary.
const CONTINUES_AFTER = /[A-Za-z0-9+#]/;

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
   * Case-insensitive check that some word in `text` starts with `prefix`.
   * Prefix (not whole-word) matching lets one keyword like "deploy" cover
   * "deployed" and "deployment" without needing a stemming library.
   */
  static containsWordStartingWith(text: string, prefix: string): boolean {
    const haystack = text.toLowerCase();
    const needle = prefix.toLowerCase();
    let index = haystack.indexOf(needle);
    while (index !== -1) {
      if (WordBoundary.isStartBoundary(haystack, index)) {
        return true;
      }
      index = haystack.indexOf(needle, index + 1);
    }
    return false;
  }
}
