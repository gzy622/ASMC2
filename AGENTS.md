# ASMC2 - Agent Harness

> 版本：2026-04-26  
> 项目：ASMC2 / AssignmentCheck2  
> 用途：面向教师的轻量化课堂作业登记工具  
> 原则：以仓库当前真实结构、`index.html` 实际入口和测试配置为准。

---

## 1. 项目定位

ASMC2 是一个纯前端单页应用，用于课堂作业登记、名单维护、分数记录、趋势查看、学生概览和数据导入导出。

- 不依赖后端服务。
- 不需要构建即可在浏览器运行。
- 主要数据保存在浏览器 `localStorage`。
- 默认入口是 `index.html`。
- 默认运行路径是传统 `<script>` 顺序加载。
- 仓库保留 `modules/` 和 `app-modular.js`，但它们不是 `index.html` 当前启用的默认路径。

维护时优先保护教师课上使用的稳定性、旧本地数据可读性和导入导出兼容性。

---

## 2. 当前运行入口

- 当前稳定入口：`index.html`
- 当前菜单版本：`20260425-01`
- 版本展示位置：`index.html` 中的 `#menuVersion`
- 样式入口：`css/index.css`
- Excel 导出依赖：`index.html` 先加载 `https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.core.min.js`

`index.html` 当前启用的传统脚本加载顺序如下：

1. `constants.js`
2. `utils.js`
3. `core.js`
4. `back-handler.js`
5. `modal.js`
6. `bottom-sheet.js`
7. `scorepad.js`
8. `app.js`
9. `action-views.js`
10. `actions.js`
11. `boot.js`

对应的测试加载顺序在 `tests/setup.js` 中保持同构。修改入口顺序时必须同步 `index.html`、`tests/setup.js` 和本文档。

---

## 3. 架构优先级

1. 用户可见行为优先于内部重构。
2. `index.html` 当前加载路径优先于模块化备用路径。
3. 数据兼容性优先于代码整洁。
4. 小范围修复优先于大规模重构。
5. 测试覆盖优先于目录结构美观。
6. 传统全局对象兼容优先于新抽象。
7. 已有测试和 E2E 行为优先于未经验证的推断。
8. 除非任务明确要求，不要主动同步模块化备用路径。

默认维护策略：先修复当前启用的传统脚本路径；如果传统路径与模块化路径存在差异，应在最终说明中标注，不要默认扩大改动范围。不得为了模块化而绕过当前入口。

---

## 4. 文件地图

### 4.1 根目录关键文件

| 路径 | 角色 |
| --- | --- |
| `index.html` | 默认页面入口，定义菜单、弹窗容器、脚本顺序和版本展示 |
| `constants.js` | 传统脚本路径的全局常量 |
| `utils.js` | 传统脚本路径的工具、校验、`KEYS`、`LS`、格式化函数 |
| `core.js` | 基础兼容层 |
| `back-handler.js` | 移动端返回与关闭行为 |
| `modal.js` | 弹窗组件 |
| `bottom-sheet.js` | 底部面板组件 |
| `scorepad.js` | 分数面板与整十快速打分 |
| `app.js` | 主状态、名单、任务、草稿、持久化和 UI 协调 |
| `action-views.js` | 动作视图工厂 |
| `actions.js` | 菜单动作、导入导出、趋势、小测、学生概览等业务流程 |
| `boot.js` | 启动逻辑 |
| `app-modular.js` | 模块化备用入口 |
| `module-loader.js` | 模块加载器 |
| `README.md` | 项目说明 |
| `package.json` | npm 脚本和测试依赖 |
| `vitest.config.js` | Vitest 配置 |
| `playwright.config.js` | Playwright 配置 |

### 4.2 样式文件

`css/index.css` 通过 `@import` 汇总以下文件：

- `css/base.css`
- `css/components.css`
- `css/modal.css`
- `css/scorepad.css`
- `css/bottom-sheet.css`
- `css/roster.css`
- `css/assignment.css`
- `css/trend.css`
- `css/overview.css`
- `css/animations.css`
- `css/responsive.css`

### 4.3 模块化备用路径

模块化文件存在于仓库中，但当前不是默认入口。

