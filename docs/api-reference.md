# API 参考文档

> **ES6 模块系统 API 完整参考**

---

## 📦 模块导入

```javascript
// 导入所有模块
import * as App from './modules/index.js';

// 按需导入
import { state, view, appEvents, Events } from './modules/index.js';
import { Student, Assignment } from './modules/data/models.js';
import { LS } from './modules/data/storage.js';
```

---

## 🎯 核心模块 (core)

### Constants

```javascript
import { 
    ANIMATION_DURATION,
    TIMER_DELAY,
    INTERACTION_THRESHOLD,
    STORAGE_KEYS,
    DEFAULTS,
    REGEX
} from './modules/core/constants.js';
```

#### ANIMATION_DURATION
| 常量 | 值 (ms) | 说明 |
|------|---------|------|
| `FULL_ENTER` | 220 | 全屏弹窗进入 |
| `FULL_EXIT` | 160 | 全屏弹窗退出 |
| `BOTTOM_SHEET_CLOSE` | 260 | 底部面板关闭 |
| `LOADING_MASK_FADE` | 90 | 加载遮罩淡入淡出 |
| `POINTER_GUARD_DEFAULT` | 320 | 指针保护默认时长 |
| `MENU_CLOSE` | 160 | 菜单关闭 |

#### TIMER_DELAY
| 常量 | 值 (ms) | 说明 |
|------|---------|------|
| `DRAFT_PERSIST` | 1200 | 草稿保存延迟 |
| `CARD_META_SAVE` | 250 | 卡片元数据保存 |
| `PERSIST` | 300 | 持久化延迟 |

### EventBus

```javascript
import { appEvents, Events } from './modules/core/events.js';
```

#### 方法

##### `on(event, callback): Function`
订阅事件，返回取消订阅函数。

```javascript
const unsubscribe = appEvents.on(Events.RECORD_UPDATED, ({ studentId }) => {
    console.log(`学生 ${studentId} 已更新`);
});

// 取消订阅
unsubscribe();
```

##### `once(event, callback)`
订阅一次性事件。

```javascript
appEvents.once(Events.STATE_INITIALIZED, () => {
    console.log('状态初始化完成');
});
```

##### `emit(event, data)`
触发事件。

```javascript
appEvents.emit('custom:event', { foo: 'bar' });
```

#### 事件常量 (Events)

| 类别 | 事件名 | 数据 |
|------|--------|------|
| 状态 | `STATE_INITIALIZED` | `{ state }` |
| 状态 | `STATE_CHANGED` | `{ state, changes }` |
| 数据 | `DATA_LOADED` | `{ state }` |
| 数据 | `DRAFT_RESTORED` | `{ draft }` |
| 任务 | `ASG_CREATED` | `{ assignment }` |
| 任务 | `ASG_UPDATED` | `{ assignment, updates }` |
| 任务 | `ASG_DELETED` | `{ id }` |
| 任务 | `ASG_SELECTED` | `{ assignment }` |
| 记录 | `RECORD_UPDATED` | `{ studentId, assignmentId, record }` |
| 视图 | `VIEW_READY` | `{ view }` |
| 视图 | `VIEW_RENDERED` | `{ view }` |

---

## 💾 数据模块 (data)

### Storage

```javascript
import { LS, storage, appStorage } from './modules/data/storage.js';
```

#### LS (便捷接口)

```javascript
// 获取值
const value = LS.get('key', defaultValue);

// 设置值
LS.set('key', value);

// 删除值
LS.remove('key');
```

#### StorageAdapter

```javascript
// 创建命名空间存储
const myStorage = storage.namespace('myapp');
myStorage.set('key', value);

// 获取所有键
const keys = myStorage.keys();
```

### Models

```javascript
import { 
    Student, 
    Assignment, 
    StudentRecord,
    Preferences,
    RecoveryDraft,
    IdGenerator
} from './modules/data/models.js';
```

#### Student

```javascript
// 创建
const student = new Student({ id: '1', name: '张三' });

// 从字符串解析
const student2 = Student.parse('2 李四 #非英语');

// 属性
student.id;        // '1'
student.name;      // '张三'
student.noEnglish; // false
student.isValid(); // true

// 序列化
const json = student.toJSON();
const restored = Student.fromJSON(json);
```

