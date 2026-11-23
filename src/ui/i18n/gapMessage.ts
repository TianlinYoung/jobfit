// Turns a structured gap suggestion from core into a sentence in the current language.
import type { GapSuggestion } from '../../core/types';
import type { Messages } from './en';

export function gapMessage(t: Messages, gap: GapSuggestion): string {
  // Switching on `kind` narrows the type: inside each case TypeScript knows which fields exist
  // (relatedKeyword only exists for canHighlightInBullet). Adding a new kind without handling it
  // here is a compile error, because the function would no longer return a string on every path.
  switch (gap.kind) {
    case 'addToSkillsList':
      return t.gaps.addToSkillsList(gap.skillName);
    case 'canHighlightInBullet':
      return t.gaps.canHighlightInBullet(gap.skillName, gap.relatedKeyword);
    case 'trulyMissing':
      return t.gaps.trulyMissing(gap.skillName);
  }
}
