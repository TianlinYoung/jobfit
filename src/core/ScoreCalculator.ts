// Computes the 0–100 match score and an itemized breakdown of where every point came from.
//
// Formula: score = round(100 × Σ(weight × credit) / Σ weight)
//   weight: required 3, unspecified 2, preferred 1, context 1   (see importance.ts)
//   credit: listed 1.0, bulletOnly 0.5, missing 0
import { IMPORTANCE_WEIGHT, STATUS_CREDIT } from './importance';
import { ResumeIndex } from './ResumeIndex';
import { SkillDictionary } from './SkillDictionary';
import type { ExtractedSkill, MatchStatus, SkillScore } from './types';

export interface ScoreResult {
  score: number | null;
  earnedPoints: number;
  maxPoints: number;
  breakdown: SkillScore[];
}

export class ScoreCalculator {
  constructor(private readonly dictionary: SkillDictionary) {}

  calculate(jdSkills: ExtractedSkill[], resume: ResumeIndex): ScoreResult {
    const breakdown = jdSkills.map((skill) => this.scoreOne(skill, resume)).sort(this.byWeightThenName);
    const earnedPoints = this.sum(breakdown.map((s) => s.points));
    const maxPoints = this.sum(breakdown.map((s) => s.weight));
    return { score: this.toPercent(earnedPoints, maxPoints), earnedPoints, maxPoints, breakdown };
  }

  private scoreOne(skill: ExtractedSkill, resume: ResumeIndex): SkillScore {
    const bulletTexts = resume.bulletsMentioning(skill.skillId).map((b) => b.text);
    const status = this.statusOf(resume.isListed(skill.skillId), bulletTexts.length > 0);
    const weight = IMPORTANCE_WEIGHT[skill.importance];
    const credit = STATUS_CREDIT[status];
    return {
      skillId: skill.skillId,
      skillName: this.dictionary.nameOf(skill.skillId),
      importance: skill.importance,
      weight,
      status,
      credit,
      points: weight * credit,
      evidenceBullets: bulletTexts,
      sourceLine: skill.sourceLine,
      highlights: skill.highlights,
    };
  }

  private statusOf(isListed: boolean, inBullets: boolean): MatchStatus {
    if (isListed) {
      return 'listed';
    }
    return inBullets ? 'bulletOnly' : 'missing';
  }

  /** null instead of 0 or 100: with no recognized skills, any number would be made up. */
  private toPercent(earned: number, max: number): number | null {
    if (max === 0) {
      return null;
    }
    return Math.round((100 * earned) / max);
  }

  private sum(values: number[]): number {
    return values.reduce((total, value) => total + value, 0);
  }

  // Most important skills first, so the top of the table explains most of the score.
  private byWeightThenName(a: SkillScore, b: SkillScore): number {
    return b.weight - a.weight || a.skillName.localeCompare(b.skillName);
  }
}
