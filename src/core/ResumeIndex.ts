// Pre-processes a resume once so each "does the resume have skill X?" question is a quick lookup.
import { SkillDictionary } from './SkillDictionary';
import { TextMatcher } from './TextMatcher';
import type { Bullet, Resume } from './types';

interface IndexedBullet {
  bullet: Bullet;
  skillIds: Set<string>;
}

export class ResumeIndex {
  private readonly listedSkillIds = new Set<string>();
  private readonly unrecognized: string[] = [];
  private readonly bullets: IndexedBullet[] = [];

  constructor(resume: Resume, dictionary: SkillDictionary, matcher: TextMatcher) {
    this.indexSkillsList(resume.skills, dictionary);
    this.indexBullets(resume, matcher);
  }

  isListed(skillId: string): boolean {
    return this.listedSkillIds.has(skillId);
  }

  /** Bullets whose text mentions the skill, in resume order. */
  bulletsMentioning(skillId: string): Bullet[] {
    return this.bullets.filter((b) => b.skillIds.has(skillId)).map((b) => b.bullet);
  }

  allBullets(): Bullet[] {
    return this.bullets.map((b) => b.bullet);
  }

  /** Skills-list entries the dictionary does not know, as the user typed them (trimmed, no duplicates). */
  unrecognizedSkills(): string[] {
    return [...this.unrecognized];
  }

  private indexSkillsList(skills: string[], dictionary: SkillDictionary): void {
    const seenUnrecognized = new Set<string>();
    for (const raw of skills) {
      const input = raw.trim();
      if (input === '') {
        continue;
      }
      const skillId = dictionary.resolve(input);
      if (skillId !== null) {
        this.listedSkillIds.add(skillId);
      } else if (!seenUnrecognized.has(input.toLowerCase())) {
        seenUnrecognized.add(input.toLowerCase());
        this.unrecognized.push(input);
      }
    }
  }

  // Bullets go through the same TextMatcher as the JD, so "Go" means the same thing on both sides.
  private indexBullets(resume: Resume, matcher: TextMatcher): void {
    for (const experience of resume.experiences) {
      for (const bullet of experience.bullets) {
        this.bullets.push({ bullet, skillIds: matcher.findSkillIds(bullet.text) });
      }
    }
  }
}
