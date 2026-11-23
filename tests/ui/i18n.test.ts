// Tests for the UI text layer: dictionary completeness, honest gap wording in both languages,
// and how the initial language is chosen.
import { describe, expect, it } from 'vitest';
import type { GapSuggestion } from '../../src/core/types';
import { en, type Messages } from '../../src/ui/i18n/en';
import { gapMessage } from '../../src/ui/i18n/gapMessage';
import {
  DICTIONARIES,
  LANGUAGE_KEY,
  detectInitialLanguage,
  readSavedLanguage,
  resolveInitialLanguage,
  saveLanguage,
  type Language,
  type PreferenceStore,
} from '../../src/ui/i18n/language';
import { zh } from '../../src/ui/i18n/zh';

/** Every key path in a nested dictionary, e.g. "gaps.kindLabel.trulyMissing". */
function keyPaths(object: object, prefix = ''): string[] {
  return Object.entries(object).flatMap(([key, value]) => {
    const path = prefix === '' ? key : `${prefix}.${key}`;
    return typeof value === 'object' && value !== null ? keyPaths(value as object, path) : [path];
  });
}

/** Every leaf value: strings, or functions called with sample arguments. */
function leafTexts(object: object): string[] {
  return Object.values(object).flatMap((value): string[] => {
    if (typeof value === 'string') return [value];
    if (typeof value === 'function') return [String((value as (...args: unknown[]) => unknown)('X', 'Y', 1))];
    return leafTexts(value as object);
  });
}

const GAPS: Record<GapSuggestion['kind'], GapSuggestion> = {
  addToSkillsList: { kind: 'addToSkillsList', skillId: 'sql', skillName: 'SQL', bulletId: 'b1', bulletText: 'Wrote SQL' },
  canHighlightInBullet: {
    kind: 'canHighlightInBullet',
    skillId: 'docker',
    skillName: 'Docker',
    bulletId: 'b2',
    bulletText: 'Deployed the app',
    relatedKeyword: 'deploy',
  },
  trulyMissing: { kind: 'trulyMissing', skillId: 'rust', skillName: 'Rust' },
};

describe('dictionaries', () => {
  it('zh has exactly the same keys as en (the compiler checks this too)', () => {
    expect(keyPaths(zh)).toEqual(keyPaths(en));
  });

  it.each(Object.entries(DICTIONARIES))('%s has no empty text', (_language, messages) => {
    for (const text of leafTexts(messages)) {
      expect(text.trim()).not.toBe('');
    }
  });

  it('puts the values into parameterized messages', () => {
    expect(en.score.formula('17.5', '26', 67)).toBe('17.5 / 26 points = 67%');
    expect(zh.score.formula('17.5', '26', 67)).toBe('17.5 / 26 分 = 67%');
    expect(zh.score.listedCount(5, 14)).toContain('14 项技能中，有 5 项');
  });

  it('tells Chinese users that only English JDs are supported', () => {
    expect(zh.match.jdLanguageNote).toBe('目前仅支持英文职位描述。');
  });
});

