# API 参考文档

> **原生 ES Modules API 参考**
> **版本**: 2.0
> **日期**: 2026-04-29

---

## 📦 模块导入

```javascript
// 导入核心模块
import { APP_CONFIG, TIMER_DELAY, KEYS, DEFAULT_ROSTER } from './constants.js'
import { $, LS, Toast, ColorUtil, IdGenerator, Validator } from './utils.js'
import { State, UI } from './app.js'
import { Actions } from './actions.js'
import { ActionViews } from './action-views.js'
import { Modal } from './modal.js'
import { ScorePad } from './scorepad.js'
```

---

## 🎯 核心模块 (constants.js)

### APP_CONFIG

| 常量 | 值 | 说明 |
|------|-----|------|
| `DEFAULT_CARD_COLOR` | `'#68c490'` | 默认卡片颜色 |
| `PERSIST_DELAY_MS` | `300` | 持久化延迟 |
| `INIT_DELAY_MS` | `100` | 初始化延迟 |
| `UI_READY_DELAY_MS` | `200` | UI 就绪延迟 |
| `LONG_PRESS_DURATION_MS` | `500` | 长按持续时间 |

### TIMER_DELAY

| 常量 | 值 (ms) | 说明 |
|------|---------|------|
| `DRAFT_PERSIST` | `1200` | 草稿保存延迟 |
| `CARD_META_SAVE` | `250` | 卡片元数据保存 |
| `SCOREPAD_CLOSE` | `120` | 打分面板关闭延迟 |
| `BACK_SIGNAL_DEBOUNCE` | `80` | 返回信号防抖 |
| `EXIT_WINDOW` | `1500` | 退出窗口时间 |

### ANIMATION_DURATION

| 常量 | 值 (ms) | 说明 |
|------|---------|------|
| `FULL_ENTER` | `220` | 全屏弹窗进入 |
| `FULL_EXIT` | `160` | 全屏弹窗退出 |
| `BOTTOM_SHEET_CLOSE` | `260` | 底部面板关闭 |
| `LOADING_MASK_FADE` | `90` | 加载遮罩淡入淡出 |
| `POINTER_GUARD_DEFAULT` | `320` | 指针保护默认时长 |

### KEYS (localStorage 键名)

| 常量 | 值 | 说明 |
|------|-----|------|
| `LIST` | `'tracker_roster'` | 学生名单 |
| `DATA` | `'tracker_db'` | 作业任务数据 |
| `ANIM` | `'tracker_anim'` | 动画开关 |
| `PREFS` | `'tracker_prefs'` | 用户偏好 |
| `DRAFT` | `'tracker_recovery_draft'` | 恢复草稿 |
| `SCOREPAD_FAST_TEN` | `'tracker_scorepad_fast_ten'` | 打分面板快捷设置 |

---

## 🛠️ 工具模块 (utils.js)

### DOM 操作

#### `$(id)`
通过 ID 获取元素。

```javascript
import { $ } from './utils.js'
const grid = $('grid')
```

#### `qs(selector, parent)`
通过选择器获取单个元素。

```javascript
import { qs } from './utils.js'
const btn = qs('.btn-primary', container)
```

#### `qsa(selector, parent)`
通过选择器获取所有匹配元素。

```javascript
import { qsa } from './utils.js'
const cards = qsa('.student-card')
```

#### `createEl(tag, attrs, text)`
创建 DOM 元素。

```javascript
import { createEl } from './utils.js'
const btn = createEl('button', { class: 'btn', disabled: false }, '点击')
```

### 存储 (LS)

#### `LS.get(key, defaultValue)`
获取存储值。

```javascript
import { LS, KEYS } from './utils.js'
const roster = LS.get(KEYS.LIST, [])
```

#### `LS.set(key, value)`
设置存储值。

```javascript
LS.set(KEYS.DATA, assignments)
```

#### `LS.remove(key)`
删除存储值。

```javascript
LS.remove(KEYS.DRAFT)
```

### Toast 提示

#### `Toast.init()`
初始化 Toast 组件。

```javascript
import { Toast } from './utils.js'
Toast.init()
```

#### `Toast.show(message, duration?)`
显示提示。

```javascript
Toast.show('保存成功', 2000)
```

