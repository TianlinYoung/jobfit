# Architecture

JobFit is a browser-only app: no server, no database. Everything runs in the page, and data is kept in `localStorage`. The code is split into three layers with a strict dependency direction.

## Layers

```
            ┌──────────────────────────────────────────────┐
  main.tsx  │ builds the real objects and wires them up    │
            └──────────────┬───────────────────────────────┘
                           │ passes repository + matchService as props
            ┌──────────────▼───────────────────────────────┐
  src/ui/   │ React components, i18n dictionaries          │
            │ owns screen state; turns core data into text │
            └───────┬───────────────────────┬──────────────┘
                    │ calls                 │ calls (through the Repository interface)
            ┌───────▼──────────┐    ┌───────▼──────────────────────┐
  src/core/ │ business logic   │◄───┤ src/storage/                 │
            │ plain TypeScript │    │ Repository + implementations │
            └──────────────────┘    └──────────────────────────────┘
```

Arrows point from the layer that imports to the layer it imports. The rules:

| Layer | May import | Must not import | Responsibility |
|---|---|---|---|
| `src/core/` | only other `core` files and `core/data/skills.json` | React, the DOM, `localStorage`, `storage/`, `ui/` | Parsing, matching, scoring, gap suggestions, reminders, calendar dates, validation of untrusted data |
| `src/storage/` | `core` (types and validators) | React, `ui/` | Saving and loading. `Repository` is the interface; `LocalStorageRepository` and `InMemoryRepository` implement it |
| `src/ui/` | `core`, the `Repository` **interface**, React | `window.localStorage` directly. App data goes through `Repository`; the language choice is saved by `i18n/language.ts` through a store that `main.tsx` passes in | State, rendering, user input, all user-facing text |
| `src/main.tsx` | everything | — | The only place that chooses concrete implementations |

### core: plain TypeScript classes

Each file is one small class with one job, written in a Java-like style: constructor injection, `private readonly` fields, interfaces in `types.ts`. Two kinds of class:

- **Matching pipeline** (instance classes, built once): `SkillDictionary` → `TextMatcher` (+ `WordBoundary`, `AmbiguityRules`) → `JdSectionSplitter` → `JdParser`; `ResumeIndex`; `ScoreCalculator`; `GapAdvisor`. `MatchService` builds them in its constructor and is the only class the UI calls for matching.
- **Rules and validation** (static methods, no state): `CalendarDate`, `ApplicationRules`, `ReminderPolicy`, `FieldChecker`, `ResumeValidator`, `ApplicationValidator`, `ExportCodec`.

core returns **data, never sentences** (DECISIONS D10). For example, `GapAdvisor` returns `{ kind: 'canHighlightInBullet', skillName, bulletText, relatedKeyword, … }`, and `src/ui/i18n/gapMessage.ts` turns it into English or Chinese.

### storage: one interface, two implementations

`Repository` (`src/storage/Repository.ts`) returns Promises even though `localStorage` is synchronous, so a future server-backed version can be swapped in without changing any caller, like a Java interface returning `CompletableFuture`.

- `LocalStorageRepository` stores two JSON strings: `jobfit.resume.v1` and `jobfit.applications.v1`. Everything it reads goes through `ResumeValidator` / `ApplicationValidator`, because stored data may be old, hand-edited or corrupt. It takes a `KeyValueStore` (the three `localStorage` methods it uses), so tests pass a fake.
- `InMemoryRepository` keeps data in fields. Tests run the same contract tests against both (`describe.each` in `tests/storage/LocalStorageRepository.test.ts`).

### ui: React components

`App.tsx` owns the shared state (`tab`, `resume`, `applications`, `isLoading`, `error`, `jdText`, `analyzedJd`) and is the only component that talks to the repository. Pages (`match/`, `resume/`, `board/`) receive data and callbacks as props. Text comes from `useT()` (`src/ui/i18n/LanguageContext.tsx`), which reads the current language's dictionary (`en.ts` or `zh.ts`).

## Data flow

### Startup

1. `main.tsx` creates `new LocalStorageRepository(window.localStorage)` and `MatchService.createDefault()` (which loads `skills.json`), and renders `<LanguageProvider><App …/></LanguageProvider>`.
2. `App`'s `useEffect` calls `repository.loadResume()` and `repository.listApplications()` together. Invalid stored data comes back as `null` / skipped records, never as an exception.

### Matching a job

```
JD text ─┐
         ├─► MatchService.analyze(jdText, resume) ─► MatchReport ─► UI components ─► text via useT()
resume  ─┘
```

