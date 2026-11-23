import { describe, expect, it } from 'vitest';
import { ExportCodec } from '../../src/core/ExportCodec';
import type { ValidationIssue } from '../../src/core/FieldChecker';
import { LIMITS } from '../../src/core/limits';
import type { AppData } from '../../src/core/types';
import { makeApplication } from './applicationFixtures';

const NOW = new Date('2026-11-23T18:00:00.000Z');

const DATA: AppData = {
  resume: {
    skills: ['Java'],
    experiences: [{ id: 'e1', title: 'Intern', organization: 'Acme', bullets: [{ id: 'e1-b1', text: 'Built X' }] }],
  },
  applications: [makeApplication({ id: 'a1' }), makeApplication({ id: 'a2', status: 'Saved', followUpDate: null })],
};

/** A valid export file as a plain object, so tests can break one field at a time. */
function validFile(): Record<string, unknown> {
  return JSON.parse(ExportCodec.encode(DATA, NOW)) as Record<string, unknown>;
}

function issuesFor(file: unknown): ValidationIssue[] {
  const result = ExportCodec.decode(JSON.stringify(file));
  if (result.ok) {
    throw new Error('expected the import to be rejected');
  }
  return result.issues;
}

/** Copy of the valid file with applications[0] changed. */
function withFirstApplication(changes: Record<string, unknown>): Record<string, unknown> {
  const file = validFile();
  const applications = file.applications as Record<string, unknown>[];
  file.applications = [{ ...applications[0], ...changes }, ...applications.slice(1)];
  return file;
}

describe('ExportCodec round trip', () => {
  it('writes the schema version and timestamp, and reads its own output back unchanged', () => {
    const text = ExportCodec.encode(DATA, NOW);
    expect(JSON.parse(text)).toMatchObject({ schemaVersion: 1, exportedAt: '2026-11-23T18:00:00.000Z' });
    expect(ExportCodec.decode(text)).toEqual({ ok: true, data: DATA });
  });

  it('accepts a file with no resume and no applications', () => {
    const text = ExportCodec.encode({ resume: null, applications: [] }, NOW);
    expect(ExportCodec.decode(text)).toEqual({ ok: true, data: { resume: null, applications: [] } });
  });
});