#### `Toast.hide()`
隐藏提示。

```javascript
Toast.hide()
```

### 颜色工具 (ColorUtil)

#### `ColorUtil.hexToHsl(hex)`
HEX 转 HSL。

```javascript
import { ColorUtil } from './utils.js'
const hsl = ColorUtil.hexToHsl('#68c490')
// { h: 145, s: 43, l: 59 }
```

#### `ColorUtil.hslToHex(h, s, l)`
HSL 转 HEX。

```javascript
const hex = ColorUtil.hslToHex(145, 43, 59)
// '#68c490'
```

#### `ColorUtil.darken(hex, percent)`
变暗颜色。

```javascript
const darker = ColorUtil.darken('#68c490', 20)
```

### ID 生成器 (IdGenerator)

#### `IdGenerator.generate()`
生成唯一 ID。

```javascript
import { IdGenerator } from './utils.js'
const id = IdGenerator.generate()
```

### 验证器 (Validator)

#### `Validator.isValidStudentId(id)`
验证学号格式。

```javascript
import { Validator } from './utils.js'
Validator.isValidStudentId('01') // true
```

#### `Validator.isValidName(name)`
验证姓名格式。

```javascript
Validator.isValidName('张三') // true
```

---

## 📊 状态管理 (app.js)

### State

状态管理对象，包含应用所有数据状态。

#### 属性

| 属性 | 类型 | 说明 |
|------|------|------|
| `list` | `string[]` | 原始学生名单字符串数组 |
| `roster` | `object[]` | 解析后的学生对象数组 |
| `data` | `object[]` | 作业任务列表 |
| `curId` | `string\|null` | 当前选中任务 ID |
| `mode` | `'name'\|'id'` | 显示模式 |
| `scoring` | `boolean` | 是否打分模式 |
| `animations` | `boolean` | 动画开关 |
| `prefs` | `object` | 用户偏好设置 |

#### 方法

##### `State.init()`
初始化状态，加载本地存储数据。

```javascript
import { State } from './app.js'
State.init()
```

##### `State.selectAsg(id)`
选择作业任务。

```javascript
State.selectAsg('asg_123')
```

##### `State.addAsg(name)`
添加新任务。

```javascript
State.addAsg('数学作业')
```

##### `State.removeAsg(id)`
删除任务。

```javascript
State.removeAsg('asg_123')
```

##### `State.renameAsg(id, name)`
重命名任务。

```javascript
State.renameAsg('asg_123', '新名称')
```

##### `State.updRec(studentId, value)`
更新学生记录。

```javascript
State.updRec('stu_01', { done: true, score: 90 })
```

##### `State.toggleDone(studentId)`
切换完成状态。

```javascript
State.toggleDone('stu_01')
```

##### `State.save()`
保存数据到 localStorage。

```javascript
State.save()
```

##### `State.getMetrics(startIdx?, endIdx?)`
获取统计指标。

```javascript
const metrics = State.getMetrics(0, 10)
```

##### `State.normalizeAsg(asg)`
规范化作业数据。

```javascript
const normalized = State.normalizeAsg({ id: '1', name: '作业' })
```

##### `State.parseRoster()`
解析名单字符串。

```javascript
State.parseRoster()
```

### UI

UI 协调对象，负责渲染和用户交互。

#### 方法

##### `UI.init()`
初始化 UI。

```javascript
import { UI } from './app.js'
UI.init()
```

##### `UI.render()`
渲染主视图。

```javascript
UI.render()
```

##### `UI.renderStudent(id)`
渲染单个学生卡片。

```javascript
UI.renderStudent('stu_01')
```

##### `UI.renderProgress()`
渲染进度计数器。

```javascript
UI.renderProgress()
```

##### `UI.switchView(mode)`
切换视图模式。

```javascript
UI.switchView('id') // 或 'name'
```

---

## 🎬 业务动作 (actions.js)

### Actions

业务动作对象，处理所有用户操作。

#### 菜单操作

##### `Actions.openMenu()`
打开菜单。

```javascript
import { Actions } from './actions.js'
Actions.openMenu()
```

##### `Actions.closeMenu()`
关闭菜单。

```javascript
Actions.closeMenu()
```

#### 任务管理

