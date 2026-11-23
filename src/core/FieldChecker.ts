// Checks untrusted values one field at a time and records every problem with its path.
//
// Each method returns the value if it is valid, or `undefined` if not (after recording why).
// JSON has no `undefined`, so it can safely mean "invalid". Validators check *all* fields before
// deciding, so the user sees every problem at once instead of fixing them one by one.

export type IssueCode =
  | 'invalidJson'
  | 'fileTooLarge'
  | 'unsupportedVersion'
  | 'notAnObject'
  | 'notAList'
  | 'notText'
  | 'emptyRequired'
  | 'invalidStatus'
  | 'invalidDate'
  | 'invalidTimestamp'
  | 'invalidScore'
  | 'tooLong'
  | 'tooMany'
  | 'duplicateId';

export interface ValidationIssue {
  code: IssueCode;
  /** Where the problem is, e.g. "applications[2].status". */
  path: string;
  /** The limit that was exceeded, for tooLong / tooMany / fileTooLarge. */
  limit?: number;
}

export class FieldChecker {
  readonly issues: ValidationIssue[] = [];

  /**
   * @param enforceLimits true for imported files (untrusted, so sizes are capped);
   *   false for data the app itself saved, where only the shape is checked.
   */
  constructor(private readonly enforceLimits: boolean) {}

  hasIssues(): boolean {
    return this.issues.length > 0;
  }

  report(code: IssueCode, path: string, limit?: number): void {
    this.issues.push(limit === undefined ? { code, path } : { code, path, limit });
  }

  object(value: unknown, path: string): Record<string, unknown> | undefined {
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      return value as Record<string, unknown>;
    }
    this.report('notAnObject', path);
    return undefined;
  }

  list(value: unknown, path: string, maxItems: number): unknown[] | undefined {
    if (!Array.isArray(value)) {
      this.report('notAList', path);
      return undefined;
    }
    if (this.enforceLimits && value.length > maxItems) {
      this.report('tooMany', path, maxItems);
      return undefined;
    }
    return value;
  }

  text(value: unknown, path: string, maxLength: number): string | undefined {
    if (typeof value !== 'string') {
      this.report('notText', path);
      return undefined;
    }
    if (this.enforceLimits && value.length > maxLength) {
      this.report('tooLong', path, maxLength);
      return undefined;
    }
    return value;
  }

  /** Text that must contain something other than spaces (ids, company, role). */
  requiredText(value: unknown, path: string, maxLength: number): string | undefined {
    const text = this.text(value, path, maxLength);
    if (text !== undefined && text.trim() === '') {
      this.report('emptyRequired', path);
      return undefined;
    }
    return text;
  }

  /** One of a fixed set of strings, e.g. a status. */
  oneOf<T extends string>(value: unknown, allowed: readonly T[], path: string): T | undefined {
    if (typeof value === 'string' && (allowed as readonly string[]).includes(value)) {
      return value as T;
    }
    this.report('invalidStatus', path);
    return undefined;
  }

  /** "YYYY-MM-DD" or null. */
  nullableDate(value: unknown, path: string, isValidDate: (v: unknown) => boolean): string | null | undefined {
    if (value === null) {
      return null;
    }
    if (isValidDate(value)) {
      return value as string;
    }
    this.report('invalidDate', path);
    return undefined;
  }

  /** An ISO date-time string such as "2026-11-23T18:00:00.000Z". */
  timestamp(value: unknown, path: string): string | undefined {
    const isTimestamp =
      typeof value === 'string' &&
      value.length <= 40 &&
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(value) &&
      !Number.isNaN(Date.parse(value));
    if (isTimestamp) {
      return value;
    }
    this.report('invalidTimestamp', path);
    return undefined;
  }

  /** A whole number 0–100, or null. */
  nullableScore(value: unknown, path: string): number | null | undefined {
    if (value === null) {
      return null;
    }
    if (typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= 100) {
      return value;
    }
    this.report('invalidScore', path);
    return undefined;
  }
}

/**
 * True when no item is undefined. Written as a type guard, so after `if (allValid(list))`
 * TypeScript knows the list is T[] without a cast.
 */
export function allValid<T>(items: (T | undefined)[]): items is T[] {
  return items.every((item) => item !== undefined);
}