- `modules/index.js`
- `modules/core/index.js`
- `modules/core/constants.js`
- `modules/core/events.js`
- `modules/data/index.js`
- `modules/data/models.js`
- `modules/data/state.js`
- `modules/data/storage.js`
- `modules/ui/index.js`
- `modules/ui/renderer.js`
- `modules/ui/interactions.js`
- `modules/ui/view.js`

### 4.4 工具、脚本与文档

- `utils/index.js`
- `utils/animate.js`
- `utils/dom.js`
- `utils/format.js`
- `utils/storage.js`
- `utils/validate.js`
- `scripts/preview.sh`
- `docs/architecture.md`
- `docs/api-reference.md`
- `docs/migration-guide.md`
- `assets/fonts/SourceHanSansSC-Regular.woff2`

### 4.5 测试文件

单元测试与集成测试：

- `tests/core.test.js`
- `tests/state.test.js`
- `tests/utils.test.js`
- `tests/assignment.test.js`
- `tests/bottom-sheet.test.js`
- `tests/modal-progressive.test.js`
- `tests/scorepad.test.js`
- `tests/trend.test.js`
- `tests/import.test.js`

E2E 测试：

- `tests/app.spec.js`
- `tests/e2e_quiz_trend.spec.js`
- `tests/e2e_quiz_trend_mobile.spec.js`
- `tests/e2e_modal_scroll_no_animation.spec.js`
- `tests/e2e_roster_topbar.spec.js`
- `tests/e2e_scorepad_fast_ten.spec.js`

测试辅助：

- `tests/setup.js`
- `tests/setup-modular.js`

---

## 5. 数据与兼容性约束

本节字段和函数名来自当前实现与测试核对，相关实现变更后应重新核对。

### 5.1 默认传统路径的 `localStorage` 键

传统脚本路径的键名定义在 `utils.js` 的 `KEYS` 中：

| 键名 | 用途 |
| --- | --- |
| `tracker_db` | 作业任务数据 |
| `tracker_roster` | 学生名单原始行 |
| `tracker_anim` | 动画开关 |
| `tracker_prefs` | 用户偏好，例如卡片完成色 |
| `tracker_recovery_draft` | 恢复草稿 |
| `tracker_scorepad_fast_ten` | 分数面板整十快速模式 |

模块化备用路径在 `modules/core/constants.js` 中另有 `ac2_list`、`ac2_data`、`ac2_anim`、`ac2_prefs`、`ac2_draft`。该路径不是默认入口，涉及这些键时必须先核对调用链和实际存储命名空间。

### 5.2 当前数据形态

- JSON 备份由 `actions.js` 的 `exp()` 导出，当前顶层字段为 `{ list, data, prefs }`。
- 导入入口为 `actions.js` 的 `imp()`、`parseImportData()`、`applyImportData()`。
- 导入基本校验依赖 `utils.js` 中的 `Validator.isValidImportData()`，要求 `list` 和 `data` 为数组。
- 作业对象由 `app.js` 的 `State.normalizeAsg()` 规范化，核心字段为 `{ id, name, subject, records }`。
- `records` 以学生学号为键，记录值在现有测试中包含 `done`、`score`。
- 名单保存在 `list` 中，单行由 `State.parseRosterLine()` 解析，支持 `#非英语` 等后缀。
- 恢复草稿由 `State.saveRecoveryDraft()` 写入，包含 `version`、`updatedAt` 以及当前快照字段。

### 5.3 必守规则

- 修改 `localStorage` key 前必须确认旧数据迁移方案。
- 修改导入导出 JSON 字段前必须保留向后兼容读取。
- 不得在无迁移逻辑的情况下重命名核心字段。
- 导入逻辑必须对缺失字段、旧版本字段、非法类型做防御式处理。
- 涉及数据结构变更时，应补充旧数据样例、新数据样例、迁移或兼容测试。
- 如果无法从实现中可靠确认某个字段是否仍在使用，标注“需核对”，不得编造字段或删除兼容逻辑。

---

## 6. Agent 操作边界

### 6.1 允许

