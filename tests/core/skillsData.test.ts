// Guards the hand-edited skills.json, because MatchService trusts its shape with a type assertion.
import { describe, expect, it } from 'vitest';
import bundledSkills from '../../src/core/data/skills.json';
import { bundledDictionary } from './fixtures';

const CATEGORIES = ['language', 'framework', 'tool', 'concept'];

describe('skills.json', () => {
  it('loads without duplicate ids or aliases', () => {
    expect(bundledDictionary().size()).toBe(bundledSkills.length);
  });

  it.each(bundledSkills.map((skill) => [skill.id, skill] as const))('%s has a valid shape', (_id, skill) => {
    expect(CATEGORIES).toContain(skill.category);
    expect(skill.name.trim()).not.toBe('');
    expect(Array.isArray(skill.aliases)).toBe(true);
    expect(Array.isArray(skill.related)).toBe(true);
  });
});
