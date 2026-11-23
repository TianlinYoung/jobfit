// Turns raw JD text into the list of skills it asks for, each tagged with how important it is.
import { IMPORTANCE_RANK } from './importance';
import { JdSectionSplitter } from './JdSectionSplitter';
import { TextMatcher, type TextMatch } from './TextMatcher';
import type { ExtractedSkill, ParsedJd, TextRange } from './types';

export class JdParser {
  constructor(
    private readonly splitter: JdSectionSplitter,
    private readonly matcher: TextMatcher,
  ) {}

  parse(jdText: string): ParsedJd {
    const split = this.splitter.split(jdText);
    // Map keeps insertion order, so skills come out in the order the JD first mentions them.
    const bestBySkill = new Map<string, ExtractedSkill>();

    for (const line of split.lines) {
      const rangesBySkill = this.groupBySkill(this.matcher.findAll(line.text));
      for (const [skillId, highlights] of rangesBySkill) {
        this.keepMostImportant(bestBySkill, { skillId, importance: line.importance, sourceLine: line.text, highlights });
      }
    }
    return { skills: [...bestBySkill.values()], hasRequirementHeaders: split.hasRequirementHeaders };
  }

  /** One line can mention a skill twice ("SQL ... SQL"); keep every position for highlighting. */
  private groupBySkill(matches: TextMatch[]): Map<string, TextRange[]> {
    const result = new Map<string, TextRange[]>();
    for (const match of matches) {
      const ranges = result.get(match.skillId) ?? [];
      ranges.push({ start: match.start, end: match.end });
      result.set(match.skillId, ranges);
    }
    return result;
  }

  /**
   * A skill mentioned in both Required and Preferred counts once, as Required.
   * Counting it twice would let a JD that repeats itself inflate the maximum score.
   */
  private keepMostImportant(bestBySkill: Map<string, ExtractedSkill>, candidate: ExtractedSkill): void {
    const existing = bestBySkill.get(candidate.skillId);
    if (existing === undefined || IMPORTANCE_RANK[candidate.importance] > IMPORTANCE_RANK[existing.importance]) {
      bestBySkill.set(candidate.skillId, candidate);
    }
  }
}
