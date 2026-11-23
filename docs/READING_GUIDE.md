# 代码阅读指南

分三轮读：

- **第 1 轮**：鸟瞰，大约 1 小时。目标是知道每一层做什么、数据怎么流动，先不看细节。
- **第 2 轮**：精读 `src/core`。业务逻辑全在这一层，也是面试最常被追问的部分。
- **第 3 轮**：存储层、React 界面和工程化配置。

每一步都先读源码，再读 `tests/` 里同名的测试：测试就是这段代码的"使用说明书"。每一步最后的 **读懂的标志** 是给自己的检查题，答得上来再往下走。

本地跑起来：

```
npm ci
npm run dev      # 打开 http://localhost:5173
npm test         # 跑全部单元测试（326 个）
npm run lint     # ESLint，要求 0 error、0 warning
```

---

## 第 1 轮：鸟瞰

### 1.1 项目是什么、分几层
- `README.md`，然后 `docs/ARCHITECTURE.md`

**读懂的标志：** 能画出 core / storage / ui 三层和 `main.tsx`，并说出依赖方向：谁可以 import 谁，谁不可以。能说出应用的数据存在哪两个 localStorage key 里。

### 1.2 数据长什么样
- `src/core/types.ts`（先看 `Resume`、`ExtractedSkill`、`SkillScore`、`MatchReport`、`GapSuggestion`、`Application`）
- `src/core/importance.ts`

**读懂的标志：** 能说出 `Importance` 的 4 个取值分别在什么情况下出现，以及 `listed` / `bulletOnly` / `missing` 各值多少分。

### 1.3 三个入口
- `src/main.tsx`：唯一决定"用哪个实现"的地方
- `src/core/MatchService.ts`：UI 调用匹配逻辑的唯一入口
- `src/storage/Repository.ts`：UI 调用存储的唯一入口

**读懂的标志：** 能说出"以后换成后端"需要改哪一行，为什么 UI 代码一行都不用动；能按顺序说出 `MatchService.analyze` 调用的 4 个类。

### 1.4 App 的骨架（只扫一遍）
- `src/ui/App.tsx`：只看 7 个 `useState`、启动时的 `useEffect`、`today` 怎么算出来，以及传给三个页面的 props。

**读懂的标志：** 能说出 App 的 7 个 `useState` 各自存什么；能说出 `today` 由哪个函数算出来，`clock` 是从哪里来的。

---

## 第 2 轮：精读 core（纯 TypeScript，不依赖 React）

### 2.1 技能词典
- `src/core/SkillDictionary.ts`、`src/core/data/skills.json`
- 测试：`tests/core/SkillDictionary.test.ts`、`tests/core/skillsData.test.ts`

**读懂的标志：** 能解释为什么 `aliasPatterns()` 要按长度降序排序；为什么 "Go" 放在 `caseSensitiveAliases`，而 "golang" 放在 `aliases`；两个技能共用一个别名时为什么要在启动时直接报错。

### 2.2 在文本里找技能
- `src/core/WordBoundary.ts`，然后 `src/core/AmbiguityRules.ts`，然后 `src/core/TextMatcher.ts`
- 测试：同名的三个测试文件

**读懂的标志：** 能手动推演 `"Proficient in C++ and C#"` 为什么只得到 cpp 和 csharp，不会多出一个 c（提示：claimed 数组）；能说出 "R&D"、"D.C."、"Go above and beyond" 分别是被哪条规则排除的；能解释 related 关键词为什么 4 个字母以上才按前缀匹配（D9）。

### 2.3 把 JD 切段并抽取技能
- `src/core/JdSectionSplitter.ts`，然后 `src/core/JdParser.ts`
- 测试：`tests/core/JdSectionSplitter.test.ts`、`tests/core/JdParser.test.ts`

**读懂的标志：** 能解释 "Experience with React preferred" 为什么不会被当成标题；为什么 intro 文本只有在整篇 JD 有要求标题时才算 `context`；同一技能同时出现在 Required 和 Preferred 段时最后算哪个（`IMPORTANCE_RANK`）。