#### Assignment

```javascript
// 创建
const asg = new Assignment({ name: '英语作业' });

// 属性
asg.id;           // 自动生成的唯一 ID
asg.name;         // '英语作业'
asg.subject;      // '英语' (自动推断)
asg.records;      // Map<studentId, StudentRecord>

// 方法
asg.isEnglish();  // true
asg.includesStudent(student); // 检查学生是否参与
asg.getRecord(studentId);     // 获取学生记录
asg.setRecord(studentId, { done: true, score: 90 });
asg.getMetrics(students);     // 获取统计 { total, done, pending }
asg.updateMeta({ name: '新名称', subject: '数学' });
asg.clone();      // 克隆

// 序列化
const json = asg.toJSON();
const restored = Assignment.fromJSON(json);
```

#### StudentRecord

```javascript
const record = new StudentRecord({ done: true, score: 95 });
record.done;      // true
record.score;     // 95
record.isEmpty(); // false
```

#### Preferences

```javascript
const prefs = new Preferences({
    cardDoneColor: '#68c490',
    animations: true,
    showNames: true
});

prefs.update({ animations: false });
```

#### IdGenerator

```javascript
// 生成唯一 ID
const id = IdGenerator.generate();

// 自定义存在检查
const id2 = IdGenerator.generate((id) => existingIds.has(id));
```

### AppState

```javascript
import { state, AppState } from './modules/data/state.js';

// 使用单例
await state.init();

// 或创建新实例
const myState = new AppState();
await myState.init();
```

#### 属性

| 属性 | 类型 | 说明 |
|------|------|------|
| `initialized` | boolean | 是否已初始化 |
| `students` | Student[] | 学生列表 |
| `assignments` | Assignment[] | 任务列表 |
| `currentAssignment` | Assignment | 当前任务 |
| `currentId` | number | 当前任务 ID |
| `preferences` | Preferences | 偏好设置 |
| `studentCount` | number | 学生数量 |
| `assignmentCount` | number | 任务数量 |

#### 方法

##### `init(): Promise<void>`
初始化状态，加载本地存储数据。

```javascript
await state.init();
```

##### `createAssignment(name): Assignment`
创建新任务。

```javascript
const asg = state.createAssignment('数学作业');
```

##### `selectAssignment(id): boolean`
选择任务。

```javascript
const success = state.selectAssignment(asg.id);
```

##### `updateAssignment(id, updates): boolean`
更新任务元数据。

```javascript
state.updateAssignment(asg.id, { name: '新名称', subject: '语文' });
```

##### `deleteAssignment(id): boolean`
删除任务。

```javascript
state.deleteAssignment(asg.id);
```

##### `updateRecord(studentId, data): boolean`
更新学生记录。

```javascript
state.updateRecord('1', { done: true, score: 90 });
```

##### `toggleDone(studentId): boolean`
切换完成状态。

```javascript
state.toggleDone('1');
```

##### `invertSelection()`
反选当前任务。

```javascript
state.invertSelection();
```

##### `getMetrics(asg): Object`
获取任务统计（带缓存）。

```javascript
const { total, done, pending } = state.getMetrics(asg);
```

##### `updatePreferences(updates)`
更新偏好设置。

```javascript
state.updatePreferences({ animations: false });
```

##### `export(): Object`
导出所有数据。

```javascript
const data = state.export();
```

##### `import(data): boolean`
导入数据。

```javascript
state.import(exportedData);
```

---

## 🎨 UI 模块 (ui)

### Renderers

```javascript
import { GridRenderer, SelectRenderer, CounterRenderer } from './modules/ui/renderer.js';
```

#### GridRenderer

```javascript
const renderer = new GridRenderer(document.getElementById('grid'));

// 同步卡片池
renderer.syncCardPool(studentCount);

// 分块同步（大数据量）
renderer.syncCardPoolChunked(studentCount, () => {
    console.log('渲染完成');
});

// 渲染单个卡片
renderer.renderCard(cardElement, student, record, excluded);

// 销毁
renderer.destroy();
```

#### SelectRenderer