##### `Actions.openAsgManage()`
打开任务管理。

```javascript
Actions.openAsgManage()
```

##### `Actions.createAsg()`
创建新任务。

```javascript
Actions.createAsg()
```

##### `Actions.renameAsg(id)`
重命名任务。

```javascript
Actions.renameAsg('asg_123')
```

##### `Actions.deleteAsg(id)`
删除任务。

```javascript
Actions.deleteAsg('asg_123')
```

#### 数据导入导出

##### `Actions.exportJSON()`
导出 JSON。

```javascript
Actions.exportJSON()
```

##### `Actions.exportExcel()`
导出 Excel。

```javascript
Actions.exportExcel()
```

##### `Actions.importData()`
导入数据。

```javascript
Actions.importData()
```

#### 分析功能

##### `Actions.showQuizTrend()`
显示小测趋势。

```javascript
Actions.showQuizTrend()
```

##### `Actions.showStudentOverview()`
显示学生概览。

```javascript
Actions.showStudentOverview()
```

#### 其他操作

##### `Actions.invertSelection()`
反选当前任务。

```javascript
Actions.invertSelection()
```

##### `Actions.openRosterEdit()`
打开名单编辑。

```javascript
Actions.openRosterEdit()
```

##### `Actions.openSettings()`
打开设置。

```javascript
Actions.openSettings()
```

---

## 🎨 视图工厂 (action-views.js)

### ActionViews

视图工厂对象，创建各种业务视图。

#### `ActionViews.createTrendView(assignments, options)`
创建趋势视图。

```javascript
import { ActionViews } from './action-views.js'
const view = ActionViews.createTrendView(assignments, { start: 0, end: 10 })
```

#### `ActionViews.createOverviewView(students, options)`
创建学生概览视图。

```javascript
const view = ActionViews.createOverviewView(students, { studentId: 'stu_01' })
```

#### `ActionViews.createRosterEditor(roster, options)`
创建名单编辑器。

```javascript
const editor = ActionViews.createRosterEditor(roster, { onSave: (r) => {} })
```

#### `ActionViews.createSettingsView(prefs, options)`
创建设置视图。

```javascript
const settings = ActionViews.createSettingsView(prefs, { onChange: (p) => {} })
```

---

## 🪟 UI 组件

### Modal (modal.js)

弹窗组件。

```javascript
import { Modal } from './modal.js'

// 初始化
Modal.init()

// 打开弹窗
Modal.open({
  title: '标题',
  content: '<p>内容</p>',
  buttons: [
    { text: '确定', primary: true, onClick: () => {} },
    { text: '取消', onClick: () => Modal.close() }
  ]
})

// 关闭弹窗
Modal.close()

// 设置标题
Modal.setTitle('新标题')

// 设置内容
Modal.setContent('<p>新内容</p>')

// 设置按钮
Modal.setFooter([{ text: '关闭', onClick: () => Modal.close() }])
```

### ScorePad (scorepad.js)

分数录入面板。

```javascript
import { ScorePad } from './scorepad.js'

// 初始化
ScorePad.init()

// 打开面板
ScorePad.open({
  studentId: 'stu_01',
  studentName: '张三',
  currentScore: 85,
  onSubmit: (score) => { console.log(score) }
})

// 关闭面板
ScorePad.close()
```

---

## 🔙 返回处理 (back-handler.js)

### BackHandler

浏览器返回处理。

```javascript
import { BackHandler } from './back-handler.js'

// 初始化
BackHandler.init()

// 监听返回
BackHandler.onBack(() => {
  console.log('用户点击返回')
})

// 压入状态
BackHandler.pushState({ page: 'modal' }, '弹窗')

// 弹出状态
BackHandler.popState()
```

---

## 🚀 启动流程 (boot.js)

```javascript
import { State, UI } from './app.js'
import { Actions } from './actions.js'
import { ActionViews } from './action-views.js'
import { Modal } from './modal.js'
import { ScorePad } from './scorepad.js'

export function bootstrapApp() {
  const Toast = globalThis.Toast

  if (Toast && Toast.init) Toast.init()
  Modal.init()
  ScorePad.init()

  State.init()
  UI.init()
}

// 自动执行
bootstrapApp()
```
