// End-to-end tests: realistic JD text and resume in, full report out.
import { describe, expect, it } from 'vitest';
import { MatchService } from '../../src/core/MatchService';
import { makeResume } from './fixtures';

const service = MatchService.createDefault();

const SAMPLE_JD = `
Acme is an R&D-driven company. Our team will Go above and beyond.

What you'll do
- Build backend services in Go

Minimum Qualifications
- Proficiency in Java or C++
- Experience with SQL and REST APIs

Preferred Qualifications
- Docker, Kubernetes
- AWS experience is a plus

Benefits
- Networking events with the C-suite
`;

describe('MatchService', () => {
  it('produces a full, explainable report for a realistic JD', () => {
    const resume = makeResume(['Java', 'js', 'COBOL'], ['Wrote SQL queries for reports', 'Deployed a Flask app']);
    const report = service.analyze(SAMPLE_JD, resume);

    expect(report.hasRequirementHeaders).toBe(true);
    // R&D, "Go above", and "C-suite" are not skills; "Go" under "What you'll do" is context.
    expect(report.breakdown.map((s) => [s.skillId, s.importance, s.status])).toEqual([
      ['cpp', 'required', 'missing'],
      ['java', 'required', 'listed'],
      ['rest', 'required', 'missing'],
      ['sql', 'required', 'bulletOnly'],
      ['aws', 'preferred', 'missing'],
      ['docker', 'preferred', 'missing'],
      ['go', 'context', 'missing'],
      ['kubernetes', 'preferred', 'missing'],
    ]);
    // earned = 3 (Java) + 1.5 (SQL) = 4.5; max = 4×3 + 4×1 = 16; 100 × 4.5 / 16 = 28.1
    expect(report.earnedPoints).toBe(4.5);
    expect(report.maxPoints).toBe(16);
    expect(report.score).toBe(28);
    expect(report.unrecognizedResumeSkills).toEqual(['COBOL']);
  });

  it('handles a plain-text JD with no list markers', () => {
    const jd = [
      'Software Engineering Intern',
      'About us',
      'We build payment tools for small businesses.',
      'Minimum Qualifications',
      'Experience with Java or Python',
      'About 2 years of SQL experience',
      'Experience with React preferred',
      'Bonus points if you know Rust',
      'Benefits',
      'Free lunch and a gym',
    ].join('\n');
    const report = service.analyze(jd, makeResume(['Java', 'React']));

    expect(report.breakdown.map((s) => [s.skillId, s.importance, s.status])).toEqual([
      ['java', 'required', 'listed'],
      ['python', 'required', 'missing'],
      ['sql', 'required', 'missing'],
      ['react', 'preferred', 'listed'],
      ['rust', 'preferred', 'missing'],
    ]);
    // earned = 3 + 1 = 4; max = 3×3 + 2×1 = 11; 100 × 4 / 11 = 36.4
    expect(report.score).toBe(36);
  });

  it('returns one gap per skill not in the skills list', () => {
    const resume = makeResume(['Java'], ['Deployed a Flask app']);
    const report = service.analyze(SAMPLE_JD, resume);
    const docker = report.gaps.find((g) => g.skillId === 'docker');
    expect(report.gaps).toHaveLength(report.breakdown.filter((s) => s.status !== 'listed').length);
    expect(docker?.kind).toBe('canHighlightInBullet');
  });

  it('returns a null score for a JD with no known skills', () => {
    const report = service.analyze('We are hiring a friendly teammate!', makeResume(['Java']));
    expect(report.score).toBeNull();
    expect(report.breakdown).toEqual([]);
    expect(report.gaps).toEqual([]);
  });

  it('uses weight 2 for every skill when the JD has no headings', () => {
    const report = service.analyze('You know Python and SQL.', makeResume(['Python']));
    expect(report.hasRequirementHeaders).toBe(false);
    expect(report.breakdown.every((s) => s.weight === 2)).toBe(true);
    expect(report.score).toBe(50);
  });
});
