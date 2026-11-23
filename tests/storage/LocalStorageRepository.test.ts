import { describe, expect, it } from 'vitest';
import type { Resume } from '../../src/core/types';
import { InMemoryRepository } from '../../src/storage/InMemoryRepository';
import {
  APPLICATIONS_KEY,
  type KeyValueStore,
  LocalStorageRepository,
  RESUME_KEY,
} from '../../src/storage/LocalStorageRepository';
import type { Repository } from '../../src/storage/Repository';
import { makeApplication } from '../core/applicationFixtures';

/** Stands in for window.localStorage, which does not exist in the Node test environment. */
class FakeStore implements KeyValueStore {
  readonly data = new Map<string, string>();
  /** Keys whose writes should fail, to simulate a full storage quota. */
  readonly failingKeys = new Set<string>();

  getItem(key: string): string | null {
    return this.data.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    if (this.failingKeys.has(key)) {
      throw new Error('QuotaExceededError');
    }
    this.data.set(key, value);
  }

  removeItem(key: string): void {
    this.data.delete(key);
  }
}

const RESUME: Resume = { skills: ['Java'], experiences: [] };

describe('LocalStorageRepository: resume', () => {
  it('returns null when nothing is saved', async () => {
    expect(await new LocalStorageRepository(new FakeStore()).loadResume()).toBeNull();
  });

  it('round-trips a resume', async () => {
    const repository = new LocalStorageRepository(new FakeStore());
    await repository.saveResume(RESUME);
    expect(await repository.loadResume()).toEqual(RESUME);
  });

  it('returns null for corrupt JSON instead of throwing', async () => {
    const store = new FakeStore();
    store.data.set(RESUME_KEY, '{not json');
    expect(await new LocalStorageRepository(store).loadResume()).toBeNull();
  });

  it('returns null for valid JSON with the wrong shape', async () => {
    const store = new FakeStore();
    store.data.set(RESUME_KEY, JSON.stringify({ skills: 'Java' }));
    expect(await new LocalStorageRepository(store).loadResume()).toBeNull();
  });

  it('rejects the promise when storage is full', async () => {
    const store = new FakeStore();
    store.failingKeys.add(RESUME_KEY);
    await expect(new LocalStorageRepository(store).saveResume(RESUME)).rejects.toThrow('QuotaExceededError');
  });
});

describe('LocalStorageRepository: applications', () => {
  it('skips a corrupted stored record but keeps the rest', async () => {
    const store = new FakeStore();
    store.data.set(APPLICATIONS_KEY, JSON.stringify([makeApplication({ id: 'ok' }), { id: 'bad' }]));
    const list = await new LocalStorageRepository(store).listApplications();
    expect(list.map((a) => a.id)).toEqual(['ok']);
  });

  it('returns an empty list for corrupt JSON', async () => {
    const store = new FakeStore();
    store.data.set(APPLICATIONS_KEY, '[[[');
    expect(await new LocalStorageRepository(store).listApplications()).toEqual([]);
  });

  it('leaves both keys untouched when the applications write fails during replaceAll', async () => {
    const store = new FakeStore();
    const repository = new LocalStorageRepository(store);
    await repository.saveResume(RESUME);
    store.failingKeys.add(APPLICATIONS_KEY);
    await expect(repository.replaceAll({ resume: null, applications: [makeApplication()] })).rejects.toThrow();
    expect(await repository.loadResume()).toEqual(RESUME);
    expect(await repository.listApplications()).toEqual([]);
  });
});

// The same behaviour is expected from every Repository implementation.
describe.each([
  ['LocalStorageRepository', () => new LocalStorageRepository(new FakeStore())],
  ['InMemoryRepository', () => new InMemoryRepository()],
])('%s contract', (_name, create: () => Repository) => {
  it('inserts, updates by id, and deletes applications', async () => {
    const repository = create();
    await repository.saveApplication(makeApplication({ id: 'a1', company: 'Acme' }));
    await repository.saveApplication(makeApplication({ id: 'a2' }));
    await repository.saveApplication(makeApplication({ id: 'a1', company: 'Acme Corp' }));
    const afterSaves = await repository.listApplications();
    expect(afterSaves).toHaveLength(2);
    expect(afterSaves.find((a) => a.id === 'a1')?.company).toBe('Acme Corp');

    await repository.deleteApplication('a2');
    expect((await repository.listApplications()).map((a) => a.id)).toEqual(['a1']);
  });

  it('keeps every change when several saves and deletes are started at the same time', async () => {
    const repository = create();
    await repository.saveApplication(makeApplication({ id: 'gone' }));
    // Not awaited one by one: all start before any finishes, like loading the sample data.
    await Promise.all([
      repository.saveApplication(makeApplication({ id: 'a' })),
      repository.saveApplication(makeApplication({ id: 'b' })),
      repository.deleteApplication('gone'),
      repository.saveApplication(makeApplication({ id: 'c' })),
    ]);
    expect((await repository.listApplications()).map((a) => a.id).sort()).toEqual(['a', 'b', 'c']);
  });

  it('replaces everything on replaceAll, including removing the resume', async () => {
    const repository = create();
    await repository.saveResume(RESUME);
    await repository.saveApplication(makeApplication({ id: 'old' }));
    await repository.replaceAll({ resume: null, applications: [makeApplication({ id: 'new' })] });
    expect(await repository.loadResume()).toBeNull();
    expect((await repository.listApplications()).map((a) => a.id)).toEqual(['new']);
  });

  it('starts empty', async () => {
    const repository = create();
    expect(await repository.loadResume()).toBeNull();
    expect(await repository.listApplications()).toEqual([]);
  });
});