### 2.4 打分和建议
- `src/core/ResumeIndex.ts`，然后 `src/core/ScoreCalculator.ts`，然后 `src/core/GapAdvisor.ts`，最后回头再看一遍 `src/core/MatchService.ts`
- 测试：重点看 `ScoreCalculator.test.ts` 里 "follows the documented worked example"（算出 64 分）和 "returns a null score…"，以及 `MatchService.test.ts`、`GapAdvisor.test.ts`

**读懂的标志：**
- 不看代码也能用一段话讲出打分公式，并手算出 64 分那个例子。
- 能解释 `toPercent` 为什么在分母为 0 时返回 `null`，而不是 0 或 100。
- 能解释 `GapAdvisor` 的三种建议各在什么条件下出现，以及为什么 `canHighlightInBullet` 的措辞必须是条件式（D6）。
- 能解释为什么 `GapAdvisor.test.ts` 只断言结构（kind、id、keyword），不断言文案（D10）。

### 2.5 日期："今天"是哪一天
- `src/core/CalendarDate.ts`
- 测试：`tests/core/CalendarDate.test.ts`、`tests/timeZone.ts`（用 `vi.stubEnv('TZ', …)` 切换时区的小工具）

**读懂的标志：**
- 能解释为什么 `new Date().toISOString().slice(0, 10)` 在西雅图下午 4 点以后会得到"明天"，而 `CalendarDate.today` 不会。
- 能说出 `now` 为什么由外部传入：App 里是 `clock`，测试里是固定的时刻。
- 能解释为什么 `addDays` 用 UTC 做加减，就不会受夏令时影响。

### 2.6 投递记录的规则
- `src/core/ApplicationRules.ts`，然后 `src/core/ReminderPolicy.ts`
- 测试：`ApplicationRules.test.ts`、`ReminderPolicy.test.ts`、`tests/core/applicationFixtures.ts`

**读懂的标志：**
- 能说出哪三种状态会提醒，以及"逾期 / 今天 / 3 天内"分别显示在哪里（对照 DECISIONS D12 的两张表）。
- 能解释"状态从 Saved 改成 Applied 时自动填日期，但绝不覆盖用户已填的日期"是哪几行代码实现的（`fillStatusDefaults`）。
- 能说出 `APPLICATION_STATUSES` 为什么是一个运行时数组，而不只是一个 type。

### 2.7 不可信输入的校验
- `src/core/limits.ts`，然后 `src/core/FieldChecker.ts`
- `src/core/ResumeValidator.ts`、`src/core/ApplicationValidator.ts`
- `src/core/ExportCodec.ts`
- 测试：`ExportCodec.test.ts`（特别是 `"__proto__"` 和深层嵌套两条）、`ApplicationValidator.test.ts`、`ResumeValidator.test.ts`

**读懂的标志：**
- 能解释 `FieldChecker` 为什么用返回 `undefined` 表示"无效"，以及为什么要先检查完所有字段、再决定结果，而不是遇到第一个错误就返回。
- 能说出 `enforceLimits` 为 true（导入文件）和 false（自己存的 localStorage）时行为的两点区别。
- 能说出 `allValid` 这个 type guard 解决了什么问题：没有它，代码里会多出几处 `as` 强转。
- 能解释为什么一个文件里只要有一条投递不合法，就整体拒绝。
- 能讲清 `__proto__` 那题：`JSON.parse` 本身不会污染原型；风险在于之后用 `Object.assign`、深合并或展开运算符合并不可信对象；`ApplicationValidator.check` 按字段白名单逐个读取、重建新对象，所以未知键根本不会被读到（见 `docs/INTERVIEW_NOTES.md`）。

### 2.8 第 2 轮的设计取舍
- `docs/DECISIONS.md` 的 D1–D13

