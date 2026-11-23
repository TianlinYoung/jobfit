// Turns raw JD text into the list of skills it asks for, each tagged with how important it is.
import { IMPORTANCE_RANK } from './importance';
import { JdSectionSplitter } from './JdSectionSplitter';
import { TextMatcher } from './TextMatcher';
import type { ExtractedSkill, ParsedJd } from './types';

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
      for (const skillId of this.matcher.findSkillIds(line.text)) {
        this.keepMostImportant(bestBySkill, { skillId, importance: line.importance, sourceLine: line.text });
      }
    }
    return { skills: [...bestBySkill.values()], hasRequirementHeaders: split.hasRequirementHeaders };
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
