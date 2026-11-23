// Builds valid Application objects for tests, overriding only the fields a test cares about.
import type { Application } from '../../src/core/types';

export function makeApplication(overrides: Partial<Application> = {}): Application {
  return {
    id: 'a1',
    company: 'Acme',
    role: 'SWE Intern',
    status: 'Applied',
    appliedDate: '2026-11-10',
    followUpDate: '2026-11-17',
    notes: '',
    jdText: '',
    lastScore: null,
    createdAt: '2026-11-10T18:00:00.000Z',
    updatedAt: '2026-11-10T18:00:00.000Z',
    ...overrides,
  };
}
