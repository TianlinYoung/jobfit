// The numbers behind the scoring formula, kept in one place so they are easy to find and explain.
import type { Importance, MatchStatus } from './types';

/** How much each JD skill counts toward the maximum score. */
export const IMPORTANCE_WEIGHT: Record<Importance, number> = {
  required: 3,
  // A JD without headings: we can't tell required from preferred, so use the midpoint.
  unspecified: 2,
  preferred: 1,
  // Intro / responsibilities text when the JD does have requirement headings.
  context: 1,
};

/**
 * Used when the same skill appears in several places: we keep the most important one.
 * Separate from the weight because preferred and context share a weight, but an explicit
 * "preferred" is a stronger statement than a passing mention in the intro.
 */
export const IMPORTANCE_RANK: Record<Importance, number> = {
  required: 4,
  unspecified: 3,
  preferred: 2,
  context: 1,
};

/** Fraction of a skill's weight the resume earns. See docs/DECISIONS.md for why bulletOnly is 0.5. */
export const STATUS_CREDIT: Record<MatchStatus, number> = {
  listed: 1,
  bulletOnly: 0.5,
  missing: 0,
};
