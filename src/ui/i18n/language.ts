// Which languages exist, how the first one is chosen, and how the choice is remembered.
import { en, type Messages } from './en';
import { zh } from './zh';

export type Language = 'en' | 'zh';

export const DICTIONARIES: Record<Language, Messages> = { en, zh };

/** Shown in the language picker in each language's own name, so a user can always find theirs. */
export const LANGUAGE_NAMES: Record<Language, string> = { en: 'English', zh: '简体中文' };

export const LANGUAGE_KEY = 'jobfit.language';

/** The two localStorage methods we need; tests pass a fake. */
export interface PreferenceStore {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export function isLanguage(value: unknown): value is Language {
  return value === 'en' || value === 'zh';
}

/**
 * A saved choice wins. Otherwise follow the browser: any "zh..." locale (zh-CN, zh-TW, zh)
 * gets Chinese, everything else English.
 */
export function detectInitialLanguage(saved: string | null, browserLanguage: string): Language {
  if (isLanguage(saved)) {
    return saved;
  }
  return browserLanguage.toLowerCase().startsWith('zh') ? 'zh' : 'en';
}

// Storage access can throw (privacy mode, disabled storage). A language preference is not worth
// crashing over, so failures fall back to "not saved".
export function readSavedLanguage(store: PreferenceStore): string | null {
  try {
    return store.getItem(LANGUAGE_KEY);
  } catch {
    return null;
  }
}

export function saveLanguage(store: PreferenceStore, language: Language): void {
  try {
    store.setItem(LANGUAGE_KEY, language);
  } catch {
    // Ignore: the choice still applies for this visit.
  }
}
