# 学生分析界面合并计划

## Summary

将首页菜单中的 `小测趋势` 与 `学生概览` 合并为单一入口 `学生分析`。新界面采用两级结构：

1. 主列表页：展示全班学生卡，默认提供概览指标与轻量趋势信号。
2. 学生详情页：点击学生后进入该学生的全屏详情，展示原“小测趋势”的个人版分析。
3. 名单编辑页：从主列表进入独立编辑态，保留现有名单编辑工具栏，不与分析详情混排。

实现策略为“界面合并、内部兼容”：
- 新增统一入口 `Actions.studentAnalysis(options)`。
- 保留 `Actions.studentOverview()` 与 `Actions.quizTrend()`，但改为调用 `studentAnalysis()` 的兼容别名。
- 现有趋势 runtime 保留，新增共享“学生分析报告”组装层，统一主列表与详情页的数据口径。

## Key Changes

### 1. 菜单与入口

- 将首页菜单中的两个按钮替换为一个 `act="studentAnalysis"`，文案改为 `学生分析`。
- `Actions.studentOverview()`：
  默认跳转到 `studentAnalysis({ view: 'list' })`。
- `Actions.quizTrend()`：
  默认跳转到 `studentAnalysis({ view: 'detail-picker', scope: 'quiz' })` 的兼容路径。
  兼容落点规则：
  - 若当前名单为空，按空状态进入主列表。
  - 若有名单，则打开主列表，默认 `scope='quiz'`。
  - 不再保留旧的“全班趋势卡片墙”页面。

### 2. 共享数据层

在 [state-trend.js](/home/vg622/workspace/ASMC2/state-trend.js) 上新增一层共享报告构建能力，统一输出以下结构：

- `State.getStudentAnalysisReport(options)`
  - `options.scope`: `'quiz' | 'all'`
  - `options.subject`: `'all' | '英语' | '数学' | '语文' | '其他'`
  - `options.search`: `string`
  - `options.sort`: `'completion' | 'score' | 'delta'`
- 返回值：
  - `summary`
    - `totalStudents`
    - `excludedCount`
    - `avgCompletion`
    - `avgScore`
    - `scope`
    - `subject`
  - `students`
    - `id`
    - `name`
    - `noEnglish`
    - `searchText`
    - `totalAsgs`
    - `completedAsgs`
    - `completionRate`
    - `scoredAsgs`
    - `avgScore`
    - `trend`
    - `latest`
    - `delta`
    - `best`
    - `timeline`
    - `entries`
    - `timelineKey`
    - `renderKey`
  - `assignments`
    - 当前口径下可用于详情页区间选择的任务列表

默认规则：
- `scope='quiz'` 时使用现有 `getQuizTrendAssignments()` 结果。
- `scope='all'` 时使用全部任务。
- `subject` 过滤作用于主列表与详情页，口径完全一致。
- `search` 只过滤主列表显示，不改变 `summary` 总人数口径。
- `sort='completion'` 规则：
  先按完成率降序，再按平均分降序，再按学号升序。
- `sort='score'` 规则：
  先按平均分降序，再按完成率降序，再按学号升序。
- `sort='delta'` 规则：
  先按变化值降序，再按平均分降序，再按学号升序。
- 趋势标签继续沿用现有 `classifyScoreTrend()`：
  `暂无成绩 / 单次记录 / 稳定 / 上升 / 下降 / 波动`。

### 3. 新界面结构

在 [action-views.js](/home/vg622/workspace/ASMC2/action-views.js) 与 [actions.js](/home/vg622/workspace/ASMC2/actions.js) 中新增统一的 `studentAnalysis` 视图体系。

主列表页必须包含：

- hero：
  `共 X 人 / 排除英语 X 人 / 平均完成率 X% / 平均成绩 X`
- toolbar：
  - 任务范围：`小测 | 全部任务`
  - 科目：`全部科目 | 英语 | 数学 | 语文 | 其他`
  - 搜索：学号或姓名
  - 排序：`按完成率 | 按平均分 | 按最新变化`
- 主按钮区：
  - `查看名单编辑`
- 学生卡：
  - 学号 + 姓名
  - 完成率
  - 已完成 / 总任务数
  - 有成绩次数
  - 平均分
  - 趋势徽标
  - 最新分数或变化值二选一的辅助信息
- 点击学生卡进入详情页。

详情页必须包含：

- 顶部返回按钮，返回主列表并保留主列表筛选状态。
- 学生摘要：
  学号、姓名、完成率、平均分、趋势标签。
- 趋势工具栏：
  - 区间起点
  - 区间终点
  - 任务 chip 开关
  - scope 切换：`小测 | 全部任务`
