import { describe, expect, it } from 'vitest';
import type { Resume } from '../../src/core/types';
import { InMemoryRepository } from '../../src/storage/InMemoryRepository';
import { type KeyValueStore, LocalStorageRepository, RESUME_KEY } from '../../src/storage/LocalStorageRepository';

/** Stands in for window.localStorage, which does not exist in the Node test environment. */
class FakeStore implements KeyValueStore {
  readonly data = new Map<string, string>();
  failOnWrite = false;

  getItem(key: string): string | null {
    return this.data.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    if (this.failOnWrite) {
      throw new Error('QuotaExceededError');
    }
    this.data.set(key, value);
  }
}

const RESUME: Resume = { skills: ['Java'], experiences: [] };

describe('LocalStorageRepository', () => {
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
    store.failOnWrite = true;
    await expect(new LocalStorageRepository(store).saveResume(RESUME)).rejects.toThrow('QuotaExceededError');
  });
});

describe('InMemoryRepository', () => {
  it('starts with the given resume and stores saves', async () => {
    const repository = new InMemoryRepository();
    expect(await repository.loadResume()).toBeNull();
    await repository.saveResume(RESUME);
    expect(await repository.loadResume()).toEqual(RESUME);
  });
});
