// Holds the list of known skills and answers "which skill is this spelling?".
import type { AliasPattern, SkillEntry } from './types';

export class SkillDictionary {
  private readonly entriesById = new Map<string, SkillEntry>();
  /** Lower-cased alias → skill id. Used for resume input, which is always case-insensitive. */
  private readonly idByLowerAlias = new Map<string, string>();
  private readonly patterns: AliasPattern[] = [];

  constructor(entries: SkillEntry[]) {
    for (const entry of entries) {
      this.addEntry(entry);
    }
    // Longest first, so "C++" is tried before "C" (see TextMatcher).
    // Ties are broken alphabetically only to make the order deterministic.
    this.patterns.sort((a, b) => b.alias.length - a.alias.length || a.alias.localeCompare(b.alias));
  }

  getById(skillId: string): SkillEntry | undefined {
    return this.entriesById.get(skillId);
  }

  /** Display name for a skill id; falls back to the id so callers never show "undefined". */
  nameOf(skillId: string): string {
    return this.entriesById.get(skillId)?.name ?? skillId;
  }

  /**
   * Maps what a user typed in their skills list ("js", " React ") to a skill id.
   * Case-insensitive on purpose: someone typing "go" in a skills list clearly means the language,
   * unlike the word "go" inside a JD sentence.
   */
  resolve(userInput: string): string | null {
    return this.idByLowerAlias.get(userInput.trim().toLowerCase()) ?? null;
  }

  /** All spellings, longest first. */
  aliasPatterns(): readonly AliasPattern[] {
    return this.patterns;
  }

  size(): number {
    return this.entriesById.size;
  }

  private addEntry(entry: SkillEntry): void {
    if (this.entriesById.has(entry.id)) {
      throw new Error(`Duplicate skill id: ${entry.id}`);
    }
    const caseSensitive = entry.caseSensitiveAliases ?? [];
    if (entry.aliases.length + caseSensitive.length === 0) {
      throw new Error(`Skill ${entry.id} has no aliases`);
    }
    this.entriesById.set(entry.id, entry);
    for (const alias of entry.aliases) {
      this.addAlias(entry.id, alias, false);
    }
    for (const alias of caseSensitive) {
      this.addAlias(entry.id, alias, true);
    }
  }

  private addAlias(skillId: string, alias: string, caseSensitive: boolean): void {
    const key = alias.toLowerCase();
    const existing = this.idByLowerAlias.get(key);
    // Two skills sharing a spelling would make matching ambiguous, so fail loudly at startup.
    if (existing !== undefined && existing !== skillId) {
      throw new Error(`Alias "${alias}" is used by both ${existing} and ${skillId}`);
    }
    this.idByLowerAlias.set(key, skillId);
    this.patterns.push({ skillId, alias, caseSensitive });
  }
}