- 趋势主体：
  - 均分 / 最新 / 变化 / 最佳
  - 折线图
  - 分数时间线 pill
- 默认打开规则：
  - 从主列表进入时，继承当前 `scope` 与 `subject`
  - 默认选中当前可见区间内全部任务
  - 区间默认最近 5 次；不足 5 次则从第一条开始

名单编辑页必须包含：

- 独立的编辑工具栏：
  `新增学生 / 编座号 / 按座号排序 / 清空空行 / 取消 / 保存`
- 列表卡沿用现有编辑字段：
  `学号 / 姓名 / 非英语 / 删除`
- 保存逻辑沿用当前名单保存流程。
- 编辑页退出后返回主列表，并重新计算分析报告。

### 4. 行为与状态机

`Actions.studentAnalysis(options)` 内部统一管理三种视图状态：

- `list`
- `detail`
- `roster-edit`

状态切换规则：

1. 菜单进入：打开 `list`
2. 点击学生：`list -> detail`
3. 点返回：`detail -> list`
4. 点“查看名单编辑”：`list -> roster-edit`
5. 编辑取消：`roster-edit -> list`
6. 编辑保存：保存名单，刷新报告，`roster-edit -> list`

统一保留以下状态，不因切换丢失：

- 主列表的 `scope`
- 主列表的 `subject`
- 主列表的 `search`
- 主列表的 `sort`

详情页局部状态单独维护：

- `startId`
- `endId`
- `activeAssignmentIds`

详情页返回主列表时，不把区间与 chip 选择反写到主列表。

### 5. 渲染与性能

- 主列表继续使用卡片池复用。
- 学生详情继续复用现有趋势折线渲染与分批渲染策略。
- 主列表搜索仅做可见卡筛选，不触发完整 runtime 重建。
- 名单保存、任务元数据变化、学生名单变化后，统一失效共享分析报告缓存。
- 旧的趋势缓存 key 继续保留；新增分析报告缓存时，key 必须包含：
  - `cacheVersion`
  - `rosterVersion`
  - `asgListVersion`
  - `scope`
  - `subject`

## Test Plan

### 单元测试

在现有 `state.test.js` / `trend.test.js` 基础上补充：

1. `getStudentAnalysisReport()` 在 `scope='quiz'` 时仅统计小测。
2. `getStudentAnalysisReport()` 在 `scope='all'` 时统计全部任务。
3. `subject` 过滤同时影响主列表指标与详情任务列表。
4. `search` 只过滤学生列表，不改变 summary 总人数。
5. `sort='completion' | 'score' | 'delta'` 的排序稳定且符合规则。
6. 主列表学生项能返回趋势标签、平均分、变化值。
7. 单学生详情 timeline 与主列表趋势口径一致。
8. 名单编辑保存后，分析报告重新计算。
9. `Actions.studentOverview()` 调用后打开的是新界面主列表。
10. `Actions.quizTrend()` 调用后打开的是新界面且默认 `scope='quiz'`。

### 视图测试

1. `studentAnalysis()` 打开后存在统一 hero、toolbar、学生卡列表。
2. 主列表点击学生进入详情页。
3. 详情页存在区间选择、任务 chip、趋势指标、折线图。
4. 详情页返回后，主列表原搜索、排序、scope、subject 保持不变。
5. 名单编辑页存在完整工具栏。
6. 编辑保存后关闭编辑态并刷新主列表摘要。

### E2E

新增或改写一条主流程：

1. 打开菜单，点击 `学生分析`
2. 主列表默认显示学生卡
3. 切换 `小测/全部任务`
4. 搜索某学生
5. 点击该学生进入详情
6. 切换区间与任务 chip
7. 返回主列表
8. 进入名单编辑，修改一名学生并保存
9. 验证主列表重新渲染并保留分析入口可用

移动端保留一条趋势详情布局测试：
- 详情页在窄屏下仍允许横向查看时间线区域，内容不溢出 modal 边界。

## Assumptions

- 新入口名称固定为 `学生分析`。
- 首页菜单只保留一个分析入口。
- 主列表默认以分析为主，名单编辑进入独立视图，不与分析卡混排。
- 主列表默认展示“概览 + 趋势徽标”，不展示迷你折线。
- 学生详情默认 `scope='quiz'`，但允许切换到 `全部任务`。
- 旧 `studentOverview()` / `quizTrend()` 仅保留为 JS 接口兼容，不要求继续输出旧 DOM 结构。
- 不在本次合并中引入新路由、新模块目录或 ES6 模块架构迁移。
