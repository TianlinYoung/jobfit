// The storage contract the UI depends on. The UI never touches localStorage directly.
//
// Every method returns a Promise even though localStorage is synchronous. A future backend
// (fetch to a REST API) is asynchronous, and with this signature swapping implementations
// does not change any caller. Think of it as a Java interface returning CompletableFuture.
import type { Resume } from '../core/types';

export interface Repository {
  /** null when nothing has been saved yet (or the saved data was unreadable). */
  loadResume(): Promise<Resume | null>;
  saveResume(resume: Resume): Promise<void>;
}
