# Interview Notes

Answers to the questions this project is most likely to raise, in the words I would use. Each answer points to the code and to the decision record (`docs/DECISIONS.md`, "D" numbers) so it can be checked. A short 中文要点 follows each one.

## 30-second pitch

"JobFit is a browser-only internship tracker. You paste a job description, and it shows how well your resume matches, line by line: which skills the JD asks for, how much each one counts, and where in your resume each point comes from. It also gives suggestions that never tell you to claim experience you don't have. There's a board for tracking applications with follow-up reminders, an English and Chinese interface, and JSON backup with strict validation. It's React and TypeScript, but all the logic is in plain TypeScript classes with no React, which is why that part has 100% test coverage. CI runs everything in two time zones, because the date bugs only show up when local time and UTC disagree."

## How the score works

**The formula** (`src/core/ScoreCalculator.ts`, numbers in `src/core/importance.ts`):

```
score = round(100 × Σ(weight × credit) / Σ weight)
weight: Required 3 · Unspecified 2 · Preferred 1 · Context 1
credit: in skills list 1 · only in a bullet 0.5 · missing 0
```

**Worked example** (the test "follows the documented worked example" in `tests/core/ScoreCalculator.test.ts`): Java required and listed, 3 × 1 = 3. SQL required, only in a bullet, 3 × 0.5 = 1.5. Docker preferred and missing, 1 × 0 = 0. Score = round(100 × 4.5 / 7) = **64**.

## Questions & answers

### Q: Why those weights: Required 3, Unspecified 2, Preferred 1, Context 1?

"Each JD line is labeled by the heading it's under. Required is the strongest signal, so it counts three times as much as Preferred. If a JD has no requirement headings at all, I can't tell required from preferred, so everything gets 2, the midpoint. 'Context' is skills mentioned outside the requirement sections, like the company intro or 'What you'll do'. That's a real but weak signal: 'we build with Kafka' doesn't mean you must know Kafka. So it gets 1 instead of being ignored, and it still shows up in the breakdown."

"The exact numbers are a judgment call, not fitted to data. What matters more is that they're in one file, every point in the breakdown is traceable to a JD line, and changing them is a one-line change with tests."

**Follow-up: Preferred and Context are both 1. Why have two labels?** "They differ when the same skill appears twice. `JdParser` keeps the most important label, using a separate `IMPORTANCE_RANK` where Preferred ranks above Context. An explicit 'preferred' is a stronger statement than a passing mention, even if they're weighted the same."

中文要点：权重按段落标题定；没有任何要求标题时统一取中间值 2；context 是弱信号，给 1 而不是忽略。数字是判断而非拟合，但集中在 `importance.ts`，改一行即可。Preferred 和 Context 同权重，但去重时用 `IMPORTANCE_RANK` 区分。(D4)

### Q: Why does a skill that only appears in a bullet get half credit? Isn't a bullet stronger evidence than a skills list?

"That's a fair challenge, and I went back and forth on it. You're right that a bullet is stronger *evidence*: it shows I actually used the skill, while the skills list is just a claim. But the score isn't measuring how good the candidate is. It measures how easy the match is to *see*. Recruiters and keyword filters often scan the skills section first, so a skill buried in a bullet is easy to miss. Half credit captures that, and the tool pairs it with a concrete fix: 'this already appears in your bullet, add it to your skills list.' The breakdown still shows the bullet as evidence, so nothing is hidden. And it's a single constant, so if I had data showing recruiters weigh bullets more, it's a one-line change plus a test update."

**If pushed further.** "If the goal were ranking candidates rather than coaching one, I'd flip it. Bullet evidence would count at least as much as a listed skill, and maybe listed-plus-bullet would score highest. The right weight depends on what question the score answers."

中文要点：分数衡量的是"匹配是否容易被看到"，不是"候选人能力强不强"。承认 bullet 是更可信的证据；明细里照样展示这条 bullet；0.5 只是一个常量，改起来成本很低。(D5)

### Q: What happens when the JD contains no skills you recognize? Why not just show 0?

"The score is `null`, and the UI says no known skills were found instead of showing a number. With no recognized skills the denominator is zero. 0 would say 'you match nothing', and 100 would say 'you match everything'. Both would be made up. `ScoreCalculator.toPercent` returns `null` when the maximum is 0, and the type is `number | null`, so every caller is forced by the compiler to handle the 'no score' case. It's the same idea as returning `Optional` in Java instead of a magic value."

中文要点：分母为 0 时，0 和 100 都是编造的结论；返回 `null`，类型是 `number | null`，编译器强制调用方处理"没有分数"的情况，类似 Java 的 `Optional`。

### Q: How do the gap suggestions avoid encouraging people to lie on their resume?

