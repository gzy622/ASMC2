# 应用架构文档

> **版本**: 2.0
> **日期**: 2026-04-29
> **架构模式**: 原生 ES Modules + 分层架构

---

## 📐 架构概览

应用采用原生 ES Modules 架构，所有模块通过 `import/export` 显式依赖。

```
┌─────────────────────────────────────────────────────────────┐
│                        表现层 (UI)                           │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │   Modal     │  │ BottomSheet │  │     ScorePad        │  │
│  │   弹窗组件   │  │  底部面板    │  │    分数面板          │  │
│  └──────┬──────┘  └──────┬──────┘  └──────────┬──────────┘  │
│         │                │                    │             │
│         └────────────────┴────────────────────┘             │
│                          │                                  │
│  ┌───────────────────────┴───────────────────────────────┐  │
│  │                    UI 协调层 (app.js)                   │  │
│  │  State 状态管理  │  UI 渲染协调  │  ActionViews 视图工厂  │  │
│  └───────────────────────┬───────────────────────────────┘  │
└──────────────────────────┼──────────────────────────────────┘
                           │
┌──────────────────────────┼──────────────────────────────────┐
│                          │                                   │
│                     业务逻辑层                               │
│                          │                                   │
├──────────────────────────┼──────────────────────────────────┤
│                          ▼                                   │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │                    Actions 业务动作                        │ │
│  │  菜单处理  │  导入导出  │  趋势分析  │  学生概览  │  其他   │  │
│  └─────────────────────────────────────────────────────────┘ │
│                          │                                   │
└──────────────────────────┼──────────────────────────────────┘
                           │
┌──────────────────────────┼──────────────────────────────────┐
│                          ▼                                   │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │                    核心层 (Core)                         │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐  │ │
│  │  │  Constants  │  │    Utils    │  │   BackHandler   │  │ │
│  │  │   常量      │  │   工具函数   │  │   返回处理       │  │ │
│  │  └─────────────┘  └─────────────┘  └─────────────────┘  │ │
│  └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

---

## 📁 目录结构

```
.
├── index.html              # 应用入口
├── boot.js                 # ESM 启动入口
├── constants.js            # 全局常量（命名导出）
├── utils.js                # 工具函数库（命名导出）
├── core.js                 # 兼容层
├── app.js                  # 状态管理与 UI 协调
├── actions.js              # 业务动作
├── action-views.js         # 视图工厂
├── back-handler.js         # 浏览器返回处理
├── modal.js                # 弹窗组件
├── bottom-sheet.js         # 底部面板
├── scorepad.js             # 分数录入面板
├── css/                    # 样式文件
└── tests/                  # 测试文件
```

---

## 🔄 数据流

```
用户操作 → UI 组件 → State/UI 方法 → Actions 业务逻辑 → 数据变更 → UI 重新渲染
```

### 示例：切换学生完成状态

1. **用户点击卡片** → `UI.handleCardClick()`
2. **调用状态方法** → `State.toggleDone(studentId)`
3. **更新数据** → `State.data` 更新，标记脏数据
4. **触发保存** → 自动持久化到 localStorage
5. **视图响应** → `UI.renderStudent()` 更新卡片状态
6. **DOM 更新** → 卡片样式变更

---

## 📦 模块说明

### 核心层

#### constants.js
全局常量定义，命名导出：

```javascript
export const APP_CONFIG = { ... }
export const TIMER_DELAY = { ... }
export const KEYS = { ... }
export const DEFAULT_ROSTER = [ ... ]
```

#### utils.js
工具函数库，命名导出：

```javascript
// DOM 操作
export const $ = id => document.getElementById(id)
export const qs = (selector, parent) => parent.querySelector(selector)
export const qsa = (selector, parent) => parent.querySelectorAll(selector)

// 存储
export const LS = { get(key, defaultVal), set(key, value), remove(key) }

