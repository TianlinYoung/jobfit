// Checks that untrusted data (localStorage, imported files) really has the shape of a Resume.
//
// TypeScript types disappear at runtime, so JSON.parse(...) gives us `unknown` data that could be
// anything: an old format, a hand-edited file, or garbage. We check it field by field instead of
// trusting a type assertion.
import type { Bullet, Experience, Resume } from './types';

export class ResumeValidator {
  /** Returns the resume if the data is valid, otherwise null. Extra fields are dropped. */
  static parse(raw: unknown): Resume | null {
    if (!isObject(raw) || !isStringArray(raw.skills) || !Array.isArray(raw.experiences)) {
      return null;
    }
    const experiences: Experience[] = [];
    for (const item of raw.experiences) {
      const experience = parseExperience(item);
      if (experience === null) {
        return null;
      }
      experiences.push(experience);
    }
    return { skills: raw.skills, experiences };
  }
}

function parseExperience(raw: unknown): Experience | null {
  if (!isObject(raw)) {
    return null;
  }
  const { id, title, organization, bullets } = raw;
  if (typeof id !== 'string' || typeof title !== 'string' || typeof organization !== 'string') {
    return null;
  }
  if (!Array.isArray(bullets) || !bullets.every(isBullet)) {
    return null;
  }
  return { id, title, organization, bullets: bullets.map((b) => ({ id: b.id, text: b.text })) };
}

function isBullet(raw: unknown): raw is Bullet {
  return isObject(raw) && typeof raw.id === 'string' && typeof raw.text === 'string';
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
}