"There are three kinds of suggestion (`GapAdvisor`). If the skill is in a bullet but not the skills list: add it to the list. That's safe, the evidence is already there. If it's completely missing: it's labeled as something to learn. The risky one is in between. Docker is missing, but a bullet says 'deployed the service', and 'deploy' is a related keyword for Docker. That only means the bullet *might* be related. So the message is always conditional: 'If you actually used Docker in this work, mention it in this bullet. If you did not use it, leave the bullet as it is.'"

"I don't rely on remembering this. Core returns structured data, not sentences, and the sentences live in the English and Chinese dictionaries. `tests/ui/i18n.test.ts` checks **every** language: the message must contain the conditional phrase and must not match a list of directive phrasings like 'Add Docker to this bullet'. A new language can't ship without passing it."

中文要点：三种建议，危险的是"相关关键词"那种，只代表"可能相关"，所以措辞必须是条件式（"如果你确实用过……如果没有用过，保持不变"）。core 只返回数据，文案在中英文字典里；测试对每种语言都检查条件式短语、禁止命令式措辞。(D6, D10)

### Q: How do you decide what "today" is? Why did you write tests for time zones?

"Follow-up dates are calendar dates like 2026-11-23, not instants. The easy way to get today, `new Date().toISOString().slice(0, 10)`, is a bug: `toISOString` is UTC. At 4:30 pm in Seattle it's already tomorrow in UTC, so a follow-up due today would show as one day late, but only in the afternoon and evening, so you'd never see it in a morning test run."

"So `CalendarDate.today(now)` builds the string from the **local** year, month and day. And nothing in core reads the clock: `now` is always a parameter, and `App` gets it from an injected `clock` function. That makes tests deterministic. `CalendarDate.test.ts` sets the process time zone to Seattle at 00:30 UTC and to Shanghai at 23:00 UTC and checks both. For arithmetic like 'applied + 7 days', dates are treated as midnight UTC, which has no daylight saving, so a day is always 24 hours."

"CI runs the whole suite twice, with `TZ=UTC` and `TZ=America/Los_Angeles`. That actually caught something before CI existed: in the stage 3 review, a board test passed in Los Angeles and failed in UTC, because its sample data was built in the `describe` body, which runs before the `beforeAll` that sets the time zone. The fix was to build the data inside each test."

中文要点：`toISOString` 是 UTC，西雅图下午 4 点以后就是"明天"。`CalendarDate.today(now)` 用本地年月日；`now` 由外部注入（App 的 `clock`），测试可以指定任意时刻和时区；日期加减用 UTC 午夜，不受夏令时影响。CI 在 UTC 和洛杉矶各跑一遍；阶段 3 审查时就抓到过一个只在 UTC 下失败的测试。(D11, D15)

### Q: Tell me about a bug you found and fixed.

"A read-modify-write race in storage. `saveApplication` used to do `await this.listApplications()`, then filter the list and write it back. The `await` gives up control between the read and the write. If several saves start together, they all read the same old list, and each write erases the changes before it; only the last one survives."

"It never lost data in practice, because the only place that saved many at once, loading the 7 sample applications, awaited each save in turn. But that was the caller working around the repository, and a comment even said so. Any future caller that didn't know would hit it. In review I moved the fix to where the problem is: read, change and write in one synchronous block, with no `await` in between (`LocalStorageRepository.saveApplication` and `deleteApplication`, using a private synchronous `readApplications`). JavaScript runs one synchronous block at a time, so no other save can run in the middle. Now the sample loader just starts all 7 saves."

"The methods stay `async`: the interface is Promise-based for a future backend, and a storage-full error still comes back as a rejected Promise. There's a contract test that starts several saves and a delete with `Promise.all` and checks that every change survives, run against both the localStorage and in-memory repositories."

"What it doesn't fix: two browser tabs each keep their own copy in memory and overwrite each other. That's listed as a known limitation; the fix would be listening to the `storage` event or moving to a backend."

中文要点：`saveApplication` 原来在"读"和"写"之间有一个 `await`，同时发起的多次保存会读到同一份旧列表，后写覆盖先写。当时唯一的批量调用（加载 7 条示例）是逐个 await 的，所以没有真的丢过数据，但这是调用方在替存储层兜底。修复放在存储层：读-改-写放进同一段同步代码；方法仍是 `async`。新增 `Promise.all` 契约测试，两种实现都跑。多标签页互相覆盖仍是已知局限。

### Q: How do you validate an imported file? What about prototype pollution?

"An import file is untrusted. It could be from an old version, edited by hand, or deliberately malformed. `ExportCodec.decode` checks the whole file before anything is saved: size (5 MB), valid JSON, `schemaVersion` 1, then every field's type, the status against a fixed list, real calendar dates (`2026-02-30` is rejected), scores as whole numbers 0 to 100, text lengths and list sizes, and unique ids. One `FieldChecker` collects every problem with its path, like `applications[2].status`, so the user sees all of them at once. It's all-or-nothing: if there's any problem, nothing is imported; if it's valid, the user still confirms before it replaces their data."

