# 应用架构文档

> **版本**: 1.0  
> **日期**: 2026-04-11  
> **架构模式**: 分层架构 + 事件驱动

---

## 📐 架构概览

```
┌─────────────────────────────────────────────────────────────┐
│                        表现层 (UI)                           │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │   View      │  │  Renderer   │  │   Interaction       │  │
│  │   主视图     │  │   渲染器     │  │   交互处理器         │  │
│  └──────┬──────┘  └──────┬──────┘  └──────────┬──────────┘  │
│         │                │                    │             │
│         └────────────────┴────────────────────┘             │
│                          │                                  │
│                    事件总线 (EventBus)                        │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────┼──────────────────────────────────┐
│                          │                                   │
│                     业务逻辑层                               │
│                          │                                   │
├──────────────────────────┼──────────────────────────────────┤
│                          ▼                                   │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │                    数据层 (Data)                         │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐  │ │
│  │  │  AppState   │  │   Models    │  │    Storage      │  │ │
│  │  │  状态管理    │  │   数据模型   │  │    存储适配器    │  │ │
│  │  └─────────────┘  └─────────────┘  └─────────────────┘  │ │
│  └─────────────────────────────────────────────────────────┘ │
│                          │                                   │
│                     事件总线 (EventBus)                       │
│                          │                                   │
└──────────────────────────┼──────────────────────────────────┘
                           │
┌──────────────────────────┼──────────────────────────────────┐
│                          ▼                                   │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │                    核心层 (Core)                         │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐  │ │
│  │  │  Constants  │  │  EventBus   │  │    Utils        │  │ │
│  │  │   常量      │  │   事件系统   │  │    工具函数      │  │ │
│  │  └─────────────┘  └─────────────┘  └─────────────────┘  │ │
│  └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

---

## 📁 目录结构

```
modules/
├── core/                    # 核心层
│   ├── constants.js         # 常量定义
│   ├── events.js            # 事件系统
│   └── index.js             # 模块入口
│
├── data/                    # 数据层
│   ├── storage.js           # 存储适配器
│   ├── models.js            # 数据模型
│   ├── state.js             # 状态管理
│   └── index.js             # 模块入口
│
├── ui/                      # 表现层
│   ├── renderer.js          # 渲染器
│   ├── interactions.js      # 交互处理器
│   ├── view.js              # 主视图
│   └── index.js             # 模块入口
│
└── index.js                 # 总入口
```

---

## 🔄 数据流

```
用户操作 → 交互层 → 事件总线 → 状态管理 → 数据变更 → 事件通知 → 视图更新
```

### 示例：切换学生完成状态

1. **用户点击卡片** → `GridInteraction._onClick()`
2. **触发回调** → `AppView._onStudentToggle()`
3. **调用状态方法** → `state.toggleDone(studentId)`
4. **更新数据** → `Assignment.setRecord()`
5. **触发事件** → `appEvents.emit(Events.RECORD_UPDATED)`
6. **视图响应** → `AppView.renderStudent()`
7. **DOM 更新** → `GridRenderer.renderCard()`

---

## 📦 模块说明

### Core (核心层)

#### Constants
集中管理所有常量，包括：
- `ANIMATION_DURATION` - 动画时长
- `TIMER_DELAY` - 定时器延迟
- `INTERACTION_THRESHOLD` - 交互阈值
- `STORAGE_KEYS` - 存储键名

#### EventBus
发布/订阅事件系统：
```javascript
// 订阅事件
appEvents.on(Events.RECORD_UPDATED, ({ studentId }) => {
    console.log(`学生 ${studentId} 记录已更新`);
});

