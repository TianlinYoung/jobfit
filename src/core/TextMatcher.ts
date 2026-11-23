// Finds every dictionary skill mentioned in one piece of text (a JD line or a resume bullet).
import { AmbiguityRules } from './AmbiguityRules';
import type { AliasPattern } from './types';
import { WordBoundary } from './WordBoundary';

export interface TextMatch {
  skillId: string;
  start: number;
  end: number;
}

export class TextMatcher {
  /**
   * @param patterns must be sorted longest alias first (SkillDictionary does this).
   *   Longest-first plus "claimed" characters is what stops "C" from matching inside "C++":
   *   by the time "C" is tried, "C++" has already claimed those characters.
   */
  constructor(
    private readonly patterns: readonly AliasPattern[],
    private readonly rules: AmbiguityRules = new AmbiguityRules(),
  ) {}

  /** Matches in left-to-right order. A skill appears once per occurrence. */
  findAll(text: string): TextMatch[] {
    const claimed: boolean[] = new Array<boolean>(text.length).fill(false);
    const lowerText = text.toLowerCase();
    const matches: TextMatch[] = [];

    for (const pattern of this.patterns) {
      for (const start of this.occurrences(text, lowerText, pattern)) {
        const end = start + pattern.alias.length;
        if (this.isAcceptable(text, start, end, claimed)) {
          this.claim(claimed, start, end);
          matches.push({ skillId: pattern.skillId, start, end });
        }
      }
    }
    return matches.sort((a, b) => a.start - b.start);
  }

  /** Distinct skill ids mentioned in the text. */
  findSkillIds(text: string): Set<string> {
    return new Set(this.findAll(text).map((match) => match.skillId));
  }

  private isAcceptable(text: string, start: number, end: number, claimed: boolean[]): boolean {
    return (
      !this.overlapsClaimed(claimed, start, end) &&
      WordBoundary.isWholeWord(text, start, end) &&
      !this.rules.isFalsePositive(text, start, end)
    );
  }

  /** Every index where the alias appears, ignoring case unless the pattern is case-sensitive. */
  private occurrences(text: string, lowerText: string, pattern: AliasPattern): number[] {
    const haystack = pattern.caseSensitive ? text : lowerText;
    const needle = pattern.caseSensitive ? pattern.alias : pattern.alias.toLowerCase();
    const result: number[] = [];
    let index = haystack.indexOf(needle);
    while (index !== -1) {
      result.push(index);
      index = haystack.indexOf(needle, index + 1);
    }
    return result;
  }

  private overlapsClaimed(claimed: boolean[], start: number, end: number): boolean {
    for (let i = start; i < end; i++) {
      if (claimed[i]) {
        return true;
      }
    }
    return false;
  }

  private claim(claimed: boolean[], start: number, end: number): void {
    for (let i = start; i < end; i++) {
      claimed[i] = true;
    }
  }
}
