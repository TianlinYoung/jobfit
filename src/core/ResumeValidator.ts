// Checks that untrusted data (localStorage, imported files) really has the shape of a Resume.
//
// TypeScript types disappear at runtime, so JSON.parse(...) gives us `unknown` data that could be
// anything: an old format, a hand-edited file, or garbage. We check it field by field instead of
// trusting a type assertion.
import { allValid, FieldChecker } from './FieldChecker';
import { LIMITS } from './limits';
import type { Bullet, Experience, Resume } from './types';

export class ResumeValidator {
  /** For data the app saved itself: shape only. Returns null if anything is wrong. Extra fields are dropped. */
  static parse(raw: unknown): Resume | null {
    const checker = new FieldChecker(false);
    const resume = ResumeValidator.check(raw, checker, 'resume');
    return resume === undefined || checker.hasIssues() ? null : resume;
  }

  /** Records every problem in `checker`; returns the resume only if this part is valid. */
  static check(raw: unknown, checker: FieldChecker, path: string): Resume | undefined {
    const object = checker.object(raw, path);
    if (object === undefined) {
      return undefined;
    }
    const skills = ResumeValidator.checkSkills(object.skills, checker, `${path}.skills`);
    const experiences = ResumeValidator.checkList(object.experiences, checker, `${path}.experiences`);
    if (skills === undefined || experiences === undefined) {
      return undefined;
    }
    return { skills, experiences };
  }

  private static checkSkills(raw: unknown, checker: FieldChecker, path: string): string[] | undefined {
    const items = checker.list(raw, path, LIMITS.skills);
    if (items === undefined) {
      return undefined;
    }
    const skills = items.map((item, i) => checker.text(item, `${path}[${i}]`, LIMITS.skill));
    return allValid(skills) ? skills : undefined;
  }

  private static checkList(raw: unknown, checker: FieldChecker, path: string): Experience[] | undefined {
    const items = checker.list(raw, path, LIMITS.experiences);
    if (items === undefined) {
      return undefined;
    }
    const experiences = items.map((item, i) => ResumeValidator.checkExperience(item, checker, `${path}[${i}]`));
    return allValid(experiences) ? experiences : undefined;
  }

  private static checkExperience(raw: unknown, checker: FieldChecker, path: string): Experience | undefined {
    const object = checker.object(raw, path);
    if (object === undefined) {
      return undefined;
    }
    const id = checker.requiredText(object.id, `${path}.id`, LIMITS.id);
    const title = checker.text(object.title, `${path}.title`, LIMITS.experienceTitle);
    const organization = checker.text(object.organization, `${path}.organization`, LIMITS.organization);
    const bullets = ResumeValidator.checkBullets(object.bullets, checker, `${path}.bullets`);
    if (id === undefined || title === undefined || organization === undefined || bullets === undefined) {
      return undefined;
    }
    return { id, title, organization, bullets };
  }

  private static checkBullets(raw: unknown, checker: FieldChecker, path: string): Bullet[] | undefined {
    const items = checker.list(raw, path, LIMITS.bulletsPerExperience);
    if (items === undefined) {
      return undefined;
    }
    const bullets = items.map((item, i) => ResumeValidator.checkBullet(item, checker, `${path}[${i}]`));
    return allValid(bullets) ? bullets : undefined;
  }

  private static checkBullet(raw: unknown, checker: FieldChecker, path: string): Bullet | undefined {
    const object = checker.object(raw, path);
    if (object === undefined) {
      return undefined;
    }
    const id = checker.requiredText(object.id, `${path}.id`, LIMITS.id);
    const text = checker.text(object.text, `${path}.text`, LIMITS.bulletText);
    if (id === undefined || text === undefined) {
      return undefined;
    }
    return { id, text };
  }
}
