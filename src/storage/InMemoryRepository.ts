// Repository that keeps data in fields. Used in tests, and handy for trying the UI without saving.
import type { AppData, Application, Resume } from '../core/types';
import type { Repository } from './Repository';

export class InMemoryRepository implements Repository {
  private resume: Resume | null;
  private applications: Application[];

  constructor(initial: Partial<AppData> = {}) {
    this.resume = initial.resume ?? null;
    this.applications = initial.applications ?? [];
  }

  async loadResume(): Promise<Resume | null> {
    return this.resume;
  }

  async saveResume(resume: Resume): Promise<void> {
    this.resume = resume;
  }

  async listApplications(): Promise<Application[]> {
    return [...this.applications];
  }

  async saveApplication(application: Application): Promise<void> {
    this.applications = [...this.applications.filter((a) => a.id !== application.id), application];
  }

  async deleteApplication(id: string): Promise<void> {
    this.applications = this.applications.filter((a) => a.id !== id);
  }

  async replaceAll(data: AppData): Promise<void> {
    this.resume = data.resume;
    this.applications = [...data.applications];
  }
}
