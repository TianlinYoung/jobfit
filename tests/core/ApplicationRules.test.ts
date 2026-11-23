import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { restoreTimeZone, setTimeZone } from '../timeZone';
import { ApplicationRules } from '../../src/core/ApplicationRules';
import { makeApplication } from './applicationFixtures';

// Pin the time zone so "today" is predictable: 2026-11-23 18:00 UTC is 10:00 in Seattle.
beforeAll(() => setTimeZone('America/Los_Angeles'));
afterAll(restoreTimeZone);

const NOW = new Date('2026-11-23T18:00:00.000Z');
const LATER = new Date('2026-11-25T18:00:00.000Z');

describe('ApplicationRules.create', () => {
  it('fills defaults for a Saved application and trims text', () => {
    expect(ApplicationRules.create({ company: ' Acme ', role: ' Intern ' }, 'id-1', NOW)).toEqual({
      id: 'id-1',
      company: 'Acme',
      role: 'Intern',
      status: 'Saved',
      appliedDate: null,
      followUpDate: null,
      notes: '',
      jdText: '',
      lastScore: null,
      createdAt: '2026-11-23T18:00:00.000Z',
      updatedAt: '2026-11-23T18:00:00.000Z',
    });
  });

  it('treats missing company and role as empty (the form requires them before calling create)', () => {
    expect(ApplicationRules.create({}, 'id', NOW)).toMatchObject({ company: '', role: '' });
  });

  it('assumes "applied today" and a follow-up 7 days later when created as Applied', () => {
    const application = ApplicationRules.create({ company: 'A', role: 'R', status: 'Applied' }, 'id', NOW);
    expect(application.appliedDate).toBe('2026-11-23');
    expect(application.followUpDate).toBe('2026-11-30');
  });

  it('bases the default follow-up on the applied date the user gave', () => {
    const application = ApplicationRules.create(
      { company: 'A', role: 'R', status: 'Applied', appliedDate: '2026-11-01' },
      'id',
      NOW,
    );
    expect(application.followUpDate).toBe('2026-11-08');
  });

  it('never overwrites dates the user set', () => {
    const application = ApplicationRules.create(
      { company: 'A', role: 'R', status: 'OA', appliedDate: '2026-11-01', followUpDate: '2026-12-01' },
      'id',
      NOW,
    );
    expect(application.followUpDate).toBe('2026-12-01');
  });

  it('keeps the JD text and score when saved from the Match page', () => {
    const application = ApplicationRules.create({ company: 'A', role: 'R', jdText: 'JD', lastScore: 67 }, 'id', NOW);
    expect(application).toMatchObject({ jdText: 'JD', lastScore: 67, status: 'Saved' });
  });
});

describe('ApplicationRules.update / changeStatus', () => {
  it('fills dates when moving from Saved to Applied', () => {
    const saved = makeApplication({ status: 'Saved', appliedDate: null, followUpDate: null });
    const applied = ApplicationRules.changeStatus(saved, 'Applied', LATER);
    expect(applied).toMatchObject({ status: 'Applied', appliedDate: '2026-11-25', followUpDate: '2026-12-02' });
    expect(applied.updatedAt).toBe('2026-11-25T18:00:00.000Z');
    expect(applied.createdAt).toBe(saved.createdAt);
  });

  it('does not refill a follow-up the user cleared while the status stays the same', () => {
    const application = makeApplication({ status: 'Applied' });
    expect(ApplicationRules.update(application, { followUpDate: null }, LATER).followUpDate).toBeNull();
  });

  it('leaves dates alone when moving to a final status', () => {
    const application = makeApplication({ status: 'Interview' });
    const offer = ApplicationRules.changeStatus(application, 'Offer', LATER);
    expect(offer).toMatchObject({ appliedDate: application.appliedDate, followUpDate: application.followUpDate });
  });

  it('recognizes valid statuses', () => {
    expect(ApplicationRules.isStatus('Interview')).toBe(true);
    expect(ApplicationRules.isStatus('interview')).toBe(false);
  });
});