Inside `analyze`:
1. `JdParser.parse` → `JdSectionSplitter` labels each JD line (required / preferred / context / unspecified) → `TextMatcher` finds dictionary skills in each line → one `ExtractedSkill` per skill, keeping its most important label.
2. `ResumeIndex` pre-computes which skills are in the skills list and which bullets mention which skill.
3. `ScoreCalculator.calculate` gives each skill a weight (`IMPORTANCE_WEIGHT`) and a credit (`STATUS_CREDIT`), and computes `score = round(100 × Σ(weight × credit) / Σ weight)`, or `null` when no skill was found.
4. `GapAdvisor.advise` creates one `GapSuggestion` per skill that is not in the skills list.

`MatchPage` calls `analyze` during rendering (`src/ui/match/MatchPage.tsx`) instead of storing the report in state, so the report is always consistent with the current resume and the JD that was analyzed (`analyzedJd`).

### Editing applications

```
user action ─► App handler ─► ApplicationRules.create/update/changeStatus(…, clock())
                                   │ new Application object
                                   ├─► setApplications(…)          (screen updates first)
                                   └─► repository.saveApplication  (then it is stored)
```

`ApplicationRules` fills default dates when an application enters Applied, OA or Interview (D12). The board computes reminders while rendering, with `ReminderPolicy.reminderFor(application, today)` and `ReminderPolicy.needingAction(applications, today)`.

`LocalStorageRepository.saveApplication` reads the list, changes it and writes it back in one synchronous step, with no `await` in between. JavaScript runs one synchronous block at a time, so saves started together (loading 7 sample applications) cannot overwrite each other.

### Import and export

- **Export:** `ExportCodec.encode({ resume, applications }, now)` → a JSON file with `schemaVersion: 1` and `exportedAt`.
- **Import:** file size check → `file.text()` → `ExportCodec.decode(text)`. `decode` checks the whole file with one `FieldChecker` and collects every problem with its path. Only if there are none does the user see a confirm dialog, and only then does `repository.replaceAll(data)` run (D13).

## Why core does not depend on React

1. **Testable without a browser.** Every core class is tested with plain unit tests (no DOM, no rendering). That is how `src/core` has 100% line, branch and function coverage with tests that run in about a second.
2. **One reason to change per file.** The scoring formula changes for product reasons; components change for layout reasons. Keeping them apart means a layout change cannot break the score, and the other way round.
3. **Reusable.** The same `MatchService` could run in a Node backend, a CLI or a browser extension unchanged. Since core produces no text, the same `MatchReport` can be shown in any language.
4. **Explainable.** In an interview the whole algorithm can be walked through in `src/core/` without explaining React at the same time.

The cost is a little ceremony: the UI must translate core's structured results into text (`gapMessage.ts`), and dependencies are passed in by hand rather than through a framework.

## Time: clock injection and `CalendarDate`

Two kinds of time appear in the data, and they are never mixed:

| Kind | Example | Type | Made by |
|---|---|---|---|
| Instant | `createdAt`, `updatedAt`, `exportedAt` | ISO string with `Z` (`now.toISOString()`) | `ApplicationRules`, `ExportCodec` |
| Calendar date | `appliedDate`, `followUpDate`, "today" | `"YYYY-MM-DD"` string, no time zone | `CalendarDate` |

**Nothing in core reads the clock.** Every function that needs the current time takes `now: Date` as a parameter (`ApplicationRules.create(fields, id, now)`, `ExportCodec.encode(data, now)`). In the UI, `App` receives an optional `clock: () => Date` prop that defaults to `() => new Date()`, and computes `today = CalendarDate.today(clock())` once per render. `BoardPage`, the reminder banner and each card get `today` as a prop, so the whole page agrees on what day it is.

**`CalendarDate.today(now)` uses local year, month and day** (`getFullYear`, `getMonth`, `getDate`), not `toISOString()`, which is UTC. At 4:30 pm in Seattle it is already the next day in UTC, so a follow-up due today would show as one day late (D11).

**Date arithmetic uses UTC midnight.** `addDays` and `daysBetween` convert a date string to `Date.UTC(year, month - 1, day)`. UTC has no daylight saving, so one day is always exactly 24 hours and a result never shifts by a day around a DST change. Dates are displayed with `timeZone: 'UTC'` (`formatDate` in `src/ui/format.ts`) for the same reason.

**Testing.** Because `now` is a parameter, tests pick exact instants. `tests/timeZone.ts` changes the process time zone with `vi.stubEnv('TZ', …)`. `tests/core/CalendarDate.test.ts` checks Seattle at 00:30 UTC (still the previous day locally) and Shanghai at 23:00 UTC (already the next day locally). CI runs the whole suite twice, with `TZ=UTC` and `TZ=America/Los_Angeles` (D15), to catch any other code that depends on the machine's zone.

## Where to go next

- [DECISIONS.md](DECISIONS.md): why each choice was made, what was rejected, and the known limitations.
- [READING_GUIDE.md](READING_GUIDE.md): the order to read the code in.
