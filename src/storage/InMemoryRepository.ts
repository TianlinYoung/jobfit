// Repository that keeps data in a field. Used in tests, and handy for trying the UI without saving.
import type { Resume } from '../core/types';
import type { Repository } from './Repository';

export class InMemoryRepository implements Repository {
  private resume: Resume | null;

  constructor(initialResume: Resume | null = null) {
    this.resume = initialResume;
  }

  async loadResume(): Promise<Resume | null> {
    return this.resume;
  }

  async saveResume(resume: Resume): Promise<void> {
    this.resume = resume;
  }
}