describe('ExportCodec rejects bad files as a whole', () => {
  it('rejects text that is not JSON', () => {
    expect(ExportCodec.decode('{oops')).toEqual({ ok: false, issues: [{ code: 'invalidJson', path: '(file)' }] });
  });

  it('rejects a file over the size limit before parsing it', () => {
    const huge = ' '.repeat(LIMITS.importFile + 1);
    expect(ExportCodec.decode(huge)).toEqual({
      ok: false,
      issues: [{ code: 'fileTooLarge', path: '(file)', limit: LIMITS.importFile }],
    });
  });

  it('rejects a top-level value that is not an object', () => {
    expect(issuesFor([1, 2])).toEqual([{ code: 'notAnObject', path: '(file)' }]);
  });

  it.each([undefined, 2, '1'])('rejects schemaVersion %j and reports only that', (schemaVersion) => {
    expect(issuesFor({ ...validFile(), schemaVersion })).toEqual([{ code: 'unsupportedVersion', path: 'schemaVersion' }]);
  });

  it.each([
    [{ status: 'Ghosted' }, { code: 'invalidStatus', path: 'applications[0].status' }],
    [{ appliedDate: '2026-02-30' }, { code: 'invalidDate', path: 'applications[0].appliedDate' }],
    [{ followUpDate: '11/23/2026' }, { code: 'invalidDate', path: 'applications[0].followUpDate' }],
    [{ createdAt: 'yesterday' }, { code: 'invalidTimestamp', path: 'applications[0].createdAt' }],
    [{ lastScore: 101 }, { code: 'invalidScore', path: 'applications[0].lastScore' }],
    [{ lastScore: 66.5 }, { code: 'invalidScore', path: 'applications[0].lastScore' }],
    [{ company: '   ' }, { code: 'emptyRequired', path: 'applications[0].company' }],
    [{ role: 42 }, { code: 'notText', path: 'applications[0].role' }],
    [{ notes: 'x'.repeat(LIMITS.notes + 1) }, { code: 'tooLong', path: 'applications[0].notes', limit: LIMITS.notes }],
  ])('reports %j precisely', (changes, expected) => {
    expect(issuesFor(withFirstApplication(changes))).toEqual([expected]);
  });

  it('accepts text exactly at the length limit', () => {
    const result = ExportCodec.decode(JSON.stringify(withFirstApplication({ company: 'x'.repeat(LIMITS.company) })));
    expect(result.ok).toBe(true);
  });

  it('reports every problem at once, across applications and the resume', () => {
    const file = withFirstApplication({ status: 'Nope', appliedDate: 'soon' });
    (file.resume as { skills: unknown }).skills = ['Java', 7];
    expect(issuesFor(file)).toEqual([
      { code: 'notText', path: 'resume.skills[1]' },
      { code: 'invalidStatus', path: 'applications[0].status' },
      { code: 'invalidDate', path: 'applications[0].appliedDate' },
    ]);
  });

  it('imports nothing when only one of many applications is bad (no partial import)', () => {
    const file = validFile();
    const applications = file.applications as Record<string, unknown>[];
    file.applications = [...applications, { ...applications[0], id: 'a3', status: 'bad' }];
    const result = ExportCodec.decode(JSON.stringify(file));
    expect(result.ok).toBe(false);
  });

  it('rejects duplicate application ids', () => {
    const file = validFile();
    const applications = file.applications as Record<string, unknown>[];
    file.applications = [applications[0], { ...applications[1], id: 'a1' }];
    expect(issuesFor(file)).toEqual([{ code: 'duplicateId', path: 'applications[1].id' }]);
  });

  it('rejects too many applications', () => {
    const file = validFile();
    file.applications = new Array(LIMITS.applications + 1).fill(0);
    expect(issuesFor(file)).toEqual([{ code: 'tooMany', path: 'applications', limit: LIMITS.applications }]);
  });

  it('rejects missing or mistyped sections', () => {
    expect(issuesFor({ ...validFile(), applications: {} })).toEqual([{ code: 'notAList', path: 'applications' }]);
    expect(issuesFor({ ...validFile(), resume: 'me' })).toEqual([{ code: 'notAnObject', path: 'resume' }]);
    expect(issuesFor({ ...validFile(), exportedAt: 5 })).toEqual([{ code: 'invalidTimestamp', path: 'exportedAt' }]);
  });

  it('checks resume sizes too', () => {
    const file = validFile();
    (file.resume as { skills: unknown }).skills = ['x'.repeat(LIMITS.skill + 1)];
    expect(issuesFor(file)).toEqual([{ code: 'tooLong', path: 'resume.skills[0]', limit: LIMITS.skill }]);
  });

  it('ignores "__proto__" keys: no prototype pollution and no smuggled fields', () => {
    // Hand-written JSON, because JSON.stringify would not keep a "__proto__" key.
    // JSON.parse turns "__proto__" into an ordinary own property; the validator then builds
    // fresh objects from the known fields only, so the extra key is dropped.
    const application = JSON.stringify(makeApplication({ id: 'a1', status: 'Applied' }));
    const poisoned = application.replace('{', '{"__proto__":{"status":"Offer","polluted":true},');
    const text = `{"__proto__":{"polluted":true},"schemaVersion":1,"exportedAt":"2026-11-23T18:00:00.000Z","resume":null,"applications":[${poisoned}]}`;

    const result = ExportCodec.decode(text);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const imported = result.data.applications[0]!;
    expect(imported.status).toBe('Applied');
    expect(Object.keys(imported)).not.toContain('__proto__');
    expect(Object.getPrototypeOf(imported)).toBe(Object.prototype);
    expect(({} as Record<string, unknown>).polluted).toBeUndefined();
  });

  it('handles deeply nested values without crashing', () => {
    const depth = 50_000;
    const deep = '['.repeat(depth) + ']'.repeat(depth);
    const application = JSON.stringify(makeApplication({ id: 'a1' }));

    // Deep nesting where text is expected: a clear "expected text" error.
    const inNotes = application.replace('"notes":""', `"notes":${deep}`);
    const notesText = `{"schemaVersion":1,"exportedAt":"2026-11-23T18:00:00.000Z","resume":null,"applications":[${inNotes}]}`;
    expect(ExportCodec.decode(notesText)).toEqual({
      ok: false,
      issues: [{ code: 'notText', path: 'applications[0].notes' }],
    });

    // Deep nesting in an unknown field is never walked, so it is simply ignored.
    const inExtra = application.replace('{', `{"extra":${deep},`);
    const extraText = `{"schemaVersion":1,"exportedAt":"2026-11-23T18:00:00.000Z","resume":null,"applications":[${inExtra}]}`;
    expect(ExportCodec.decode(extraText).ok).toBe(true);

    // A deeply nested top level is rejected without recursion.
    expect(ExportCodec.decode(deep)).toEqual({ ok: false, issues: [{ code: 'notAnObject', path: '(file)' }] });
  });

  it('rejects a bullet that is not an object', () => {
    const file = validFile();
    (file.resume as { experiences: { bullets: unknown }[] }).experiences[0]!.bullets = ['plain text'];
    expect(issuesFor(file)).toEqual([{ code: 'notAnObject', path: 'resume.experiences[0].bullets[0]' }]);
  });
});
