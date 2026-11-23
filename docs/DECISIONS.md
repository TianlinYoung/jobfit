# Design Decisions

Each entry says what was chosen, what was rejected, and what the choice costs.
More entries are added as the project grows.

---

## D1. Rule-based matching with a skill dictionary, not an LLM or NLP library

**Decision.** Skills are found by looking up a hand-written dictionary (`src/core/data/skills.json`) in the JD text.

**Why.** The output must be explainable and reproducible: the same JD and resume always give the same score, and every point can be traced to one line of the JD. It also runs offline in the browser, costs nothing, and is easy to unit test.

**Rejected.** An LLM call, which is non-deterministic, needs an API key and a backend, and is hard to test. An NLP library (tokenizers, embeddings), which adds a dependency and is hard to explain in one paragraph.

**Cost.** Only skills in the dictionary are recognized. The dictionary must be maintained by hand. The parser does not understand negation ("no Java needed") or years of experience.

---

## D2. Longest alias first, with "claimed" text, plus context rules for short aliases

**Decision.** `TextMatcher` tries aliases longest first. Once a match is accepted, its characters are "claimed", and shorter aliases cannot match inside them. Matches must also sit on word boundaries. Very short aliases (`C`, `R`, `Go`) go through `AmbiguityRules`, which rejects known English patterns:

- `R&D` and `C&C`: the letter touches an ampersand.
- `C-suite` and `R-squared`: the letter is a hyphen prefix.
- `D.C.`: the letter is part of a dotted abbreviation.
- `Go-to-market`, and "Go above and beyond" at the start of a sentence.

**Why.** Without claiming, "C++" would also produce "C" and give a JD a skill it never asked for. Without context rules, "R&D" would count as the R language.

**Rejected.** Regex `\b` boundaries: they treat `+` and `#` as boundaries, so `C` would match inside `C++`. A general NLP part-of-speech tagger: too heavy for this problem.

**Cost.** The rules are a list of known patterns. A false positive that no rule covers (for example "Let's Go!" mid-sentence) will still slip through. Each new pattern needs a new rule and a test.

---

## D3. Case-sensitive aliases for words that are also normal English

**Decision.** Aliases such as `Go`, `React`, `REST`, `Swift`, `Node`, `JS` and `ML` only match with exact casing. Unambiguous ones (`python`, `kubernetes`) match in any case.

**Why.** "React quickly" and "the rest of the team" are ordinary English, but "React" and "REST" are almost always the technology.

**Rejected.** Making everything case-sensitive: this misses "python" or "SQL" typed in odd casing. Removing the ambiguous skills: this loses common requirements like Go.

**Cost.** A JD that writes "react.js" in lowercase still works (it is a separate, insensitive alias), but one that writes "react" alone will be missed. The resume skills list is always case-insensitive, since someone typing "go" there clearly means the language.

---

## D4. Section weights: Required 3, Unspecified 2, Preferred 1, Context 1

**Decision.** Each line of the JD is labeled by the heading it sits under.

- If the JD has at least one Required or Preferred heading, any text outside those sections is labeled **context** and weighted 1. That includes the company intro before the first heading, "What you'll do", and Benefits.
- Only when the JD has **no** requirement headings at all is everything **unspecified** and weighted 2.

**Why weight 1 rather than ignoring intro text.** An intro like "we build with Kafka" is a real but weak signal. Ignoring it hides useful information, and counting it as required would punish candidates for a company description. Weight 1 keeps it visible in the breakdown without letting it dominate the score.

**Rejected.** Ignoring intro text entirely (simpler, but loses signal). Giving intro text weight 2 (overstates it).

**How headings are recognized.** A heading is a short, non-bulleted line, or the part of a line before a colon, that contains a heading keyword ("Requirements", "Nice to have", "About ..."). It must also **not name any dictionary skill**. Lines like "Experience with React preferred", "Bonus points if you know Rust" or "About 2 years of Python experience" are short and contain heading words, but they are content. Treating them as headings would drop the skill, and in the last case would turn every following line into context.