**读懂的标志：** 面试官说"bullet 证据明明更可信"时，你能给出 D5 的回答；能说出每一条决定"放弃了什么、代价是什么"。

---

## 第 3 轮：存储层、React 界面、工程化

先读一个 React 速成对照（Java 视角）：

| React 概念 | 大致等价于 Java 里的 |
|---|---|
| 组件（返回 JSX 的函数） | 一个只负责"画自己"的类，React 决定什么时候调用它 |
| props | 构造函数参数，只读 |
| `useState` | 组件的私有字段；只有调用 setter 才会触发重绘 |
| `useEffect` | 组件画完之后执行的回调，比如启动时加载数据 |
| 回调 prop（如 `onSave`） | 传进去的 listener 接口 |
| 列表里的 `key` | 列表项的主键，React 用它判断"哪一项是哪一项" |
| 受控输入 | 输入框的值永远来自 state，每次按键都写回 state |
| Context + `useContext` | 一个全局可查的"作用域 bean"，组件按需取，不用层层传参 |

### 3.1 存储层
- `src/storage/Repository.ts`，然后 `src/storage/LocalStorageRepository.ts`，然后 `src/storage/InMemoryRepository.ts`
- 测试：`tests/storage/LocalStorageRepository.test.ts`。注意 `describe.each`：两种实现跑的是同一组"契约测试"。

**读懂的标志：**
- 能解释为什么 localStorage 是同步的，但接口方法却返回 `Promise`；为什么方法保留 `async`，即使里面没有 `await`（D15 里 `require-await` 那一行）。
- localStorage 里存的是坏 JSON 时，应用会怎样表现，是哪一行代码保证它不会崩；为什么不能直接 `JSON.parse(text) as Resume`。
- 能解释 `replaceAll` 为什么先写 applications、后写 resume。
- 能解释 `saveApplication` 为什么必须在"读、改、写"三步之间不出现 `await`：假设读完以后插入一个 `await`，同时发出的 7 次保存会怎样互相覆盖？对照测试 "keeps every change when several saves and deletes are started at the same time"。

### 3.2 App：状态放在哪
- `src/ui/App.tsx`（这次细读）、`src/ui/shared/TabBar.tsx`、`src/ui/shared/EmptyState.tsx`

**读懂的标志：**
- 能解释 `useEffect` 里 `cancelled` 标志的作用。
- 能说出点击 "Try with sample data" 之后，从 `loadSampleData` 到页面出分，经过了哪些 state 变化。
- 能解释 `persistApplication` 里 `setApplications((current) => …)` 这种"传函数给 setter"的写法，和直接传新值有什么不同。
- 能解释为什么错误存成 `ErrorKind`（一个 key），而不是一句话。

### 3.3 匹配页（首页）
- `src/ui/match/MatchPage.tsx`，然后 `MatchResultView.tsx`，然后 `ScoreSummary.tsx`、`SkillBreakdownTable.tsx`、`HighlightedText.tsx`、`GapList.tsx`、`UnrecognizedSkills.tsx`、`SaveApplicationForm.tsx`
- `src/ui/format.ts`、`src/ui/sampleData.ts`
- 测试：`tests/ui/sampleData.test.ts`

**读懂的标志：**
- 能说出 4 种"没有结果"的情况（没点过 Analyze、简历为空、JD 里没有可识别技能、JD 改过但没重新分析），以及每种在代码里由哪个 `if` 处理。
- 能解释为什么 report 是在渲染时现算的，而不是存在 state 里。
- 能解释 `HighlightedText` 怎样用 `highlights` 区间把文本切成普通段和高亮段，以及为什么区间之间不会重叠。
- 能解释为什么保存为投递时用的是 `analyzedJd`，而不是输入框里当前的 `jdText`。

### 3.4 简历编辑页
- `src/ui/resumeDraft.ts`，然后 `src/ui/resume/ResumeEditor.tsx`，然后 `SkillListEditor.tsx`、`ExperienceEditor.tsx`
- 测试：`tests/ui/resumeDraft.test.ts`