- 修复明确定位的 bug。
- 补充与现有结构一致的小功能。
- 更新与实际代码同步的文档。
- 增加针对既有行为的测试。
- 补充小范围防御式校验，且不改变旧数据读取语义。

### 6.2 谨慎

- 调整 `index.html` 脚本加载顺序。
- 修改 `app.js` 中的全局状态结构。
- 修改 `actions.js` 中的核心业务流程。
- 修改导入导出 JSON 数据结构。
- 修改 `localStorage` key 或迁移逻辑。
- 修改 `tests/setup.js` 的脚本加载链。
- 修改 `back-handler.js`、`modal.js`、`bottom-sheet.js` 的移动端关闭行为。
- 批量格式化大量文件。

### 6.3 禁止，除非任务明确要求

- 未核对现有文件就新增替代架构。
- 为了模块化而绕过当前传统脚本入口。
- 删除兼容逻辑但不提供迁移说明和回归测试。
- 引入后端、构建流程、大型框架或新的状态管理库。
- 把不存在的旧草案文件或目录写回文档正文。
- 将文档描述改成与 `index.html` 实际入口不一致。

---

## 7. 常见任务流程

### 7.1 修复 UI 问题

- 优先查看：`index.html`、`css/index.css`、对应组件样式文件、`app.js` 的 `UI` 渲染逻辑、`action-views.js`。
- 常见风险：桌面与移动端断点不一致；弹窗内滚动被锁死；大名单场景布局抖动。
- 建议测试：`npm run test -- tests/state.test.js`，必要时加 `npm run test:e2e -- tests/app.spec.js`。
- 人工检查：需要。至少检查桌面宽度和移动端窄屏。

### 7.2 修改作业登记状态逻辑

- 优先查看：`app.js` 的 `State`、`UI.renderStudent()`、`State.updRec()`，以及 `actions.js` 中调用记录更新的流程。
- 常见风险：`done` 与 `score` 语义冲突；空分数记录被错误保留；缓存和局部渲染未失效。
- 建议测试：`npm run test -- tests/assignment.test.js tests/state.test.js`，必要时加 `npm run test:e2e -- tests/app.spec.js`。
- 人工检查：涉及点击卡片、打分模式或大名单时需要。

### 7.3 修改名单编辑逻辑

- 优先查看：`app.js` 的 `parseRosterLine()`、`parseRoster()`、名单保存逻辑，`actions.js` 的学生概览与名单相关动作。
- 常见风险：重复学号、空行、`#非英语` 后缀、旧名单无法解析。
- 建议测试：`npm run test -- tests/state.test.js tests/assignment.test.js`，必要时加 `npm run test:e2e -- tests/e2e_roster_topbar.spec.js`。
- 人工检查：需要，尤其是新增、删除、重排名单后顶部计数和卡片显示。

### 7.4 修改分数面板

- 优先查看：`scorepad.js`、`app.js` 中打分模式入口、`actions.js` 的 `score()`、`css/scorepad.css`。
- 常见风险：整十模式持久化、键盘布局、关闭动画、保存提示、卡片闪动状态。
- 建议测试：`npm run test -- tests/scorepad.test.js tests/state.test.js`，必要时加 `npm run test:e2e -- tests/e2e_scorepad_fast_ten.spec.js`。
- 人工检查：需要。移动端底部高度和输入可达性必须看浏览器。

### 7.5 修改导入导出

- 优先查看：`actions.js` 的 `exp()`、`expExcel()`、`expText()`、`imp()`、`parseImportData()`、`applyImportData()`，以及 `utils.js` 的 `Validator`、`formatBackupFileName()`。
- 常见风险：旧 JSON 不能导入；非法字段导致初始化失败；Excel 依赖只在浏览器中存在；导入后未立即持久化。
- 建议测试：`npm run test -- tests/import.test.js tests/utils.test.js tests/state.test.js`，必要时加导入导出的浏览器手检。
- 人工检查：涉及文件选择、拖拽、Excel 或剪贴板时需要。

### 7.6 修改趋势分析

