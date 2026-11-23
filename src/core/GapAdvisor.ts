// Turns each skill the resume is weak on into one structured suggestion (no user-facing text).
//
// Core decides *which* advice applies; the UI dictionaries (src/ui/i18n) decide how to say it.
// Honesty rule: a canHighlightInBullet suggestion only means "this bullet might be related".
// The UI must word it conditionally and never nudge anyone toward claiming experience they don't
// have. See docs/DECISIONS.md (D6) and tests/ui/i18n.test.ts.
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
    const base = { skillId: score.skillId, skillName: score.skillName };

    const mentioning = resume.bulletsMentioning(score.skillId)[0];
    if (mentioning !== undefined) {
      return { ...base, kind: 'addToSkillsList', bulletId: mentioning.id, bulletText: mentioning.text };
    }
    const related = this.findRelatedBullet(score.skillId, resume.allBullets());
    if (related !== null) {
      return {
        ...base,
        kind: 'canHighlightInBullet',
        bulletId: related.bullet.id,
        bulletText: related.bullet.text,
        relatedKeyword: related.keyword,
      };
    }
    return { ...base, kind: 'trulyMissing' };
  }

  /** First bullet (in resume order) containing any of the skill's related keywords. */
  private findRelatedBullet(skillId: string, bullets: Bullet[]): RelatedHit | null {
    const keywords = this.dictionary.getById(skillId)?.related ?? [];
    for (const bullet of bullets) {
      const keyword = keywords.find((k) => WordBoundary.containsKeyword(bullet.text, k));
      if (keyword !== undefined) {
        return { bullet, keyword };
      }
    }
    return null;
  }
}
