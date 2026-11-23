// Labels every line of a job description as required / preferred / context / unspecified.
import type { ClassifiedLine, Importance, SplitResult } from './types';

/** What kind of heading we are currently under while scanning top to bottom. */
type SectionKind = 'required' | 'preferred' | 'other' | 'none';

// Checked in this order. Preferred comes first because "Preferred Qualifications"
// also contains "qualifications", which is a required keyword.
const PREFERRED_HEADING_WORDS = [
  'preferred', 'nice to have', 'nice-to-have', 'bonus points', 'pluses', 'desired', 'ideal candidate',
];
const REQUIRED_HEADING_WORDS = [
  'required', 'requirements', 'qualifications', 'must have', 'must-have',
  "what you'll need", 'what you need', 'what we are looking for', "what we're looking for", 'who you are',
];
// Headings that end a requirements section, so benefits text is not counted as required.
const OTHER_HEADING_WORDS = [
  'about', 'responsibilities', "what you'll do", 'what you will do', 'the role', 'your role',
  'benefits', 'perks', 'compensation', 'salary', 'overview', 'who we are', 'location', 'equal opportunity',
];

/** A line in any section that says this specific item is optional. */
const INLINE_PREFERRED = /\b(a plus|nice to have|preferred|bonus)\b/i;

/** Headings are short; a long sentence that happens to contain "required" is content. */
const MAX_HEADING_LENGTH = 50;

/** "- ", "* ", "• ", "1. ", "2) " */
const BULLET_PREFIX = /^([-*•]|\d+[.)])\s/;

interface Heading {
  kind: SectionKind;
  /** Text after a colon on the same line, e.g. "Requirements: Java, SQL" → "Java, SQL". */
  trailingContent: string;
}

interface PendingLine {
  text: string;
  section: SectionKind;
}

export class JdSectionSplitter {
  split(jdText: string): SplitResult {
    const pending: PendingLine[] = [];
    let current: SectionKind = 'none';
    let hasRequirementHeaders = false;

    for (const rawLine of jdText.split(/\r?\n/)) {
      const line = rawLine.trim();
      if (line === '') {
        continue;
      }
      const heading = this.detectHeading(line);
      if (heading === null) {
        pending.push({ text: line, section: current });
        continue;
      }
      current = heading.kind;
      hasRequirementHeaders ||= heading.kind === 'required' || heading.kind === 'preferred';
      if (heading.trailingContent !== '') {
        pending.push({ text: heading.trailingContent, section: current });
      }
    }

    // Importance can only be resolved at the end: whether intro text is "context" or
    // "unspecified" depends on whether any requirement heading shows up later.
    const lines: ClassifiedLine[] = pending.map((p) => ({
      text: p.text,
      importance: this.resolveImportance(p, hasRequirementHeaders),
    }));
    return { lines, hasRequirementHeaders };
  }

  /** Returns null when the line is ordinary content. */
  detectHeading(line: string): Heading | null {
    // A bulleted line such as "- Java required" is a list item, never a heading.
    if (BULLET_PREFIX.test(line)) {
      return null;
    }
    const colonIndex = line.indexOf(':');
    const headingPart = colonIndex === -1 ? line : line.slice(0, colonIndex);
    const trailingContent = colonIndex === -1 ? '' : line.slice(colonIndex + 1).trim();
    const kind = this.classifyHeadingText(headingPart);
    if (kind === null) {
      return null;
    }
    return { kind, trailingContent };
  }

  private classifyHeadingText(text: string): SectionKind | null {
    const cleaned = this.stripMarkdown(text).toLowerCase();
    if (cleaned === '' || cleaned.length > MAX_HEADING_LENGTH) {
      return null;
    }
    if (this.containsAny(cleaned, PREFERRED_HEADING_WORDS)) {
      return 'preferred';
    }
    if (this.containsAny(cleaned, REQUIRED_HEADING_WORDS)) {
      return 'required';
    }
    if (this.startsWithAny(cleaned, OTHER_HEADING_WORDS)) {
      return 'other';
    }
    return null;
  }

  private resolveImportance(line: PendingLine, hasRequirementHeaders: boolean): Importance {
    if (line.section !== 'preferred' && INLINE_PREFERRED.test(line.text)) {
      return 'preferred';
    }
    if (line.section === 'required' || line.section === 'preferred') {
      return line.section;
    }
    return hasRequirementHeaders ? 'context' : 'unspecified';
  }

  /** "## **Requirements**" → "Requirements" */
  private stripMarkdown(text: string): string {
    return text.replace(/[#*_]/g, '').trim();
  }

  private containsAny(text: string, words: string[]): boolean {
    return words.some((word) => text.includes(word));
  }

  // "Other" headings must start with the keyword: "About the team" is a heading,
  // but a short line like "Learn about our stack" is not.
  private startsWithAny(text: string, words: string[]): boolean {
    return words.some((word) => text.startsWith(word));
  }
}
