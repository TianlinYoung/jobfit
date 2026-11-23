// Checks that untrusted data really is an Application: every field, its type, format and size.
import { CalendarDate } from './CalendarDate';
import { FieldChecker } from './FieldChecker';
import { LIMITS } from './limits';
import { APPLICATION_STATUSES, type Application } from './types';

export class ApplicationValidator {
  /**
   * For the app's own saved list: keeps each valid application and skips broken ones,
   * so one corrupted record does not hide all the others.
   */
  static parseStoredList(raw: unknown): Application[] {
    if (!Array.isArray(raw)) {
      return [];
    }
    const valid: Application[] = [];
    for (const item of raw) {
      const checker = new FieldChecker(false);
      const application = ApplicationValidator.check(item, checker, 'application');
      if (application !== undefined && !checker.hasIssues()) {
        valid.push(application);
      }
    }
    return valid;
  }

  /** Records every problem in `checker`; returns the application only if all fields are valid. */
  static check(raw: unknown, checker: FieldChecker, path: string): Application | undefined {
    const o = checker.object(raw, path);
    if (o === undefined) {
      return undefined;
    }
    const id = checker.requiredText(o.id, `${path}.id`, LIMITS.id);
    const company = checker.requiredText(o.company, `${path}.company`, LIMITS.company);
    const role = checker.requiredText(o.role, `${path}.role`, LIMITS.role);
    const status = checker.oneOf(o.status, APPLICATION_STATUSES, `${path}.status`);
    const appliedDate = checker.nullableDate(o.appliedDate, `${path}.appliedDate`, CalendarDate.isValid);
    const followUpDate = checker.nullableDate(o.followUpDate, `${path}.followUpDate`, CalendarDate.isValid);
    const notes = checker.text(o.notes, `${path}.notes`, LIMITS.notes);
    const jdText = checker.text(o.jdText, `${path}.jdText`, LIMITS.jdText);
    const lastScore = checker.nullableScore(o.lastScore, `${path}.lastScore`);
    const createdAt = checker.timestamp(o.createdAt, `${path}.createdAt`);
    const updatedAt = checker.timestamp(o.updatedAt, `${path}.updatedAt`);

    if (
      id === undefined ||
      company === undefined ||
      role === undefined ||
      status === undefined ||
      appliedDate === undefined ||
      followUpDate === undefined ||
      notes === undefined ||
      jdText === undefined ||
      lastScore === undefined ||
      createdAt === undefined ||
      updatedAt === undefined
    ) {
      return undefined;
    }
    return { id, company, role, status, appliedDate, followUpDate, notes, jdText, lastScore, createdAt, updatedAt };
  }
}
