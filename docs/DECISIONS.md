# Design Decisions

Each entry says what was chosen, what was rejected, and what the choice costs.
More entries (storage, UI, CI) are added in later stages.

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

Skills with no related bullet are labeled "truly missing" and framed as something to learn.

**Why.** A resume tool that nudges people to add skills they don't have causes real harm. Candidates get caught in interviews, and trust in the tool is lost. The related-keyword match is only a hint that the skill *might* have been involved, so the wording must leave the decision to the user. A test (`GapAdvisor.test.ts`) locks in this wording.

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

## Known limitations

- **"A plus" demotes the whole line.** Any line containing "a plus", "nice to have", "preferred" or "bonus" is labeled Preferred as a whole. So "Java required; Kotlin a plus" demotes Java to Preferred as well. Splitting a line into clauses would fix this, at the cost of a more complex parser.
- **Headings that name a skill are read as content** (see D4). For example, "Python Developer Requirements" does not start a Required section.
- **No negation or experience levels.** "No Java needed" still counts Java. "3+ years of Python" counts the same as "some Python".
- **Dictionary only.** Skills not in `skills.json` are invisible in the JD. In the resume they are listed as unrecognized (D7).
- **Ambiguity rules are a known-pattern list** (D2). A false positive that no rule covers, such as "Let's Go!" mid-sentence, still matches.
- **English JDs only.**
