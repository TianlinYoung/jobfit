import { describe, expect, it } from 'vitest';
import { ApplicationValidator } from '../../src/core/ApplicationValidator';
import { LIMITS } from '../../src/core/limits';
import { makeApplication } from './applicationFixtures';

describe('ApplicationValidator.parseStoredList (the app\'s own saved data)', () => {
  it('returns an empty list for anything that is not a list', () => {
    expect(ApplicationValidator.parseStoredList(null)).toEqual([]);
    expect(ApplicationValidator.parseStoredList({})).toEqual([]);
  });

  it('keeps valid applications and skips broken ones', () => {
    const good = makeApplication({ id: 'good' });
    const broken = { ...makeApplication({ id: 'broken' }), status: 'Lost' };
    expect(ApplicationValidator.parseStoredList([good, broken, 'junk'])).toEqual([good]);
  });

  it('does not apply size limits to data the app saved itself', () => {
    const longNotes = makeApplication({ notes: 'x'.repeat(LIMITS.notes + 10) });
    expect(ApplicationValidator.parseStoredList([longNotes])).toEqual([longNotes]);
  });

  it('drops unknown extra fields', () => {
    const withExtra = { ...makeApplication(), salary: 999 };
    expect(ApplicationValidator.parseStoredList([withExtra])).toEqual([makeApplication()]);
  });
});
