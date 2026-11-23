# 代码阅读指南

建议按下面的顺序读。每一步都先读源码，再读 `tests/` 里同名的测试：测试就是这段代码的"使用说明书"。
每一步最后的 **读懂的标志** 是给自己的检查题，答得上来再往下走。

本地跑起来：

```
npm install
npm run dev      # 打开 http://localhost:5173
npm test         # 跑全部单元测试
```

---

## 阶段 1：core（纯 TypeScript，不依赖 React）

### 1.1 数据长什么样
- `src/core/types.ts`
- `src/core/importance.ts`

**读懂的标志：** 能说出 `Importance` 的 4 个取值分别在什么情况下出现，以及 `listed` / `bulletOnly` / `missing` 各值多少分。

### 1.2 技能词典
- `src/core/SkillDictionary.ts`、`src/core/data/skills.json`
- 测试：`tests/core/SkillDictionary.test.ts`、`tests/core/skillsData.test.ts`

**读懂的标志：** 能解释为什么 `aliasPatterns()` 要按长度降序排序；为什么 "Go" 放在 `caseSensitiveAliases`，而 "golang" 放在 `aliases`；两个技能共用一个别名时为什么要在启动时直接报错。

### 1.3 在文本里找技能
- `src/core/WordBoundary.ts`，然后 `src/core/AmbiguityRules.ts`，然后 `src/core/TextMatcher.ts`
- 测试：同名的三个测试文件

**读懂的标志：** 能手动推演 `"Proficient in C++ and C#"` 为什么只得到 cpp 和 csharp，不会多出一个 c（提示：claimed 数组）；能说出 "R&D"、"D.C."、"Go above and beyond" 分别是被哪条规则排除的。

### 1.4 把 JD 切段并抽取技能
- `src/core/JdSectionSplitter.ts`，然后 `src/core/JdParser.ts`
- 测试：`tests/core/JdSectionSplitter.test.ts`、`tests/core/JdParser.test.ts`

**读懂的标志：** 能解释 "Experience with React preferred" 为什么不会被当成标题；为什么 intro 文本只有在整篇 JD 有要求标题时才算 `context`；同一技能同时出现在 Required 和 Preferred 段时最后算哪个。

### 1.5 打分和建议
- `src/core/ResumeIndex.ts`，然后 `src/core/ScoreCalculator.ts`，然后 `src/core/GapAdvisor.ts`，最后 `src/core/MatchService.ts`
- 测试：重点看 `ScoreCalculator.test.ts` 里算出 64 分的那个例子，以及 `MatchService.test.ts`

**读懂的标志：** 不看代码也能用一段话讲出打分公式；能解释 `GapAdvisor` 的三种建议各在什么条件下出现，以及为什么 `canHighlightInBullet` 的措辞必须是条件式；能说出 `MatchService` 为什么是唯一被 UI 调用的入口。

### 1.6 设计取舍
- `docs/DECISIONS.md`（D1–D9 和 Known limitations）

**读懂的标志：** 面试官说"bullet 证据明明更可信"时，你能给出 D5 的回答。

---

## 阶段 2：存储层 + React 界面

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

### 2.1 存储接口
- `src/storage/Repository.ts`，然后 `src/storage/LocalStorageRepository.ts`，然后 `src/storage/InMemoryRepository.ts`
- `src/core/ResumeValidator.ts`
- 测试：`tests/storage/LocalStorageRepository.test.ts`、`tests/core/ResumeValidator.test.ts`

**读懂的标志：** 能解释为什么 localStorage 是同步的，但接口方法却返回 `Promise`；localStorage 里存的是坏 JSON 时，应用会怎样表现，是哪一行代码保证它不会崩；为什么不能直接 `JSON.parse(text) as Resume`。

### 2.2 入口和依赖注入
- `src/main.tsx`

**读懂的标志：** 能说出"以后换成后端"需要改哪一行，为什么 UI 代码一行都不用动。

### 2.3 App：状态放在哪
- `src/ui/App.tsx`、`src/ui/shared/TabBar.tsx`

**读懂的标志：** 能列出 App 的 6 个 `useState`，各自存什么；能解释 `useEffect` 里 `cancelled` 标志的作用；能说出点击 "Try with sample data" 之后，从 `loadSampleData` 到页面出分，经过了哪些 state 变化。

### 2.4 匹配页（首页）
- `src/ui/match/MatchPage.tsx`，然后 `MatchResultView.tsx`，然后 `ScoreSummary.tsx`、`SkillBreakdownTable.tsx`、`HighlightedText.tsx`、`GapList.tsx`、`UnrecognizedSkills.tsx`
- `src/ui/format.ts`、`src/ui/sampleData.ts`（页面上的文字都来自 `useT()`，见"阶段 2.5"一节）
- 测试：`tests/ui/sampleData.test.ts`
- 注意 `SkillBreakdownTable` 里 `evidenceBullets` 只放 bullet 文本；"在 Skills list 中"由 `status` 表示，不再是一个字符串。