// 触发事件
appEvents.emit(Events.RECORD_UPDATED, { studentId: '123' });
```

### Data (数据层)

#### Models
数据模型类：
- `Student` - 学生
- `Assignment` - 作业任务
- `StudentRecord` - 学生记录
- `Preferences` - 偏好设置
- `RecoveryDraft` - 恢复草稿

#### AppState
状态管理器，提供：
- 数据操作: `createAssignment()`, `updateRecord()`, `toggleDone()`
- 数据查询: `getMetrics()`, `currentAssignment`
- 持久化: 自动保存到 localStorage
- 草稿恢复: 自动保存和恢复未完成的操作

#### Storage
存储适配器：
```javascript
// 使用
import { LS } from './modules/data/storage.js';
LS.set('key', value);
const value = LS.get('key', defaultValue);
```

### UI (表现层)

#### Renderers
渲染器组件：
- `GridRenderer` - 网格渲染
- `SelectRenderer` - 下拉选择器
- `CounterRenderer` - 计数器

#### Interactions
交互处理器：
- `GridInteraction` - 网格点击/长按
- `MenuInteraction` - 菜单操作
- `GlobalClickHandler` - 全局点击
- `KeyboardHandler` - 键盘事件

#### AppView
主视图，整合所有渲染器和交互处理器。

---

## 🎯 事件列表

### 状态事件
| 事件名 | 说明 | 数据 |
|--------|------|------|
| `STATE_INITIALIZED` | 状态初始化完成 | `{ state }` |
| `STATE_CHANGED` | 状态变更 | `{ state, changes }` |
| `STATE_PERSISTED` | 状态已持久化 | `{}` |

### 数据事件
| 事件名 | 说明 | 数据 |
|--------|------|------|
| `DATA_LOADED` | 数据加载完成 | `{ state }` |
| `DATA_SAVED` | 数据已保存 | `{}` |
| `DRAFT_SAVED` | 草稿已保存 | `{ draft }` |
| `DRAFT_RESTORED` | 草稿已恢复 | `{ draft }` |

### 任务事件
| 事件名 | 说明 | 数据 |
|--------|------|------|
| `ASG_CREATED` | 任务创建 | `{ assignment }` |
| `ASG_UPDATED` | 任务更新 | `{ assignment, updates }` |
| `ASG_DELETED` | 任务删除 | `{ id }` |
| `ASG_SELECTED` | 任务选择 | `{ assignment }` |

### 记录事件
| 事件名 | 说明 | 数据 |
|--------|------|------|
| `RECORD_UPDATED` | 记录更新 | `{ studentId, assignmentId, record }` |
| `RECORDS_CLEARED` | 记录清空 | `{ assignmentId }` |

### 视图事件
| 事件名 | 说明 | 数据 |
|--------|------|------|
| `VIEW_READY` | 视图就绪 | `{ view }` |
| `VIEW_RENDERED` | 视图已渲染 | `{ view }` |

---

## 🔌 使用方式

### 方式一：ES6 模块 (推荐)

```javascript
// app-modern.js
import { state, view, appEvents, Events } from './modules/index.js';

// 初始化
await state.init();
view.init();

// 订阅事件
appEvents.on(Events.RECORD_UPDATED, ({ studentId }) => {
    console.log(`学生 ${studentId} 已更新`);
});
```

### 方式二：传统脚本 + 模块兼容层

```javascript
// 在现有代码中使用
if (ModuleSystem.isReady()) {
    const state = ModuleSystem.getState();
    state.toggleDone('123');
}
```

---

## 🚀 迁移指南

### 从传统代码迁移到模块系统

#### 1. 状态访问
```javascript
// 传统方式
State.toggleDone(id);

// 模块方式
import { state } from './modules/index.js';
state.toggleDone(id);
```

#### 2. 事件监听
```javascript
// 传统方式（如果有）
State.onChange(callback);

// 模块方式
import { appEvents, Events } from './modules/index.js';
appEvents.on(Events.RECORD_UPDATED, callback);
```

#### 3. 数据模型
```javascript
// 传统方式
const asg = { id: 1, name: '任务', records: {} };

// 模块方式
import { Assignment } from './modules/index.js';
const asg = new Assignment({ name: '任务' });
```

---

## 📊 性能优化

### 虚拟滚动
当学生数量超过 `VIRTUAL_SCROLL.THRESHOLD` (50) 时，自动启用分块渲染。

### 缓存策略
- 任务统计缓存: 基于 `_cacheVersion` 的失效策略
- 最大缓存数: `CACHE.MAX_METRICS_SIZE` (50)

### 防抖/节流
- 持久化: 300ms 防抖
- 草稿保存: 1200ms 防抖

---

## 🧪 测试

模块系统支持单元测试：

```javascript
// test/state.test.js
import { state } from '../modules/data/state.js';
import { describe, it, expect } from 'vitest';

describe('AppState', () => {
    it('should create assignment', () => {
        const asg = state.createAssignment('测试任务');
        expect(asg.name).toBe('测试任务');
    });
});
```

---

## 📝 注意事项

1. **模块加载顺序**: 确保 `app-modern.js` 使用 `type="module"`
2. **浏览器兼容性**: 需要支持 ES6 模块的浏览器
3. **向后兼容**: 传统代码继续使用，模块系统通过 `modules-compat.js` 提供兼容层
4. **事件命名**: 使用 `Events` 常量，避免硬编码字符串

---

## 🔮 未来规划

- [ ] 完整的 TypeScript 类型定义
- [ ] 服务端渲染 (SSR) 支持
- [ ] 状态时间旅行 (撤销/重做)
- [ ] 插件系统