// 工具类
export const Toast = { init(), show(message), hide() }
export const ColorUtil = { hexToHsl(hex), hslToHex(h, s, l) }
export const IdGenerator = { generate() }
export const Validator = { isValidStudentId(id), isValidName(name) }
```

#### back-handler.js
浏览器返回处理：

```javascript
export const BackHandler = {
  init(),
  pushState(data, title),
  popState(),
  onBack(callback)
}
```

### 数据与状态层 (app.js)

#### State
状态管理对象，命名导出：

```javascript
export const State = {
  // 数据属性
  list: [],           // 学生名单
  roster: [],         // 解析后的名单
  data: [],           // 作业任务列表
  curId: null,        // 当前任务 ID
  mode: 'name',       // 显示模式
  scoring: false,     // 是否打分模式
  animations: true,   // 动画开关
  prefs: {},          // 用户偏好

  // 方法
  init(),                    // 初始化
  normalizeAsg(asg),         // 规范化作业数据
  parseRoster(),             // 解析名单
  selectAsg(id),             // 选择任务
  addAsg(name),              // 添加任务
  removeAsg(id),             // 删除任务
  renameAsg(id, name),       // 重命名任务
  updRec(id, val),           // 更新记录
  toggleDone(id),            // 切换完成状态
  save(),                    // 保存数据
  getMetrics(startIdx, endIdx),  // 获取指标
  // ... 更多方法
}
```

#### UI
UI 协调对象，命名导出：

```javascript
export const UI = {
  init(),                    // 初始化
  render(),                  // 渲染主视图
  renderStudent(id),         // 渲染单个学生
  renderProgress(),          // 渲染进度
  switchView(mode),          // 切换视图模式
  handleCardClick(id),       // 处理卡片点击
  // ... 更多方法
}
```

### 业务层

#### actions.js
业务动作，命名导出：

```javascript
export const Actions = {
  // 菜单动作
  openMenu(),
  closeMenu(),

  // 任务管理
  openAsgManage(),
  createAsg(),
  renameAsg(),
  deleteAsg(),

  // 导入导出
  exportJSON(),
  exportExcel(),
  importData(),

  // 分析功能
  showQuizTrend(),
  showStudentOverview(),

  // 其他
  invertSelection(),
  openRosterEdit(),
  openSettings()
}
```

#### action-views.js
视图工厂，命名导出：

```javascript
export const ActionViews = {
  createTrendView(assignments, options),
  createOverviewView(students, options),
  createRosterEditor(roster, options),
  createSettingsView(prefs, options)
}
```

### UI 组件层

#### modal.js
弹窗组件：

```javascript
export const Modal = {
  init(),
  open(options),
  close(),
  setTitle(title),
  setContent(html),
  setFooter(buttons)
}
```

#### bottom-sheet.js
底部面板：

```javascript
export const BottomSheet = {
  init(),
  open(options),
  close(),
  setContent(html)
}
```

#### scorepad.js
分数录入面板：

```javascript
export const ScorePad = {
  init(),
  open(options),
  close(),
  setStudent(student),
  setScore(score)
}
```

---

## 🔌 模块依赖图

```
boot.js
├── app.js
│   ├── utils.js
│   │   └── constants.js
│   └── constants.js
├── actions.js
│   ├── app.js
│   ├── action-views.js
│   ├── modal.js
│   ├── bottom-sheet.js
│   └── scorepad.js
├── action-views.js
│   └── utils.js
├── modal.js
│   └── utils.js
├── scorepad.js
│   └── utils.js
└── back-handler.js (全局兼容)

modal.js
└── utils.js

bottom-sheet.js
└── utils.js
```

---

## 🚀 启动流程

1. **index.html** 加载 XLSX CDN 和 `boot.js` (type="module")
2. **boot.js** 导入并初始化各模块：
   - 初始化 Toast、Modal、ScorePad
   - 调用 `State.init()` 加载数据
   - 调用 `UI.init()` 初始化界面
3. 应用就绪，等待用户交互

---

## 💾 数据存储

使用 localStorage 持久化：

| Key | 说明 |
|-----|------|
| `tracker_db` | 作业任务数据 |
| `tracker_roster` | 学生名单 |
| `tracker_anim` | 动画开关 |
| `tracker_prefs` | 用户偏好 |
| `tracker_recovery_draft` | 恢复草稿 |
| `tracker_scorepad_fast_ten` | 打分面板快捷设置 |

---

## 🧪 测试

```bash
# 单元测试
npm run test

# E2E 测试
npm run test:e2e

# 全部测试
npm run test:all
```