**读懂的标志：**
- 能说出 4 种"没有结果"的情况（没点过 Analyze、简历为空、JD 里没有可识别技能、JD 改过但没重新分析），以及每种在代码里由哪个 `if` 处理。
- 能解释为什么 report 是在渲染时现算的，而不是存在 state 里。
- 能解释 `HighlightedText` 怎样用 `highlights` 区间把文本切成普通段和高亮段，以及为什么区间之间不会重叠。

### 2.5 简历编辑页
- `src/ui/resumeDraft.ts`，然后 `src/ui/resume/ResumeEditor.tsx`，然后 `SkillListEditor.tsx`、`ExperienceEditor.tsx`
- 测试：`tests/ui/resumeDraft.test.ts`

**读懂的标志：**
- 能解释"草稿（draft）"和"已保存的 resume"为什么是两份数据。
- 能解释 `hasUnsavedChanges` 为什么不需要单独的 state。
- 能解释 `ExperienceEditor` 的 `key` 为什么用 id 而不是数组下标：删掉中间一条经历时会出什么问题？
- 能说出 bullet 的 id 是怎么生成的。

### 2.6 样式
- `src/ui/styles.css`：扫一眼即可，只需要知道 `.badge-listed` / `.badge-bulletOnly` / `.badge-missing` 这类颜色和状态的对应关系。

---

## 阶段 2.5：中英文界面切换（i18n）

先想清楚一个原则：**core 只返回数据，句子由 UI 生成。** 例如 `GapAdvisor` 返回 `{ kind: 'canHighlightInBullet', skillName: 'Docker', relatedKeyword: 'deploy', ... }`，"If you actually used Docker…" 和 "如果你确实用过 Docker…" 这两句话都由 UI 字典生成。理由见 `docs/DECISIONS.md` D10。

### 2.7.1 core 的输出形状
- `src/core/types.ts` 中的 `GapSuggestion`（三种 gap 组成的 tagged union）
- `src/core/GapAdvisor.ts`
- 测试：`tests/core/GapAdvisor.test.ts`。注意它只断言结构，不断言文案。

**读懂的标志：** 能解释为什么 `relatedKeyword` 只存在于 `canHighlightInBullet` 这一种；在 `if (gap.kind === 'trulyMissing')` 分支里访问 `gap.bulletText`，TypeScript 会怎样报错（可以对照 Java 的 sealed interface 来理解）。

### 2.7.2 两份字典
- `src/ui/i18n/en.ts`，然后 `src/ui/i18n/zh.ts`

**读懂的标志：**
- 能解释 `export type Messages = typeof en` 和 `const zh: Messages` 两行，怎样做到"zh 少一个 key 就编译失败"。可以自己删掉 zh 里一行，跑 `npm run typecheck` 看报错。
- 能说出为什么 `formula`、`canHighlightInBullet` 这类带参数的文案是函数，而不是 `"{skill}"` 占位符字符串。

### 2.7.3 语言怎么选、怎么记住、怎么传下去
- `src/ui/i18n/language.ts`（纯函数，不依赖 React）
- `src/ui/i18n/LanguageContext.tsx`（`LanguageProvider`、`useT()`、`useLanguage()`）
- `src/ui/i18n/LanguageSelector.tsx`、`src/main.tsx`（Provider 包在最外层）

**读懂的标志：**
- 能说出首次访问时语言是怎么决定的：先看 localStorage，再看 `navigator.language` 是否以 zh 开头。
- 能解释 Context 解决了什么问题：如果没有它，`t` 要通过 props 一层层往下传多少层？
- 能解释为什么 localStorage 读写失败时，语言选择只是"不被记住"，而不会让应用崩溃。

### 2.7.4 句子在哪里生成，以及诚实措辞的测试
- `src/ui/i18n/gapMessage.ts`、`src/ui/match/GapList.tsx`
- 测试：`tests/ui/i18n.test.ts`

**读懂的标志：**
- 能解释 `gapMessage` 里的 `switch` 为什么不需要 `default`：新增一种 kind 却忘了处理，会在哪里被发现？
- 能说出测试用哪两种方式保证中英文都不会诱导用户补写没做过的经历：一是必须包含条件式短语，二是禁止出现一组命令式措辞。

### 2.7.5 以后写新组件
阶段 3、4 的所有新组件都用 `const t = useT();` 取文案。新增文案时先加到 `en.ts`，编译器会提示 `zh.ts` 缺了什么。

另外，语言只在用户主动切换时写入 localStorage（D14）。`resolveInitialLanguage` 只读不写，`saveLanguage` 只在 `chooseLanguage` 里调用。

---

## 阶段 3：投递看板、跟进提醒、导入导出

