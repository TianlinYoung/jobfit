// Turns all app data into a JSON export file, and safely reads such a file back.
//
// Import is all-or-nothing: if any field anywhere is invalid, nothing is imported and every
// problem is reported. A half-imported file would leave the user unsure what they now have.
import { ApplicationValidator } from './ApplicationValidator';
import { allValid, FieldChecker, type ValidationIssue } from './FieldChecker';
import { LIMITS } from './limits';
import { ResumeValidator } from './ResumeValidator';
import type { AppData, Application } from './types';

/** Bump when the file format changes in a way old files can't be read as-is. */
export const SCHEMA_VERSION = 1;

export type DecodeResult = { ok: true; data: AppData } | { ok: false; issues: ValidationIssue[] };

export class ExportCodec {
  static encode(data: AppData, now: Date): string {
    const file = {
      schemaVersion: SCHEMA_VERSION,
      exportedAt: now.toISOString(),
      resume: data.resume,
      applications: data.applications,
    };
    return JSON.stringify(file, null, 2);
  }

  static decode(text: string): DecodeResult {
    if (text.length > LIMITS.importFile) {
      return ExportCodec.reject({ code: 'fileTooLarge', path: '(file)', limit: LIMITS.importFile });
    }
    const raw = ExportCodec.parseJson(text);
    if (raw === undefined) {
      return ExportCodec.reject({ code: 'invalidJson', path: '(file)' });
    }

    const checker = new FieldChecker(true);
    const file = checker.object(raw, '(file)');
    if (file === undefined) {
      return { ok: false, issues: checker.issues };
    }
    // A different version means we don't know the format, so other errors would just be noise.
    if (file.schemaVersion !== SCHEMA_VERSION) {
      return ExportCodec.reject({ code: 'unsupportedVersion', path: 'schemaVersion' });
    }
    checker.timestamp(file.exportedAt, 'exportedAt');
    const resume = file.resume === null ? null : ResumeValidator.check(file.resume, checker, 'resume');
    const applications = ExportCodec.checkApplications(file.applications, checker);

    if (checker.hasIssues() || resume === undefined || applications === undefined) {
      return { ok: false, issues: checker.issues };
    }
    return { ok: true, data: { resume, applications } };
  }

  private static checkApplications(raw: unknown, checker: FieldChecker): Application[] | undefined {
    const items = checker.list(raw, 'applications', LIMITS.applications);
    if (items === undefined) {
      return undefined;
    }
    const applications = items.map((item, i) => ApplicationValidator.check(item, checker, `applications[${i}]`));
    ExportCodec.reportDuplicateIds(applications, checker);
    return allValid(applications) ? applications : undefined;
  }

  // Ids must be unique: edits and deletes find an application by id.
  private static reportDuplicateIds(applications: (Application | undefined)[], checker: FieldChecker): void {
    const seen = new Set<string>();
    applications.forEach((application, i) => {
      if (application === undefined) {
        return;
      }
      if (seen.has(application.id)) {
        checker.report('duplicateId', `applications[${i}].id`);
      }
      seen.add(application.id);
    });
  }

  private static parseJson(text: string): unknown {
    try {
      return JSON.parse(text) as unknown;
    } catch {
      return undefined;
    }
  }

  private static reject(issue: ValidationIssue): DecodeResult {
    return { ok: false, issues: [issue] };
  }
}
