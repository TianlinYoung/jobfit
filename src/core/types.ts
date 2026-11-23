// Domain types shared by every core module. No logic lives here.

// ---------- Skill dictionary ----------

export type SkillCategory = 'language' | 'framework' | 'tool' | 'concept';

export interface SkillEntry {
  /** Stable key, e.g. "javascript". Everything is compared by id, never by display name. */
  id: string;
  /** Display name, e.g. "JavaScript". */
  name: string;
  category: SkillCategory;
  /** Spellings matched case-insensitively, e.g. ["javascript", "js"]. */
  aliases: string[];
  /**
   * Spellings that only count with exact casing. Needed for words that are also
   * normal English ("Go", "React", "REST") or single letters ("C", "R").
   */
  caseSensitiveAliases?: string[];
  /**
   * Keywords that hint a bullet is related to this skill, e.g. Docker → "deploy".
   * 4+ letters match as a word prefix ("deploy" → "deployed"); shorter ones only as a whole word.
   * Only used to suggest where a missing skill *might* belong; never adds points.
   */
  related: string[];
}

/** One spelling to search for, flattened out of the dictionary. */
export interface AliasPattern {
  skillId: string;
  alias: string;
  caseSensitive: boolean;
}

// ---------- JD parsing ----------

/**
 * Where in the JD a skill was found.
 * - required / preferred: under a matching section heading (or a "... is a plus" line)
 * - context: the JD has requirement headings, but this text is outside them
 *   (company intro, responsibilities, benefits)
 * - unspecified: the JD has no requirement headings at all, so we cannot tell
 */
export type Importance = 'required' | 'preferred' | 'context' | 'unspecified';

export interface ClassifiedLine {
  text: string;
  importance: Importance;
}

export interface SplitResult {
  lines: ClassifiedLine[];
  /** True when at least one Required or Preferred heading was found. */
  hasRequirementHeaders: boolean;
}

/** Half-open character range [start, end) inside a string. */
export interface TextRange {
  start: number;
  end: number;
}

export interface ExtractedSkill {
  skillId: string;
  importance: Importance;
  /** The JD line the skill came from, shown to the user as evidence. */
  sourceLine: string;
  /** Where the skill's words sit inside sourceLine, so the UI can highlight them. */
  highlights: TextRange[];
}

export interface ParsedJd {
  skills: ExtractedSkill[];
  hasRequirementHeaders: boolean;
}

// ---------- Resume ----------

export interface Bullet {
  id: string;
  text: string;
}

export interface Experience {
  id: string;
  title: string;
  organization: string;
  bullets: Bullet[];
}

export interface Resume {
  /** Raw user input such as "JS" or "react"; normalized only when matching. */
  skills: string[];
  experiences: Experience[];
}

// ---------- Match result ----------

/**
 * - listed: in the resume's skills list
 * - bulletOnly: not in the skills list, but mentioned in an experience bullet
 * - missing: nowhere in the resume
 */
export type MatchStatus = 'listed' | 'bulletOnly' | 'missing';

export interface SkillScore {
  skillId: string;
  skillName: string;
  importance: Importance;
  weight: number;
  status: MatchStatus;
  credit: number;
  /** weight × credit */
  points: number;
  /** Text of resume bullets that mention the skill (whether or not it is also listed). */
  evidenceBullets: string[];
  sourceLine: string;
  highlights: TextRange[];
}

// Core returns *what* to suggest as data; the UI turns it into a sentence in the user's
// language. Each kind carries exactly the fields its message needs (a "tagged union":
// checking `kind` tells TypeScript which fields exist, like a sealed interface in Java).

interface GapBase {
  skillId: string;
  skillName: string;
}

/** The skill is in a bullet but not in the skills list. */
export interface AddToSkillsListGap extends GapBase {
  kind: 'addToSkillsList';
  bulletId: string;
  bulletText: string;
}

/** The skill is nowhere, but a bullet mentions a related keyword. Advice must stay conditional. */
export interface CanHighlightInBulletGap extends GapBase {
  kind: 'canHighlightInBullet';
  bulletId: string;
  bulletText: string;
  relatedKeyword: string;
}

/** The skill is nowhere and no bullet looks related. */
export interface TrulyMissingGap extends GapBase {
  kind: 'trulyMissing';
}

export type GapSuggestion = AddToSkillsListGap | CanHighlightInBulletGap | TrulyMissingGap;

export type GapKind = GapSuggestion['kind'];

export interface MatchReport {
  /** 0–100, or null when the JD contains no skill we recognize. */
  score: number | null;
  earnedPoints: number;
  maxPoints: number;
  breakdown: SkillScore[];
  gaps: GapSuggestion[];
  /** Resume skills the dictionary does not know, so they could not be compared. */
  unrecognizedResumeSkills: string[];
  hasRequirementHeaders: boolean;
}
