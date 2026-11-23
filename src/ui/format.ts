// Display text for core values, kept in one place so wording stays consistent across the UI.
import type { GapKind, Importance, MatchStatus } from '../core/types';

export const IMPORTANCE_LABEL: Record<Importance, string> = {
  required: 'Required',
  preferred: 'Preferred',
  context: 'Mentioned elsewhere',
  unspecified: 'Unspecified',
};

export const STATUS_LABEL: Record<MatchStatus, string> = {
  listed: 'In skills list',
  bulletOnly: 'Only in a bullet',
  missing: 'Missing',
};

export const GAP_KIND_LABEL: Record<GapKind, string> = {
  addToSkillsList: 'Add to skills list',
  canHighlightInBullet: 'Maybe mention in a bullet',
  trulyMissing: 'Not in your resume',
};

/** 3 → "3", 1.5 → "1.5". Points are always whole or halves, so one decimal is enough. */
export function formatPoints(points: number): string {
  return Number.isInteger(points) ? String(points) : points.toFixed(1);
}
