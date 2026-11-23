// Repository implementation that keeps data in the browser's localStorage as JSON strings.
import { ApplicationValidator } from '../core/ApplicationValidator';
import { ResumeValidator } from '../core/ResumeValidator';
import type { AppData, Application, Resume } from '../core/types';
import type { Repository } from './Repository';

/** The localStorage methods we use. Tests pass a simple in-memory fake instead. */
export interface KeyValueStore {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

// Versioned keys: if the format ever changes, a new key avoids misreading old data.
export const RESUME_KEY = 'jobfit.resume.v1';
export const APPLICATIONS_KEY = 'jobfit.applications.v1';

export class LocalStorageRepository implements Repository {
  constructor(private readonly store: KeyValueStore) {}

  async loadResume(): Promise<Resume | null> {
    // Corrupt or outdated data should not crash the app; the user just starts from empty.
    return ResumeValidator.parse(this.readJson(RESUME_KEY));
  }

  async saveResume(resume: Resume): Promise<void> {
    // setItem can throw (storage full or disabled). Because this is an async method,
    // the throw becomes a rejected Promise, which the UI shows as an error message.
    this.store.setItem(RESUME_KEY, JSON.stringify(resume));
  }

  async listApplications(): Promise<Application[]> {
    return ApplicationValidator.parseStoredList(this.readJson(APPLICATIONS_KEY));
  }

  async saveApplication(application: Application): Promise<void> {
    const others = (await this.listApplications()).filter((a) => a.id !== application.id);
    this.writeApplications([...others, application]);
  }

  async deleteApplication(id: string): Promise<void> {
    const remaining = (await this.listApplications()).filter((a) => a.id !== id);
    this.writeApplications(remaining);
  }

  async replaceAll(data: AppData): Promise<void> {
    // localStorage has no transactions. Write the large value (applications) first: if storage is
    // full, that write fails before anything has changed. The small resume write is then very
    // unlikely to fail.
    this.store.setItem(APPLICATIONS_KEY, JSON.stringify(data.applications));
    if (data.resume === null) {
      this.store.removeItem(RESUME_KEY);
    } else {
      this.store.setItem(RESUME_KEY, JSON.stringify(data.resume));
    }
  }

  private writeApplications(applications: Application[]): void {
    this.store.setItem(APPLICATIONS_KEY, JSON.stringify(applications));
  }

  /** The parsed value under `key`, or null if missing or not valid JSON. */
  private readJson(key: string): unknown {
    const text = this.store.getItem(key);
    if (text === null) {
      return null;
    }
    try {
      return JSON.parse(text) as unknown;
    } catch {
      return null;
    }
  }
}