**读懂的标志：**
- 能解释"草稿（draft）"和"已保存的 resume"为什么是两份数据。
- 能解释 `hasUnsavedChanges` 为什么不需要单独的 state。
- 能解释 `ExperienceEditor` 的 `key` 为什么用 id 而不是数组下标：删掉中间一条经历时会出什么问题？
- 能说出 bullet 的 id 是怎么生成的。

### 3.5 中英文界面（i18n）
先想清楚一个原则：**core 只返回数据，句子由 UI 生成**（D10）。

- `src/ui/i18n/en.ts`，然后 `zh.ts`
- `src/ui/i18n/language.ts`（纯函数，不依赖 React），然后 `LanguageContext.tsx`（`LanguageProvider`、`useT()`、`useLanguage()`）、`LanguageSelector.tsx`
- `src/ui/i18n/gapMessage.ts`、`src/ui/match/GapList.tsx`
- 测试：`tests/ui/i18n.test.ts`

**读懂的标志：**
- 能解释 `export type Messages = typeof en` 和 `const zh: Messages` 两行，怎样做到"zh 少一个 key 就编译失败"。可以自己删掉 zh 里一行，跑 `npm run typecheck` 看报错。
- 能说出为什么 `formula`、`canHighlightInBullet` 这类带参数的文案是函数，而不是 `"{skill}"` 占位符字符串；为什么 `importIssue` 里的函数参数以 `_` 开头。
- 能说出首次访问时语言是怎么决定的，以及为什么只有用户主动选择才写入 localStorage（D14）。
- 能解释 `gapMessage` 里的 `switch` 为什么不需要 `default`：新增一种 kind 却忘了处理，会在哪里被发现？
- 能说出测试用哪两种方式保证中英文都不会诱导用户补写没做过的经历。

### 3.6 投递看板和导入导出
- `src/ui/board/BoardPage.tsx`，然后 `StatusColumn.tsx`、`ApplicationCard.tsx`、`ReminderBanner.tsx`、`ApplicationForm.tsx`
- `src/ui/board/DataTransferPanel.tsx`、`src/ui/fileDownload.ts`、`src/ui/sampleApplications.ts`
- 测试：`tests/ui/board.test.ts`

**读懂的标志：**
- 能解释 BoardPage 里 `<ApplicationForm key={…}>` 的作用：从编辑 A 切到编辑 B 时，为什么要让 React 重建这个表单？
- 能说出 `formMode` 这个 state 为什么放在 BoardPage，而不是放在 App。
- 能按顺序说出导入的流程：选文件 → 检查大小 → 读取 → `decode` → 列出问题，或者弹窗确认 → `replaceAll` → 显示结果。
- 能解释 `onChange={(event) => void handleFile(event)}` 里的 `void` 是什么意思，为什么 lint 要求写它（`no-misused-promises`）。

### 3.7 工程化：lint、CI、部署配置、截图
- `eslint.config.js`：先读开头那段 resolve hook 的注释，再看规则配置
- `.github/workflows/ci.yml`
- `vercel.json`
- `scripts/screenshot.mjs`
- `docs/DECISIONS.md` 的 D14–D16 和 Known limitations

**读懂的标志：**
- 能解释为什么 lint 用 TypeScript 6 而 typecheck 用 TypeScript 7，以及 typescript-eslint 支持 7 以后要删掉哪三样东西。
- 能逐条说出 D15 表格里每条规则调整的理由，以及为了过 lint 改动过的 4 处代码为什么都不改变行为。
- 能解释 CI 为什么用 UTC 和 America/Los_Angeles 两个时区，`fail-fast: false` 起什么作用，`echo TZ` 和 `date` 是为了在日志里确认什么。
- 能解释 `vercel.json` 里的 rewrite 为什么不会把 `/assets/*.js` 也改写成 `index.html`。
- 能说出截图脚本为什么用一个临时的浏览器 profile。