- 优先查看：`app.js` 的趋势统计与缓存、`actions.js` 的 `quizTrend()`、`action-views.js` 的趋势图渲染、`css/trend.css`。
- 常见风险：默认筛选不符合小测语义；缓存未失效；移动端趋势卡片溢出。
- 建议测试：`npm run test -- tests/trend.test.js tests/state.test.js`，必要时加 `npm run test:e2e -- tests/e2e_quiz_trend.spec.js tests/e2e_quiz_trend_mobile.spec.js`。
- 人工检查：移动端趋势视图需要。

### 7.7 修改弹窗、底部面板或移动端交互

- 优先查看：`modal.js`、`bottom-sheet.js`、`back-handler.js`、`scorepad.js`、`css/modal.css`、`css/bottom-sheet.css`、`css/responsive.css`。
- 常见风险：返回键关闭顺序错误；滚动穿透；动画关闭后状态残留；虚拟键盘遮挡输入区域。
- 建议测试：`npm run test -- tests/modal-progressive.test.js tests/bottom-sheet.test.js tests/scorepad.test.js`，必要时加 `npm run test:e2e -- tests/e2e_modal_scroll_no_animation.spec.js`。
- 人工检查：需要，尤其是移动端。

### 7.8 更新文档

- 优先查看：`index.html`、`package.json`、`tests/`、`README.md`、`docs/`、本文档。
- 常见风险：写入不存在路径；保留旧版本号；测试脚本与 `package.json` 不一致。
- 建议测试：通常不需要跑完整测试；必须核对路径、命令和 `git diff`。
- 人工检查：不需要，除非文档变更伴随 UI 或入口变更。

---

## 8. 变更验证矩阵

| 变更类型 | 必看文件 | 必跑或建议测试 | 人工检查项 |
| --- | --- | --- | --- |
| 作业登记状态 | `app.js`、`actions.js`、`tests/assignment.test.js`、`tests/state.test.js` | `npm run test -- tests/assignment.test.js tests/state.test.js` | 点击卡片切换、计数、刷新后数据 |
| 名单编辑 | `app.js`、`actions.js`、`tests/state.test.js`、`tests/e2e_roster_topbar.spec.js` | `npm run test -- tests/state.test.js`；必要时 `npm run test:e2e -- tests/e2e_roster_topbar.spec.js` | 重复学号、非英语标记、顶部计数 |
| 分数面板 | `scorepad.js`、`app.js`、`css/scorepad.css`、`tests/scorepad.test.js` | `npm run test -- tests/scorepad.test.js tests/state.test.js`；必要时 `npm run test:e2e -- tests/e2e_scorepad_fast_ten.spec.js` | 整十模式、关闭行为、移动端高度 |
| 导入导出 | `actions.js`、`utils.js`、`tests/import.test.js`、`tests/utils.test.js` | `npm run test -- tests/import.test.js tests/utils.test.js tests/state.test.js` | JSON 导入、Excel 导出、文本复制 |
| 趋势分析 | `app.js`、`actions.js`、`action-views.js`、`css/trend.css`、`tests/trend.test.js` | `npm run test -- tests/trend.test.js tests/state.test.js`；必要时 `npm run test:e2e -- tests/e2e_quiz_trend.spec.js tests/e2e_quiz_trend_mobile.spec.js` | 筛选、小测默认范围、移动端趋势卡 |
| 弹窗与底部面板 | `modal.js`、`bottom-sheet.js`、`back-handler.js`、相关 CSS | `npm run test -- tests/modal-progressive.test.js tests/bottom-sheet.test.js`；必要时 `npm run test:e2e -- tests/e2e_modal_scroll_no_animation.spec.js` | 滚动、返回键、无动画状态 |
| 全局入口和启动流程 | `index.html`、`tests/setup.js`、`boot.js`、`package.json` | `npm run test`；必要时 `npm run test:e2e -- tests/app.spec.js` | 首屏加载、版本提示、控制台错误 |
| 样式与移动端布局 | `css/index.css`、相关 CSS、`index.html` | 相关单测；必要时 `npm run test:e2e -- tests/app.spec.js` | 桌面/移动端布局、弹窗滚动、按钮可点 |
| 文档更新 | `AGENTS.md`、`README.md`、`docs/`、`package.json`、`index.html` | 路径和命令核对；通常不跑完整测试 | 无需浏览器，除非伴随入口或 UI 改动 |

