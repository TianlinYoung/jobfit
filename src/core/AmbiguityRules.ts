// Rejects matches of very short skill names ("C", "R", "Go") that are really ordinary English.
//
// Word boundaries and case sensitivity are not enough for these: "R&D", "Washington D.C."
// and "Go above and beyond" all pass both checks. Each rule below targets one known
// false-positive pattern; anything not covered is accepted as a real match.

/** Words that typically follow the verb "go" at the start of a sentence ("Go above and beyond"). */
const WORDS_AFTER_VERB_GO = new Set([
  'above', 'after', 'ahead', 'back', 'beyond', 'big', 'deep', 'far', 'fast',
  'for', 'forward', 'from', 'further', 'get', 'live', 'out', 'the', 'through', 'to', 'with',
]);

export class AmbiguityRules {
  /** True if the match text[start, end) looks like ordinary English rather than the skill. */
  isFalsePositive(text: string, start: number, end: number): boolean {
    const matched = text.slice(start, end);
    if (matched === 'C' || matched === 'R') {
      return this.isSingleLetterFalsePositive(text, start, end);
    }
    if (matched === 'Go') {
      return this.isVerbGo(text, start, end);
    }
    return false;
  }

  private isSingleLetterFalsePositive(text: string, start: number, end: number): boolean {
    return (
      this.touchesAmpersand(text, start, end) ||
      this.isHyphenPrefix(text, end) ||
      this.isPartOfDottedAbbreviation(text, start, end)
    );
  }

  /** "R&D", "C&C", "P&R" */
  private touchesAmpersand(text: string, start: number, end: number): boolean {
    return text.charAt(start - 1) === '&' || text.charAt(end) === '&';
  }

  /** "C-suite", "C-level", "R-squared": the letter is a prefix glued to another word. */
  private isHyphenPrefix(text: string, end: number): boolean {
    return text.charAt(end) === '-' && /[A-Za-z]/.test(text.charAt(end + 1));
  }

  /**
   * "D.C.", "R.I.P.": a dot directly before the letter, or a dot directly after followed by a letter.
   * A sentence ending in "C." ("Experience with C.") is still accepted.
   */
  private isPartOfDottedAbbreviation(text: string, start: number, end: number): boolean {
    const dotBefore = text.charAt(start - 1) === '.';
    const dotThenLetterAfter = text.charAt(end) === '.' && /[A-Za-z]/.test(text.charAt(end + 1));
    return dotBefore || dotThenLetterAfter;
  }

  /** "Go-to-market", "Go-live", or a sentence that starts with the verb: "Go above and beyond". */
  private isVerbGo(text: string, start: number, end: number): boolean {
    if (text.charAt(end) === '-') {
      return true;
    }
    return this.isSentenceStart(text, start) && WORDS_AFTER_VERB_GO.has(this.nextWord(text, end));
  }

  /** Start of the line, or right after sentence punctuation or a bullet marker. */
  private isSentenceStart(text: string, start: number): boolean {
    const before = text.slice(0, start).trimEnd();
    return before === '' || /[.!?:\-*•]$/.test(before);
  }

  /** The next word after `end`, lower-cased; "" if there is none. */
  private nextWord(text: string, end: number): string {
    const match = /^\s+([A-Za-z]+)/.exec(text.slice(end));
    return match?.[1]?.toLowerCase() ?? '';
  }
}
