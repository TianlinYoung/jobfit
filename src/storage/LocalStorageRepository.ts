// Repository implementation that keeps data in the browser's localStorage as JSON strings.
import { ResumeValidator } from '../core/ResumeValidator';
import type { Resume } from '../core/types';
import type { Repository } from './Repository';

/** The two localStorage methods we use. Tests pass a simple in-memory fake instead. */
export interface KeyValueStore {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

// Versioned key: if the format ever changes, a new key avoids misreading old data.
export const RESUME_KEY = 'jobfit.resume.v1';

export class LocalStorageRepository implements Repository {
  constructor(private readonly store: KeyValueStore) {}

  async loadResume(): Promise<Resume | null> {
    const text = this.store.getItem(RESUME_KEY);
    if (text === null) {
      return null;
    }
    // Corrupt or outdated data should not crash the app; the user just starts from empty.
    return ResumeValidator.parse(this.parseJson(text));
  }

  async saveResume(resume: Resume): Promise<void> {
    // setItem can throw (storage full or disabled). Because this is an async method,
    // the throw becomes a rejected Promise, which the UI shows as an error message.
    this.store.setItem(RESUME_KEY, JSON.stringify(resume));
  }

  private parseJson(text: string): unknown {
    try {
      return JSON.parse(text);
    } catch {
      return null;
    }
  }
}