### 3.1 日期："今天"是哪一天
- `src/core/CalendarDate.ts`
- 测试：`tests/core/CalendarDate.test.ts`、`tests/timeZone.ts`（用 `vi.stubEnv('TZ', …)` 切换时区的小工具）

**读懂的标志：**
- 能解释为什么 `new Date().toISOString().slice(0, 10)` 在西雅图下午 4 点以后会得到"明天"，而 `CalendarDate.today` 不会。
- 能说出 `now` 为什么由外部传入：App 里是 `clock`，测试里是固定的时刻。
- 能解释为什么 `addDays` 用 UTC 做加减，就不会受夏令时影响。

### 3.2 投递记录的规则
- `src/core/types.ts`（`Application`、`APPLICATION_STATUSES`、`AppData`）
- `src/core/ApplicationRules.ts`，然后 `src/core/ReminderPolicy.ts`
- 测试：`ApplicationRules.test.ts`、`ReminderPolicy.test.ts`、`tests/core/applicationFixtures.ts`

**读懂的标志：**
- 能说出哪三种状态会提醒，以及"逾期 / 今天 / 3 天内"分别显示在哪里（对照 DECISIONS D12 的两张表）。
- 能解释"状态从 Saved 改成 Applied 时自动填日期，但绝不覆盖用户已填的日期"是哪几行代码实现的。
- 能说出 `APPLICATION_STATUSES` 为什么是一个运行时数组，而不只是一个 type。

### 3.3 导入：不可信输入的校验
- `src/core/limits.ts`，然后 `src/core/FieldChecker.ts`
- `src/core/ApplicationValidator.ts`、`src/core/ResumeValidator.ts`（改成了基于 `FieldChecker`）
- `src/core/ExportCodec.ts`
- 测试：`ExportCodec.test.ts`、`ApplicationValidator.test.ts`

**读懂的标志：**
- 能解释 `FieldChecker` 为什么用返回 `undefined` 表示"无效"，以及为什么要先检查完所有字段、再决定结果，而不是遇到第一个错误就返回。
- 能说出 `enforceLimits` 为 true（导入文件）和 false（自己存的 localStorage）时行为的两点区别。
- 能说出 `allValid` 这个 type guard 解决了什么问题：没有它，代码里会多出几处 `as` 强转。
- 能解释为什么一个文件里只要有一条投递不合法，就整体拒绝。

### 3.4 存储层扩展
- `src/storage/Repository.ts`、`LocalStorageRepository.ts`、`InMemoryRepository.ts`
- 测试：`tests/storage/LocalStorageRepository.test.ts`。注意 `describe.each`：两种实现跑的是同一组"契约测试"。

**读懂的标志：**
- 能解释 `replaceAll` 为什么先写 applications、后写 resume。
- 能解释 `LocalStorageRepository.saveApplication` 为什么必须在"读、改、写"三步之间不出现 `await`：假设读完以后插入一个 `await`，同时发出的 7 次保存会怎样互相覆盖？对照测试 "keeps every change when several saves and deletes are started at the same time"。

### 3.5 看板界面
- `src/ui/App.tsx`（新增 `applications` state、`clock`、几个处理函数）
- `src/ui/board/BoardPage.tsx`，然后 `StatusColumn.tsx`、`ApplicationCard.tsx`、`ReminderBanner.tsx`、`ApplicationForm.tsx`
- `src/ui/format.ts`（`formatDate`）、`src/ui/sampleApplications.ts`
- 测试：`tests/ui/board.test.ts`

**读懂的标志：**
- 能解释 `persistApplication` 里 `setApplications((current) => …)` 这种"传函数给 setter"的写法，和直接传新值有什么不同。
- 能解释 BoardPage 里 `<ApplicationForm key={…}>` 的作用：从编辑 A 切到编辑 B 时，为什么要让 React 重建这个表单？
- 能说出 `formMode` 这个 state 为什么放在 BoardPage，而不是放在 App。

### 3.6 导入导出界面和"保存为投递"
- `src/ui/board/DataTransferPanel.tsx`、`src/ui/fileDownload.ts`
- `src/ui/match/SaveApplicationForm.tsx`，以及 `MatchPage.tsx`、`MatchResultView.tsx` 里新增的 `onSaveApplication`

**读懂的标志：**
- 能按顺序说出导入的流程：选文件 → 检查大小 → 读取 → `decode` → 列出问题，或者弹窗确认 → `replaceAll` → 显示结果。
- 能解释为什么保存为投递时用的是 `analyzedJd`，而不是输入框里当前的 `jdText`。

### 3.7 截图脚本
- `scripts/screenshot.mjs`：不依赖任何 npm 包，用 Node 自带的 `fetch` 和 `WebSocket`，通过 Chrome DevTools Protocol 控制本机的无头 Edge 或 Chrome。先 `npm run dev`，再执行 `npm run screenshot -- --view board --lang zh --out board-zh.png`。