"On `__proto__`: `JSON.parse` itself doesn't pollute anything. A `"__proto__"` key in JSON becomes an ordinary own property of the parsed object; it doesn't change that object's prototype or `Object.prototype`. The real risk is what you do with that object afterwards. If you merge it into another object with `Object.assign`, or with a hand-written deep merge that does `target[key] = …`, the `__proto__` key goes through the prototype setter: `Object.assign` replaces the target's prototype, and a deep merge can end up writing into `Object.prototype` itself, which affects every object in the app. Merging with the spread operator, `{ ...defaults, ...untrusted }`, doesn't change a prototype, but it copies every unknown key into your data and lets the file overwrite any field, including ones you never validated."

"So the validators never merge or spread the parsed object. They read a fixed list of fields one by one (`o.id`, `o.company`, `o.status`, …), check each, and build a **new** object literal from only those values (`ApplicationValidator.check`, `ResumeValidator.check`). Any key that isn't on the list, `__proto__`, `constructor` or anything else, is simply never read, so it is dropped. `tests/core/ExportCodec.test.ts` has a hand-written file with `"__proto__"` keys at the top level and inside an application; it imports successfully, the extra key is gone, the application's prototype is the normal `Object.prototype`, and `({}).polluted` is still undefined."

"Why not a schema library like zod? It would do the same thing, but it's another dependency and another DSL. The checker is about 145 readable lines, and the same per-field rules also read the app's own localStorage, with size limits off and broken records skipped instead of failing everything."

中文要点：
- 导入文件不可信：先检查大小、JSON、版本，再逐字段检查类型、状态、真实日期、分数范围、长度、id 唯一；收集所有问题和路径；全有或全无，合法也要用户确认后才覆盖。(D13)
- `JSON.parse` 本身不会污染原型：JSON 里的 `"__proto__"` 只是解析结果上一个普通的自有属性。
- 真正的风险在之后把不可信对象合并进别的对象：`Object.assign` 或手写的深合并会触发 `__proto__` setter（前者改掉目标对象的原型，后者可能写进 `Object.prototype`）；展开运算符不改原型，但会把未知键和未校验的字段一起带进来。
- 我们的做法：不合并、不展开解析结果，按字段白名单逐个读取、校验，再用对象字面量重建新对象；`__proto__`、`constructor` 等未知键根本不会被读，自然被丢掉。测试覆盖了 `__proto__` 的情况。

### Q: Why is there no React in `src/core`?

"Three reasons. First, testing: core is plain classes, so it's tested with fast unit tests with no browser, and it has 100% line, branch and function coverage. Second, separation: the scoring formula changes for product reasons and components change for layout reasons, so they shouldn't live in the same file. Third, reuse: the same `MatchService` could run in a Node backend or a CLI unchanged. Core also returns data instead of sentences, so the same report can be shown in any language. The storage layer is an interface, `Repository`, and `main.tsx` is the only file that picks `LocalStorageRepository`, so swapping in a backend is a one-line change there."

中文要点：可测（纯单元测试，100% 覆盖）、职责分离、可复用；core 只返回数据；存储是接口，换后端只改 `main.tsx` 一行。(D8, ARCHITECTURE.md)

### Q: Anything unusual about the tooling?

"The project compiles with TypeScript 7, the native compiler. typescript-eslint still needs TypeScript's JavaScript API, which version 7 doesn't ship. Instead of downgrading the whole project, linting alone uses TypeScript 6: a small module resolve hook in `eslint.config.js` redirects `typescript` imports to `@typescript/typescript6`, but only for typescript-eslint's own packages. It's documented as a temporary workaround in D15, with what to delete once typescript-eslint supports version 7."

中文要点：项目用 TS 7 编译，typescript-eslint 需要 TS 6 的 JS API；只对 typescript-eslint 自己的包把 `typescript` 重定向到 `@typescript/typescript6`，其他工具不受影响。是临时方案，D15 写明了以后要删哪些东西。

## Resume bullets (draft)

- Built **JobFit**, a browser-only internship tracker in React and TypeScript that scores resume–job matches with an explainable, rule-based algorithm (section-weighted skills, evidence traced to each JD line) and gives conditional, honesty-preserving suggestions.
- Kept all business logic in framework-free TypeScript classes with **326 unit tests** and 100% line/branch coverage of the core; CI runs lint, type-check, tests and build in two time zones to catch local-date bugs.
- Designed strict all-or-nothing JSON import validation (field allow-list, path-level error messages, size limits) and fixed a read-modify-write race in `localStorage` persistence.