可用 npm 脚本以 `package.json` 为准：

- `npm run preview`
- `npm run preview:local`
- `npm run test`
- `npm run test:watch`
- `npm run test:ui`
- `npm run test:coverage`
- `npm run test:e2e`
- `npm run test:all`

---

## 9. 高风险区域

- `index.html` 脚本加载顺序。
- `tests/setup.js` 中与入口一致的加载顺序。
- `app.js` 全局状态与 UI 协调。
- `actions.js` 业务动作中心。
- `utils.js` 中的 `KEYS`、`LS`、`Validator`。
- `localStorage` 数据兼容。
- 导入导出结构校验。
- 外部 CDN 依赖风险：`xlsx@0.18.5` 来自 jsDelivr，涉及 Excel 导出时需确认离线、弱网或加载失败时的行为。
- 移动端弹窗、底部面板、返回处理。
- 传统脚本路径与模块化路径可能不同步。
- 大名单场景下的渲染性能。
- 趋势统计缓存和局部渲染缓存。

---

## 10. 失败处理规则

- 如果测试失败，不要扩大修改范围，优先定位最近改动。
- 如果文档与代码不一致，以代码和 `index.html` 实际入口为准，同时更新文档。
- 如果传统脚本路径与模块化路径行为不一致，默认优先修复传统脚本路径。
- 如果无法确认某个文件是否仍在使用，不要删除，先在 `index.html`、测试和引用关系中核对。
- 如果改动影响导入导出或 `localStorage`，必须保留旧数据可读。
- 如果浏览器行为与单元测试结果冲突，应增加或更新 E2E 覆盖。
- 如果修复需要迁移数据，先写明旧数据样例、新数据样例、迁移路径和回滚风险。
- 如果外部依赖不可用，先确认是否只影响对应功能，不要把纯前端运行改成构建依赖。

---

## 11. 文档同步规则

- 修改入口顺序时，必须同步 `index.html`、`tests/setup.js` 和 `AGENTS.md`。
- 新增、删除、重命名关键文件时，必须同步文件地图和快速参考。
- 修改测试脚本或测试文件时，必须同步运行与测试章节。
- 修改数据结构时，必须同步数据与兼容性约束。
- 修改菜单版本时，必须同步本文档的当前菜单版本。
- `README.md`、`docs/` 和 `AGENTS.md` 若描述同一事实，应保持一致；如发现冲突，优先以代码和入口为准，并在提交说明中指出。
- 文档中只能保留仓库真实存在的路径、命令和测试文件名。

---

## 12. 当前维护状态

- 当前稳定入口：`index.html`
- 当前默认架构：传统 `<script>` 顺序加载，全局对象协作。
- 模块化路径状态：`modules/`、`app-modular.js`、`module-loader.js` 存在，但不是当前默认运行路径。
- 当前重点风险：入口脚本顺序、`localStorage` 兼容、导入导出数据结构、移动端弹窗/底部面板、传统路径与模块化路径不同步。
- 最近一次结构核对日期：2026-04-26

---

## 13. Agent 最终回复要求

每次完成修改后，最终回复必须说明：

- 修改文件。
- 核对范围。
- 是否运行测试。
- 未运行测试的原因。
- 未确认信息。

如果发现传统路径与模块化备用路径存在差异，只标注差异和影响范围；除非任务明确要求，不要把同步模块化路径作为默认追加工作。

---

## 14. 快速参考

- 主页面：`index.html`
- 样式入口：`css/index.css`
- 主状态与 UI 协调：`app.js`
- 业务动作：`actions.js`
- 视图工厂：`action-views.js`
- 组件：`modal.js`、`bottom-sheet.js`、`scorepad.js`
- 返回处理：`back-handler.js`
- 启动逻辑：`boot.js`
- 传统常量与工具：`constants.js`、`utils.js`
- 模块化入口：`app-modular.js`
- 模块总入口：`modules/index.js`
- 预览脚本：`scripts/preview.sh`
- 测试配置：`vitest.config.js`、`playwright.config.js`
- 单元测试：`npm run test`
- E2E 测试：`npm run test:e2e`
- 完整测试：`npm run test:all`
