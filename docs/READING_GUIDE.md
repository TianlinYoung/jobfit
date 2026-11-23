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
- `src/ui/format.ts`、`src/ui/sampleData.ts`
- 测试：`tests/ui/sampleData.test.ts`

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
