import { describe, expect, it } from 'vitest';
import { SkillDictionary } from '../../src/core/SkillDictionary';
import type { SkillEntry } from '../../src/core/types';

function entry(id: string, aliases: string[], caseSensitiveAliases?: string[]): SkillEntry {
  return { id, name: id.toUpperCase(), category: 'language', aliases, caseSensitiveAliases, related: [] };
}

describe('SkillDictionary', () => {
  const dictionary = new SkillDictionary([
    entry('javascript', ['javascript'], ['JS']),
    entry('c', [], ['C']),
    entry('cpp', ['c++']),
  ]);

  it('resolves user input case-insensitively and trims spaces', () => {
    expect(dictionary.resolve(' js ')).toBe('javascript');
    expect(dictionary.resolve('JavaScript')).toBe('javascript');
    expect(dictionary.resolve('c')).toBe('c');
  });

  it('returns null for unknown skills', () => {
    expect(dictionary.resolve('COBOL')).toBeNull();
  });

  it('sorts patterns longest first', () => {
    const lengths = dictionary.aliasPatterns().map((p) => p.alias.length);
    expect(lengths).toEqual([...lengths].sort((a, b) => b - a));
    expect(dictionary.aliasPatterns().at(-1)?.alias).toBe('C');
  });

  it('marks case-sensitive patterns', () => {
    const js = dictionary.aliasPatterns().find((p) => p.alias === 'JS');
    expect(js?.caseSensitive).toBe(true);
  });

  it('looks up names, falling back to the id', () => {
    expect(dictionary.nameOf('cpp')).toBe('CPP');
    expect(dictionary.nameOf('unknown-id')).toBe('unknown-id');
    expect(dictionary.getById('cpp')?.id).toBe('cpp');
    expect(dictionary.size()).toBe(3);
  });

  it('rejects duplicate ids', () => {
    expect(() => new SkillDictionary([entry('a', ['a']), entry('a', ['b'])])).toThrow('Duplicate skill id');
  });

  it('rejects an alias shared by two skills, regardless of case', () => {
    expect(() => new SkillDictionary([entry('a', ['go']), entry('b', [], ['Go'])])).toThrow('used by both');
  });

  it('rejects a skill with no aliases', () => {
    expect(() => new SkillDictionary([entry('a', [])])).toThrow('no aliases');
  });

  it('allows one skill to list the same spelling in two casings', () => {
    expect(() => new SkillDictionary([entry('a', ['react.js'], ['React.js'])])).not.toThrow();
  });
});
