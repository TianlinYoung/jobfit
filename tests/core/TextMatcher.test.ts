import { describe, expect, it } from 'vitest';
import { TextMatcher } from '../../src/core/TextMatcher';
import { bundledMatcher } from './fixtures';

const matcher = bundledMatcher();

function ids(text: string): string[] {
  return [...matcher.findSkillIds(text)];
}

describe('TextMatcher', () => {
  it('returns nothing for empty text', () => {
    expect(matcher.findAll('')).toEqual([]);
  });

  it('prefers the longest alias: "C++" and "C#" do not also produce "C"', () => {
    expect(ids('Proficient in C++ and C#')).toEqual(['cpp', 'csharp']);
  });

  it('still finds a standalone C next to C++', () => {
    expect(ids('C/C++ experience')).toEqual(['c', 'cpp']);
  });

  it('does not find C inside Objective-C', () => {
    expect(ids('iOS apps in Objective-C')).toEqual(['ios', 'objective-c']);
  });

  it('does not find Java inside JavaScript', () => {
    expect(ids('JavaScript developer')).toEqual(['javascript']);
  });

  it('handles aliases containing dots and slashes', () => {
    expect(ids('Node.js, ASP.NET and CI/CD')).toEqual(['nodejs', 'dotnet', 'ci-cd']);
  });

  it('lets a longer multi-word alias win ("GitHub Actions" is CI/CD, not Git)', () => {
    expect(ids('Pipelines in GitHub Actions')).toEqual(['ci-cd']);
  });

  it('respects case-sensitive aliases', () => {
    expect(ids('Build UIs in React')).toEqual(['react']);
    expect(ids('Able to react quickly to change')).toEqual([]);
    expect(ids('Design REST endpoints')).toEqual(['rest']);
    expect(ids('Work with the rest of the team')).toEqual([]);
    expect(ids('Candidates who excel at communication')).toEqual([]);
    expect(ids('Advanced Excel and microsoft excel')).toEqual(['excel']);
  });

  it('matches case-insensitive aliases in any casing', () => {
    expect(ids('PYTHON and python3')).toEqual(['python']);
  });

  it('applies the ambiguity rules for short aliases', () => {
    expect(ids('Join our R&D group')).toEqual([]);
    expect(ids('Go above and beyond')).toEqual([]);
    expect(ids('Services written in Go and R')).toEqual(['go', 'r']);
  });

  it('reports every occurrence with positions, left to right', () => {
    const matches = matcher.findAll('SQL then Java then SQL');
    expect(matches.map((m) => [m.skillId, m.start])).toEqual([
      ['sql', 0],
      ['java', 9],
      ['sql', 19],
    ]);
  });

  it('finds nothing in a word that merely starts with an alias', () => {
    expect(ids('Python3x')).toEqual([]);
  });

  it('works with an empty pattern list', () => {
    expect(new TextMatcher([]).findAll('Java')).toEqual([]);
  });
});
