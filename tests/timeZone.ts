// Test helper: run code as if the computer were in a given time zone.
// Node re-reads the TZ environment variable whenever it changes, so dates created afterwards
// use the new zone. vi.stubEnv sets it and vi.unstubAllEnvs puts the original value back.
import { vi } from 'vitest';

export function setTimeZone(timeZone: string): void {
  vi.stubEnv('TZ', timeZone);
}

export function restoreTimeZone(): void {
  vi.unstubAllEnvs();
}

export function inTimeZone<T>(timeZone: string, fn: () => T): T {
  setTimeZone(timeZone);
  try {
    return fn();
  } finally {
    restoreTimeZone();
  }
}