**Cost.** Skills in a "Responsibilities" section are real requirements in some JDs, and weight 1 undervalues them. A real heading that names a skill ("Python Developer Requirements") is read as content, so it does not start a new section. See also [Known limitations](#known-limitations).

---

## D5. A skill found only in a bullet earns half credit (bulletOnly = 0.5)

**Decision.** A skill in the skills list earns full credit (1.0). A skill that only appears in an experience bullet earns 0.5. A missing skill earns 0.

**Why.** This tool's goal is to help you make the resume *read* well for the reader. A bullet mention is real evidence, but it is easy to miss: recruiters and keyword filters often scan the skills section first. Half credit reflects that, and it pairs with an `addToSkillsList` suggestion, so the fix is a one-line edit.

**Counter-argument (taken seriously).** A bullet is *stronger* evidence than a skills list, because it shows the skill used in context, while a skills list is just a claim. Under that view, bulletOnly should get full credit, or even more than listed.

**Why we still chose 0.5.** The score measures how visible a match is, not how strong the candidate is. The breakdown still shows the bullet as evidence, so nothing is hidden. Because the value is one constant (`STATUS_CREDIT` in `importance.ts`), changing it is a one-line change with tests to update.

**Rejected.** 1.0 (cannot tell the user that their skills list is missing something). 0 (ignores real evidence).

**Cost.** 0.5 is a judgment call, not a measured value. The model also does not reward a skill that is both listed *and* in bullets over one that is only listed.

---

## D6. Gap suggestions are always conditional: never suggest claiming experience you don't have

**Decision.** When a missing skill is related to an existing bullet (Docker ↔ "deployed"), the message is always conditional:

> If you actually used Docker in this work, mention it explicitly in this bullet ... If you did not use it, leave the bullet as it is.
>
> 如果你确实在这段经历中用过 Docker，可以在这条 bullet 里明确写出来……如果没有用过，保持这条 bullet 不变。

Skills with no related bullet are labeled "truly missing" and framed as something to learn.

**Why.** A resume tool that nudges people to add skills they don't have causes real harm. Candidates get caught in interviews, and trust in the tool is lost. The related-keyword match is only a hint that the skill *might* have been involved, so the wording must leave the decision to the user. Since D10, the wording lives in the UI dictionaries, and `tests/ui/i18n.test.ts` locks it in for **every** language. Each language must contain the conditional phrase and must not match a list of directive phrasings. A new language cannot ship without passing the same check.

**Rejected.** Directive wording such as "Add Docker to this bullet". It reads better, but it encourages fabrication.

**Cost.** The advice is less punchy, and it cannot tell whether the user really used the skill.

---

## D7. Report unrecognized resume skills instead of silently dropping them

**Decision.** Skills-list entries the dictionary doesn't know are returned in `MatchReport.unrecognizedResumeSkills`. They are shown on the result page.

**Why.** If a user writes "Springboot" and the dictionary only knows "Spring Boot", silently ignoring it would make the score look wrong for no visible reason. Showing the list explains the gap and tells us which aliases to add to the dictionary.

**Cost.** Unrecognized skills still earn no points. The user has to rename them, or we have to extend the dictionary.

---

## D8. Business logic in plain TypeScript classes under `src/core/`, with no React imports

**Decision.** All parsing, matching and scoring lives in small single-purpose classes. `MatchService` is the only entry point the UI uses.

**Why.** It can be tested with fast unit tests and no browser. It reads like Java, with classes, constructor injection and interfaces. It could later move to a Node backend unchanged.

**Rejected.** Putting logic in React hooks or components (hard to test, mixes concerns). Plain functions only (fine, but the class style was chosen to match the author's Java background).

**Cost.** There are more files and a little more ceremony (constructors that just store dependencies) than a functional style would need.

---

## D9. Related keywords: prefix match for 4+ letters, whole word for shorter

**Decision.** `related` keywords in `skills.json` are matched by `WordBoundary.containsKeyword`. A keyword with 4 or more letters matches the start of a word, so "deploy" also catches "deployed" and "deployment". A shorter keyword must be a whole word, so "app" matches "app" but not "applied" or "approach". Plural forms of short keywords are listed explicitly (Android/iOS use `["app", "apps", "mobile"]`).

**Why.** Prefix matching saves listing every word form, but very short prefixes start too many unrelated words. Four letters is the shortest length where false hits were rare in the dictionary's keywords.

**Rejected.** A stemming library (extra dependency, harder to explain). Whole-word matching only (would need every inflection listed by hand).

**Cost.** The cut-off is a rule of thumb. A 4+ letter keyword can still hit an unrelated word ("test" → "testimonial"). These hints only choose which bullet to suggest, never the score, so a wrong hint costs little.

---

## D10. Hand-written i18n dictionaries, and core never produces user-facing text

**Decision.** The UI supports English and Simplified Chinese through two plain TypeScript objects (`src/ui/i18n/en.ts`, `zh.ts`), a React Context (`LanguageProvider`) and a `useT()` hook. `zh` is declared as `const zh: Messages`, where `Messages = typeof en`. A missing, extra or misspelled key, or a message function with the wrong parameters, is a **compile error**. Text with values in it is a small function (`formula(earned, max, score)`), so each language can order words as its grammar needs.

Alongside this, `src/core/` returns **data, not sentences**:
- `GapSuggestion` is a tagged union. Each `kind` carries exactly the values its message needs: `skillName`, `bulletText`, `relatedKeyword`.
- `SkillScore.evidenceBullets` holds only bullet texts. The old "Skills list" marker string is gone; `status: 'listed'` already says that.

**Why hand-written.** Two languages and about 90 strings do not justify a library. The type check that i18n libraries add through plugins or code generation comes for free from `typeof en`. Every piece is something a Java developer can read: an interface, two implementations, a lookup. No new API to learn.

**Why core has no text.** Business logic should not know which language is on screen. The same `MatchReport` can be shown in English, in Chinese, or sent from a future backend to any client. Tests also get sturdier: core tests assert structure (kind, ids, keyword), so rewording a message cannot break them, and wording rules are tested once, in the UI layer, for all languages.

**Rejected.**
- `react-i18next` / `FormatJS`. They are powerful (pluralization, lazy loading, ICU formats), but add dependencies and concepts this app does not need.
- Keeping English sentences in core and translating them in the UI. Matching on English text is fragile and breaks the moment wording changes.

**Cost.** No pluralization rules; messages avoid needing them, for example "5 of 14 JD skills". All languages load up front, which is fine at this size. Adding a third language means one more file of about 90 entries. The JD parser itself remains English-only (see Known limitations); the Chinese UI says so next to the JD box.

---

## D11. "Today" is the user's local calendar date, built by hand and passed in

**Decision.** Dates without a time (applied on, follow up on) are stored as `"YYYY-MM-DD"` strings. `CalendarDate.today(now)` builds today's string from the **local** year, month and day (`getFullYear` / `getMonth` / `getDate`). It never uses `toISOString()`. `now` is always passed in: App gets it from an injectable `clock`, and core functions take it as a parameter. Date arithmetic (`addDays`, `daysBetween`) treats a date as midnight UTC, so daylight saving never shifts a result.

**Why.** `toISOString()` is UTC. At 4:30 pm in Seattle (UTC−8) it already returns tomorrow's date, so a follow-up due today would show as "due yesterday". The bug only appears in the evening, which makes it easy to miss. Passing `now` in lets tests run at any instant and in any zone. `CalendarDate.test.ts` sets the zone to Seattle at 00:30 UTC, and to Shanghai at 23:00 UTC, and checks both.

**Rejected.** Storing full `Date`s or ISO timestamps for calendar dates (wrong model: "Nov 23" is not an instant). A date library such as date-fns or Luxon (an extra dependency for about 40 lines of code).

**Cost.** Timestamps (`createdAt`, `updatedAt`) and calendar dates are two different kinds of value, and code must not mix them up. Dates are also shown with `timeZone: 'UTC'` formatting, for the same reason.

---

## D12. Follow-up reminder rules

**Decision.** Defined in `ReminderPolicy`:

| Status | Reminders? | Why |
|---|---|---|
| Applied, OA, Interview | Yes | You are waiting on the company; following up is useful |
| Saved | No | Not applied yet; nothing to follow up on |
| Offer, Rejected | No | Final; a reminder would be noise. The follow-up date is kept, just ignored |

For a status that gets reminders and has a follow-up date, compared with *today* (local, D11):

| Follow-up date | Shown as | Where |
|---|---|---|
| before today | **Overdue by N days** (red) | card badge + banner |
| today | **Follow up today** (amber) | card badge + banner |
| 1–3 days ahead | **Follow up in N days** (blue) | card badge only |
| later, or none | nothing | — |

The banner lists the most overdue first. Within a column, cards are sorted by soonest follow-up, so overdue cards rise to the top.

**Default dates.** When an application *enters* Applied, OA or Interview (created that way, or its status changes), an empty applied date becomes today, and an empty follow-up date becomes applied + 7 days. Dates the user set are never overwritten. Clearing the follow-up date without changing the status turns reminders off for that application.

**Why.** Reminders should only appear when there is something to do, or the user learns to ignore them. Seven days is a common rule of thumb for following up after applying. The 3-day "upcoming" window gives notice without crowding the banner.

**Rejected.** Browser notifications (need permission and a running page). Reminders for Saved jobs, such as application deadlines (a different feature, with a different date).

**Cost.** Reminders are only visible while the app is open. There is no push or email.

---

## D13. Imports are untrusted: validate every field, all-or-nothing

**Decision.** `ExportCodec.decode` checks the whole file before anything is saved:
- size (5 MB), valid JSON, and `schemaVersion === 1`;
- every field's type;
- status from the fixed list, real calendar dates (`2026-02-30` is rejected), ISO timestamps, and scores as whole numbers 0–100;
- text length limits and list size limits (`limits.ts`);
- unique application ids.

Every problem is collected with its path (`applications[2].status`) and shown to the user in their language. If there is **any** problem, nothing is imported. If the file is valid, the user must confirm the overwrite (showing what the file contains) before `replaceAll` runs.

The same per-field rules (`FieldChecker`) also read the app's own localStorage, with two differences: size limits are off, and a broken stored record is skipped rather than failing the whole list. Form inputs use the same limits as `maxLength`, so the app never creates data its own importer would reject.

**Why.** A JSON file can come from anywhere: an old version, a hand edit, another tool. A partial import leaves the user unsure what they have. Specific messages let them fix the file instead of guessing. `replaceAll` writes the large applications value first, so a full-storage failure happens before anything has changed.

**Rejected.** A schema library such as zod (another dependency and DSL to learn; `FieldChecker` is about 145 readable lines). Merging imported data with existing data (needs conflict rules; v1 keeps replace-only, with a confirm).

**Cost.** Validation code must be updated whenever a field is added. An older export file will need a migration step once `schemaVersion` changes.

---

## D14. Only an explicit language choice is saved

**Decision.** On first visit the language comes from `navigator.language` (`zh*` → Chinese, otherwise English), and that guess is **not** written to localStorage. Only picking a language in the header saves it.

**Why.** If the guess were saved, a user whose browser language later changes would be stuck with the old one, even though they never chose it.

**Cost.** None worth noting; reading the browser language on every visit is free.

---

## D15. Lint and CI: typescript-eslint on TypeScript 6, a time-zone matrix, and each relaxed rule explained

**Decision.** `npm run lint` runs ESLint 10 with a flat config (`eslint.config.js`): `@eslint/js` recommended, `typescript-eslint` `recommendedTypeChecked`, and `eslint-plugin-react-hooks` recommended for `src/ui/` and `src/main.tsx`. It must finish with 0 errors and 0 warnings (`--max-warnings 0`). GitHub Actions (`.github/workflows/ci.yml`) runs `npm ci → lint → typecheck → test → build` on every push and pull request, once with `TZ=UTC` and once with `TZ=America/Los_Angeles`.

**TypeScript 6 for linting only.** The project compiles with TypeScript 7, the native (Go) compiler. Its npm package no longer ships the JavaScript compiler API, and typescript-eslint 8.74 needs that API (its peer range is `typescript <6.1`). So:
- `@typescript/typescript6` (TypeScript 6.0, the same language, with the JavaScript API) is a dev dependency.
- A module resolve hook at the top of `eslint.config.js` sends `import 'typescript'` to it, **only** for imports made by typescript-eslint's own packages. `tsc`, Vite and Vitest are unaffected.
- `overrides` in `package.json` relaxes typescript-eslint's peer range to the installed TypeScript, so `npm ci` does not fail on the peer conflict.

typescript-eslint also has an experimental TypeScript 7 backend, but it requires a 7.1 pre-release; we stay on released versions. When typescript-eslint supports TypeScript 7 directly, the hook, the override and `@typescript/typescript6` can all be deleted.

**Rule changes.** No rule is switched off globally. Each change, and why:

| Where | Change | Why |
|---|---|---|
| all files | `no-unused-vars`: `argsIgnorePattern: '^_'` | Every `importIssue` message takes the same `(path, limit)` parameters so they can share one type; some messages don't use them. The `_` prefix marks that, as tsc's `noUnusedParameters` already allows. |
| all files | `unbound-method`: `ignoreStatic: true` | Static methods such as `CalendarDate.isValid` never use `this`, so passing them as callbacks is safe. Instance methods are still checked. |
| all files | `restrict-template-expressions`: `allowNever: true` | `never` only appears in branches the type checker proved unreachable, such as the last-resort error in `CalendarDate.toUtcMillis`. |
| `*.js`, `*.mjs` | `disableTypeChecked` | Plain JavaScript (`eslint.config.js`, `scripts/screenshot.mjs`) has no types, so every value is `any` and the type-aware rules would flag every line. The other rules still apply. |
| `src/storage/**` | `require-await` off | `Repository` is Promise-based so a server-backed version can be added later. The browser and in-memory versions do their work synchronously, so their `async` methods have nothing to await. `async` stays on purpose: a thrown error (storage full) becomes a rejected Promise, which is what callers expect. Removing it would change that. |

**Code changed to pass lint (no behavior change).**
- `src/core/ScoreCalculator.ts`: `.sort(this.byWeightThenName)` → `.sort((a, b) => this.byWeightThenName(a, b))`. The method does not use `this` today, but if it ever did, the unbound version would break silently.
- `src/core/FieldChecker.ts`: `list()` returns `value as unknown[]`. `Array.isArray` types the array as `any[]`; this is a type-only change.
- `src/ui/board/DataTransferPanel.tsx`: `onChange={(event) => void handleFile(event)}`. `handleFile` is async and handles its own errors; `void` marks that the event handler deliberately does not wait for it.
- `tests/ui/i18n.test.ts`: a message function is cast to `(...args: unknown[]) => unknown` before being called with sample arguments.

**Why a time-zone matrix.** Most date bugs only show up when local time and UTC disagree about the date (D11). UTC is what CI servers use by default; Los Angeles (UTC−8/−7) disagrees with UTC every afternoon and evening. `fail-fast: false` lets both zones finish, so a failure in only one zone is easy to spot. The workflow prints `TZ` and `date` before the tests, so the log shows which zone each run used. The tests that need a specific zone (`tests/timeZone.ts`) set it themselves; the matrix additionally checks that nothing else depends on the machine's zone.

**Node version.** `engines.node` is `^26.13.1`, the version the project is developed with. CI pins `actions/setup-node` to exactly `26.13.1`, the lowest version `engines` allows, and caches npm downloads.

**Rejected.** Downgrading the whole project to TypeScript 6 (gives up the faster compiler the project already uses). Linting without type information (loses the most useful rules, such as `no-floating-promises`). Running the full four-zone set from the stage 3 review in CI (UTC and Los Angeles cover the "local date ≠ UTC date" case; Shanghai and Kiritimati can still be run by hand).

**Cost.** The resolve hook is unusual and must be explained to anyone reading the config. Lint type-checks with TypeScript 6, so in theory it could disagree with `tsc` (7) on an edge case; `npm run typecheck` remains the source of truth for type errors.

---

## D16. Minimal `vercel.json`, not deployed yet

**Decision.** `vercel.json` holds only what a static single-page app needs. Nothing is deployed and no account is linked; the file is there so a later deploy needs no extra setup.

| Field | Value | Why |
|---|---|---|
| `buildCommand` | `npm run build` | The same command CI runs, so the deployed bundle is the one CI checked. |
| `outputDirectory` | `dist` | Where `vite build` writes the bundle (Vite's default). |
| `rewrites` | `/(.*)` → `/index.html` | Any path that is not a real file gets the app's page, so a reload or a shared link to a sub-path does not show a 404. Real files such as `/assets/*.js` are served first, before rewrites apply. |

**Rejected.** Headers, caching rules, redirects and framework presets: nothing in the app needs them yet. Every extra field is one more thing to explain.

**Cost.** The app has no URL routes yet (tabs are React state), so the rewrite only matters once routes are added. It is kept because it is the standard SPA setting and costs nothing.

---

## Known limitations

- **"A plus" demotes the whole line.** Any line containing "a plus", "nice to have", "preferred" or "bonus" is labeled Preferred as a whole. So "Java required; Kotlin a plus" demotes Java to Preferred as well. Splitting a line into clauses would fix this, at the cost of a more complex parser.
- **Headings that name a skill are read as content** (see D4). For example, "Python Developer Requirements" does not start a Required section.
- **No negation or experience levels.** "No Java needed" still counts Java. "3+ years of Python" counts the same as "some Python".
- **Dictionary only.** Skills not in `skills.json` are invisible in the JD. In the resume they are listed as unrecognized (D7).
- **Ambiguity rules are a known-pattern list** (D2). A false positive that no rule covers, such as "Let's Go!" mid-sentence, still matches.
- **Reminders only show while the app is open** (D12). There are no notifications or emails.
- **Import replaces everything** (D13); there is no merge.
- **Two open tabs overwrite each other.** Each tab keeps its own copy of the data in memory and writes its whole list to localStorage. An edit made in one tab is lost when the other tab saves next. Listening to the `storage` event, or moving to a backend, would fix this.
- **"Today" refreshes only on interaction.** If the app stays open past midnight, reminders still use the old date until the next click or edit causes a re-render (D11). A timer set for local midnight would fix this.
- **English JDs only.** The interface is available in English and Chinese (D10), but the dictionary, headings and ambiguity rules only understand English job descriptions and resume text.