```javascript
const select = new SelectRenderer(triggerEl, dropdownEl, textEl);

select.updateOptions(assignments, currentId, version);
select.updateSelection(currentId);
select.open();
select.close();
select.toggle();
```

#### CounterRenderer

```javascript
const counter = new CounterRenderer(document.getElementById('counter'));
counter.update(done, total);
```

### Interactions

```javascript
import { GridInteraction, MenuInteraction } from './modules/ui/interactions.js';
```

#### GridInteraction

```javascript
const interaction = new GridInteraction(gridElement, {
    onToggle: (id, name) => state.toggleDone(id),
    onScore: (id, name) => openScorePad(id, name),
    isScoringMode: () => state.preferences.scoring
});

// 销毁
interaction.destroy();
```

#### MenuInteraction

```javascript
const menu = new MenuInteraction(menuElement, {
    onAction: (action) => handleAction(action),
    closeDelay: 160
});

menu.open();
menu.close();
menu.toggle();
```

### AppView

```javascript
import { view, AppView } from './modules/ui/view.js';

// 使用单例
view.init();

// 或创建新实例
const myView = new AppView();
myView.init();
```

#### 方法

##### `init()`
初始化视图。

##### `render()`
完整渲染。

##### `renderStudent(studentId)`
渲染单个学生。

##### `updatePreferences()`
更新偏好设置 UI。

##### `destroy()`
销毁视图。

---

## 🔧 工具函数

### DOM 操作

```javascript
import { $, qs, qsa, createEl } from './modules/index.js';

// 通过 ID 获取元素
const el = $('elementId');

// 选择器查询
const first = qs('.class');
const all = qsa('.class');

// 创建元素
const div = createEl('div', { 
    className: 'my-class',
    dataset: { id: '123' }
}, '文本内容');
```

### 格式化

```javascript
import { ColorUtil, clamp, formatBackupFileName } from './modules/index.js';

// 颜色工具
ColorUtil.normalizeHex('#68c490');
ColorUtil.hexToRgb('#68c490');
ColorUtil.rgbToHex({ r: 104, g: 196, b: 144 });
ColorUtil.mix('#68c490', '#ffffff', 0.5);
ColorUtil.withAlpha('#68c490', 0.5);

// 数值限制
const value = clamp(num, 0, 100);

// 备份文件名
const filename = formatBackupFileName(new Date());
// assignmentcheck2_backup_20260411_180530.json
```

### 验证

```javascript
import { Validator, isValidObject } from './modules/index.js';

Validator.isValidScore('95');     // true
Validator.isValidScore('abc');    // false
Validator.isValidRecoveryDraft(draft); // true/false
```

---

## 📋 完整示例

### 创建新任务并添加记录

```javascript
import { state, appEvents, Events } from './modules/index.js';

// 等待初始化
await state.init();

// 订阅事件
appEvents.on(Events.ASG_CREATED, ({ assignment }) => {
    console.log(`任务 "${assignment.name}" 已创建`);
});

appEvents.on(Events.RECORD_UPDATED, ({ studentId, record }) => {
    console.log(`学生 ${studentId}: ${record.done ? '完成' : '未完成'}, 分数: ${record.score}`);
});

// 创建任务
const asg = state.createAssignment('英语听写');

// 更新记录
state.updateRecord('1', { done: true, score: 95 });
state.updateRecord('2', { done: true, score: 88 });
```

### 自定义视图

```javascript
import { state, view, appEvents, Events } from './modules/index.js';

// 初始化
await state.init();
view.init();

// 监听视图事件
appEvents.on(Events.VIEW_RENDERED, () => {
    console.log('视图已更新');
});

// 监听自定义 UI 事件
appEvents.on('ui:score:request', ({ studentId, studentName }) => {
    console.log(`为 ${studentName} 打分`);
    // 打开记分板...
});
```

---

## 📝 类型定义 (JSDoc)

```javascript
/**
 * @typedef {Object} AssignmentData
 * @property {number} id
 * @property {string} name
 * @property {string} subject
 * @property {Object} records
 */

/**
 * @typedef {Object} StudentData
 * @property {string} id
 * @property {string} name
 * @property {boolean} [noEnglish]
 */

/**
 * @typedef {Object} Metrics
 * @property {number} total
 * @property {number} done
 * @property {number} pending
 */
```
