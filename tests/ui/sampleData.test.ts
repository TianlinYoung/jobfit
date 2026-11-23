// Locks in what the "Try with sample data" demo shows, so a dictionary change can't quietly break it.
import { describe, expect, it } from 'vitest';
import { MatchService } from '../../src/core/MatchService';
import { ResumeValidator } from '../../src/core/ResumeValidator';
import { formatPoints } from '../../src/ui/format';
import { SAMPLE_JD, SAMPLE_RESUME } from '../../src/ui/sampleData';

describe('sample data', () => {
  const report = MatchService.createDefault().analyze(SAMPLE_JD, SAMPLE_RESUME);

  it('is a valid resume', () => {
    expect(ResumeValidator.parse(SAMPLE_RESUME)).toEqual(SAMPLE_RESUME);
  });

  it('produces a mid-range score that shows every kind of result', () => {
    expect(report.score).toBe(67);
    expect(`${formatPoints(report.earnedPoints)} / ${formatPoints(report.maxPoints)}`).toBe('17.5 / 26');
    expect(new Set(report.breakdown.map((s) => s.status))).toEqual(new Set(['listed', 'bulletOnly', 'missing']));
    expect(new Set(report.gaps.map((g) => g.kind))).toEqual(
      new Set(['addToSkillsList', 'canHighlightInBullet', 'trulyMissing']),
    );
  });

  it('shows the unrecognized-skills notice', () => {
    expect(report.unrecognizedResumeSkills).toEqual(['Spring', 'LaTeX']);
  });

  it('ignores the decoy phrases in the intro', () => {
    // "R&D" and "go above and beyond" must not become the R and Go skills.
    expect(report.breakdown.find((s) => s.skillId === 'r')).toBeUndefined();
    expect(report.breakdown.find((s) => s.skillId === 'go')?.sourceLine).toContain('services written in Go');
  });
});

describe('formatPoints', () => {
  it('shows whole numbers without decimals and halves with one', () => {
    expect(formatPoints(3)).toBe('3');
    expect(formatPoints(1.5)).toBe('1.5');
    expect(formatPoints(0)).toBe('0');
  });
});
