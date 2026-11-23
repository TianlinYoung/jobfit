// Turns each skill the resume is weak on into one concrete, honest suggestion.
//
// Honesty rule: we may point at a bullet where a skill *could* be mentioned, but the wording
// is always conditional ("If you actually used X..."). The tool must never nudge anyone
// toward claiming experience they don't have. See docs/DECISIONS.md.
import { ResumeIndex } from './ResumeIndex';
import { SkillDictionary } from './SkillDictionary';
import type { Bullet, GapSuggestion, SkillScore } from './types';
import { WordBoundary } from './WordBoundary';

interface RelatedHit {
  bullet: Bullet;
  keyword: string;
}

export class GapAdvisor {
  constructor(private readonly dictionary: SkillDictionary) {}

  /** One suggestion per skill that is not in the skills list, in breakdown order. */
  advise(breakdown: SkillScore[], resume: ResumeIndex): GapSuggestion[] {
    return breakdown.filter((s) => s.status !== 'listed').map((s) => this.adviseOne(s, resume));
  }

  private adviseOne(score: SkillScore, resume: ResumeIndex): GapSuggestion {
    const mentioning = resume.bulletsMentioning(score.skillId)[0];
    if (mentioning !== undefined) {
      return this.addToSkillsList(score, mentioning);
    }
    const related = this.findRelatedBullet(score.skillId, resume.allBullets());
    if (related !== null) {
      return this.canHighlight(score, related);
    }
    return this.trulyMissing(score);
  }

  private addToSkillsList(score: SkillScore, bullet: Bullet): GapSuggestion {
    return {
      skillId: score.skillId,
      skillName: score.skillName,
      kind: 'addToSkillsList',
      bulletId: bullet.id,
      bulletText: bullet.text,
      message:
        `${score.skillName} already appears in one of your bullets but not in your skills list. ` +
        `Add it to the skills list so it is easy to spot.`,
    };
  }

  private canHighlight(score: SkillScore, hit: RelatedHit): GapSuggestion {
    return {
      skillId: score.skillId,
      skillName: score.skillName,
      kind: 'canHighlightInBullet',
      bulletId: hit.bullet.id,
      bulletText: hit.bullet.text,
      message:
        `If you actually used ${score.skillName} in this work, mention it explicitly in this bullet ` +
        `(it mentions "${hit.keyword}", which is often related). If you did not use it, leave the bullet as it is.`,
    };
  }

  private trulyMissing(score: SkillScore): GapSuggestion {
    return {
      skillId: score.skillId,
      skillName: score.skillName,
      kind: 'trulyMissing',
      message:
        `${score.skillName} does not appear anywhere in your resume. ` +
        `If you have real experience with it, add it; otherwise treat it as a skill to learn.`,
    };
  }

  /** First bullet (in resume order) containing any of the skill's related keywords. */
  private findRelatedBullet(skillId: string, bullets: Bullet[]): RelatedHit | null {
    const keywords = this.dictionary.getById(skillId)?.related ?? [];
    for (const bullet of bullets) {
      const keyword = keywords.find((k) => WordBoundary.containsWordStartingWith(bullet.text, k));
      if (keyword !== undefined) {
        return { bullet, keyword };
      }
    }
    return null;
  }
}
