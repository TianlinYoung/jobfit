import { describe, expect, it } from 'vitest';
import { ResumeValidator } from '../../src/core/ResumeValidator';

const VALID = {
  skills: ['Java'],
  experiences: [{ id: 'e1', title: 'Intern', organization: 'Acme', bullets: [{ id: 'b1', text: 'Built things' }] }],
};

describe('ResumeValidator', () => {
  it('accepts a valid resume', () => {
    expect(ResumeValidator.parse(VALID)).toEqual(VALID);
  });

  it('accepts an empty resume', () => {
    expect(ResumeValidator.parse({ skills: [], experiences: [] })).toEqual({ skills: [], experiences: [] });
  });

  it('drops unknown extra fields', () => {
    const withExtras = {
      ...VALID,
      version: 9,
      experiences: [{ ...VALID.experiences[0], color: 'red', bullets: [{ id: 'b1', text: 'x', stars: 5 }] }],
    };
    expect(ResumeValidator.parse(withExtras)).toEqual({
      skills: ['Java'],
      experiences: [{ id: 'e1', title: 'Intern', organization: 'Acme', bullets: [{ id: 'b1', text: 'x' }] }],
    });
  });

  it.each([
    ['null', null],
    ['a string', 'resume'],
    ['an array', []],
    ['missing skills', { experiences: [] }],
    ['non-string skill', { skills: [42], experiences: [] }],
    ['experiences not an array', { skills: [], experiences: {} }],
    ['experience not an object', { skills: [], experiences: ['x'] }],
    ['experience missing a title', { skills: [], experiences: [{ id: 'e1', organization: 'A', bullets: [] }] }],
    ['bullets not an array', { skills: [], experiences: [{ id: 'e1', title: 'T', organization: 'A', bullets: 'x' }] }],
    ['bullet without text', { skills: [], experiences: [{ id: 'e1', title: 'T', organization: 'A', bullets: [{ id: 'b1' }] }] }],
  ])('rejects %s', (_label, raw) => {
    expect(ResumeValidator.parse(raw)).toBeNull();
  });
});
