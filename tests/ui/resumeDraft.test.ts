import { describe, expect, it } from 'vitest';
import { addSkills, fromDraft, isResumeEmpty, newExperienceDraft, toDraft } from '../../src/ui/resumeDraft';

describe('resumeDraft', () => {
  it('turns bullet text into bullets, dropping blank lines and pasted bullet markers', () => {
    const resume = fromDraft({
      skills: [' Java ', ''],
      experiences: [{ id: 'e1', title: ' Intern ', organization: 'Acme', bulletsText: '- Built X\n\n• Fixed Y\n2. Shipped Z\n' }],
    });
    expect(resume).toEqual({
      skills: ['Java'],
      experiences: [
        {
          id: 'e1',
          title: 'Intern',
          organization: 'Acme',
          bullets: [
            { id: 'e1-b1', text: 'Built X' },
            { id: 'e1-b2', text: 'Fixed Y' },
            { id: 'e1-b3', text: 'Shipped Z' },
          ],
        },
      ],
    });
  });

  it('drops experiences that were added but never filled in', () => {
    expect(fromDraft({ skills: [], experiences: [newExperienceDraft('e1')] }).experiences).toEqual([]);
  });

  it('round-trips a resume through the draft format', () => {
    const resume = {
      skills: ['SQL'],
      experiences: [{ id: 'e1', title: 'TA', organization: 'Uni', bullets: [{ id: 'e1-b1', text: 'Taught' }] }],
    };
    expect(fromDraft(toDraft(resume))).toEqual(resume);
  });

  it('adds comma-separated skills, skipping blanks and case-insensitive duplicates', () => {
    expect(addSkills(['Java'], 'java, SQL , ,React, sql')).toEqual(['Java', 'SQL', 'React']);
  });

  it('treats a resume with no skills and no bullets as empty', () => {
    expect(isResumeEmpty({ skills: [], experiences: [] })).toBe(true);
    expect(isResumeEmpty({ skills: [], experiences: [{ id: 'e', title: 'T', organization: '', bullets: [] }] })).toBe(true);
    expect(isResumeEmpty({ skills: ['Java'], experiences: [] })).toBe(false);
  });
});