describe('gap wording never encourages claiming experience you do not have', () => {
  // Conditional phrase each language must use before suggesting any edit for an unverified skill.
  const CONDITIONAL: Record<Language, { highlight: RegExp; missing: RegExp; keepAsIs: string }> = {
    en: {
      highlight: /^If you actually used Docker in this work, /,
      missing: /If you have real experience with it, add it/,
      keepAsIs: 'If you did not use it, leave the bullet as it is.',
    },
    zh: {
      highlight: /^如果你确实在这段经历中用过 Docker，/,
      missing: /如果你确实有相关经验，可以补上/,
      keepAsIs: '如果没有用过，保持这条 bullet 不变。',
    },
  };

  // Directive phrasings that would push the user to add a skill regardless of whether it is true.
  const FORBIDDEN: Record<Language, RegExp[]> = {
    en: [/\badd (docker|it) to this bullet\b/i, /\bwrite that you\b/i, /\bclaim\b/i, /\bjust add\b/i],
    zh: [/把 ?Docker ?写进/, /补写/, /声称/, /直接加上/],
  };

  it.each(['en', 'zh'] as const)('%s: "maybe mention in a bullet" is conditional and offers leaving it unchanged', (language) => {
    const message = gapMessage(DICTIONARIES[language], GAPS.canHighlightInBullet);
    expect(message).toMatch(CONDITIONAL[language].highlight);
    expect(message).toContain(CONDITIONAL[language].keepAsIs);
    expect(message).toContain('deploy');
  });

  it.each(['en', 'zh'] as const)('%s: "not in your resume" only suggests adding real experience', (language) => {
    expect(gapMessage(DICTIONARIES[language], GAPS.trulyMissing)).toMatch(CONDITIONAL[language].missing);
  });

  it.each(['en', 'zh'] as const)('%s: no gap message uses directive wording', (language) => {
    for (const gap of Object.values(GAPS)) {
      const message = gapMessage(DICTIONARIES[language], gap);
      for (const pattern of FORBIDDEN[language]) {
        expect(message).not.toMatch(pattern);
      }
    }
  });
});

describe('gapMessage', () => {
  it.each(['en', 'zh'] as const)('%s: picks the message for each kind with its values', (language) => {
    const t: Messages = DICTIONARIES[language];
    expect(gapMessage(t, GAPS.addToSkillsList)).toBe(t.gaps.addToSkillsList('SQL'));
    expect(gapMessage(t, GAPS.canHighlightInBullet)).toBe(t.gaps.canHighlightInBullet('Docker', 'deploy'));
    expect(gapMessage(t, GAPS.trulyMissing)).toBe(t.gaps.trulyMissing('Rust'));
  });
});

describe('initial language', () => {
  it('uses a saved choice first', () => {
    expect(detectInitialLanguage('en', 'zh-CN')).toBe('en');
    expect(detectInitialLanguage('zh', 'en-US')).toBe('zh');
  });

  it.each([
    ['zh-CN', 'zh'],
    ['zh-TW', 'zh'],
    ['ZH', 'zh'],
    ['en-US', 'en'],
    ['fr-CA', 'en'],
    ['', 'en'],
  ])('browser language %j → %s when nothing valid is saved', (browserLanguage, expected) => {
    expect(detectInitialLanguage(null, browserLanguage)).toBe(expected);
    expect(detectInitialLanguage('klingon', browserLanguage)).toBe(expected);
  });
});

describe('language persistence', () => {
  class MapStore implements PreferenceStore {
    readonly data = new Map<string, string>();
    getItem(key: string) {
      return this.data.get(key) ?? null;
    }
    setItem(key: string, value: string) {
      this.data.set(key, value);
    }
  }

  const brokenStore: PreferenceStore = {
    getItem: () => {
      throw new Error('SecurityError');
    },
    setItem: () => {
      throw new Error('SecurityError');
    },
  };

  it('saves and reads the choice under its own key', () => {
    const store = new MapStore();
    saveLanguage(store, 'zh');
    expect(store.data.get(LANGUAGE_KEY)).toBe('zh');
    expect(readSavedLanguage(store)).toBe('zh');
  });

  it('does not save an auto-detected language (only an explicit choice is saved)', () => {
    const store = new MapStore();
    let writes = 0;
    const countingStore: PreferenceStore = {
      getItem: (key) => store.getItem(key),
      setItem: (key, value) => {
        writes++;
        store.setItem(key, value);
      },
    };
    expect(resolveInitialLanguage(countingStore, 'zh-CN')).toBe('zh');
    expect(writes).toBe(0);
    expect(store.data.has(LANGUAGE_KEY)).toBe(false);

    saveLanguage(countingStore, 'en'); // what the picker does on an explicit choice
    expect(writes).toBe(1);
    expect(resolveInitialLanguage(countingStore, 'zh-CN')).toBe('en');
  });

  it('treats unavailable storage as "nothing saved" instead of crashing', () => {
    expect(readSavedLanguage(brokenStore)).toBeNull();
    expect(() => saveLanguage(brokenStore, 'en')).not.toThrow();
  });
});
