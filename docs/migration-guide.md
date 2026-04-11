# 迁移指南

> **从传统脚本迁移到 ES6 模块系统**

---

## 📋 迁移概览

本次架构升级引入了 ES6 模块系统，同时保持对现有代码的向后兼容。您可以选择以下迁移路径：

| 路径 | 难度 | 适用场景 |
|------|------|----------|
| **保持现状** | 无 | 现有功能稳定，无需修改 |
| **渐进迁移** | 低 | 新功能使用模块，旧代码保持不变 |
| **完全迁移** | 中 | 全面采用新架构 |

---

## 🔄 迁移对照表

### 状态管理

| 传统代码 | 模块代码 |
|----------|----------|
| `State.list` | `state.students` |
| `State.data` | `state.assignments` |
| `State.cur` | `state.currentAssignment` |
| `State.curId` | `state.currentId` |
| `State.prefs` | `state.preferences` |
| `State.addAsg(name)` | `state.createAssignment(name)` |
| `State.selectAsg(id)` | `state.selectAssignment(id)` |
| `State.removeAsg(id)` | `state.deleteAssignment(id)` |
| `State.updRec(id, val)` | `state.updateRecord(id, val)` |
| `State.toggleViewMode()` | `state.preferences.showNames = !state.preferences.showNames` |
| `State.save()` | 自动处理，无需调用 |

### 数据模型

| 传统代码 | 模块代码 |
|----------|----------|
| `{ id, name, records: {} }` | `new Assignment({ name })` |
| `State.normalizeAsg(data)` | `Assignment.fromJSON(data)` |
| `State.parseRosterLine(line)` | `Student.parse(line)` |

### 事件系统

| 传统代码 | 模块代码 |
|----------|----------|
| 无（直接调用） | `appEvents.on(event, callback)` |
| 无 | `appEvents.emit(event, data)` |

### 存储

| 传统代码 | 模块代码 |
|----------|----------|
| `LS.get(key, default)` | `LS.get(key, default)` (相同) |
| `LS.set(key, value)` | `LS.set(key, value)` (相同) |

---

## 🛠️ 渐进迁移步骤

### 步骤 1: 引入模块兼容层

在 `index.html` 中添加：

```html
<!-- 在原有脚本之后添加 -->
<script type="module" src="modules-compat.js"></script>
```

### 步骤 2: 在现有代码中使用模块

```javascript
// 在 actions.js 或其他文件中
async function someAction() {
    // 检查模块系统是否就绪
    if (typeof ModuleSystem !== 'undefined' && ModuleSystem.isReady()) {
        const state = ModuleSystem.getState();
        // 使用新 API
        state.createAssignment('新任务');
    } else {
        // 使用传统 API
        State.addAsg('新任务');
    }
}
```

### 步骤 3: 新功能使用模块系统

创建新的模块文件：

```javascript
// modules/features/new-feature.js
import { state, appEvents, Events } from '../index.js';

export function newFeature() {
    // 使用模块系统
    appEvents.on(Events.ASG_CREATED, ({ assignment }) => {
        console.log('新任务:', assignment.name);
    });
}
```

### 步骤 4: 完全迁移（可选）

将 `index.html` 中的脚本引用改为模块方式：

```html
<!-- 传统方式 -->
<script src="utils.js"></script>
<script src="core.js"></script>
<script src="app.js"></script>
...

<!-- 模块方式 -->
<script type="module" src="app-modern.js"></script>
```

---

## 🧪 测试迁移后的代码

### 运行现有测试

```bash
npm test
```

### 测试模块系统

```javascript
// test/module-compat.test.js
import { describe, it, expect } from 'vitest';

describe('Module System', () => {
    it('should expose ModuleSystem globally', () => {
        expect(typeof ModuleSystem).toBe('object');
    });
    
    it('should load modules', async () => {
        const modules = await ModuleSystem.init();
        expect(modules).not.toBeNull();
        expect(modules.state).toBeDefined();
    });
});
```

---

## ⚠️ 注意事项

### 1. 模块加载是异步的

```javascript
// 错误：立即访问可能未就绪
ModuleSystem.init();
const state = ModuleSystem.getState(); // 可能为 null

// 正确：等待初始化完成
const modules = await ModuleSystem.init();
const state = modules.state;
```

### 2. 事件名称变化

```javascript
// 传统代码可能使用硬编码
const EVENT_UPDATE = 'update';

// 模块代码使用常量
import { Events } from './modules/index.js';
const EVENT_UPDATE = Events.RECORD_UPDATED;
```

### 3. 数据模型差异

```javascript
// 传统代码使用纯对象
const asg = State.cur;
console.log(asg.name);

// 模块代码使用类实例，功能相同
const asg = state.currentAssignment;
console.log(asg.name); // 相同
```

---

## 📊 迁移检查清单

- [ ] 添加模块兼容层
- [ ] 验证现有测试通过
- [ ] 更新新功能使用模块
- [ ] 文档更新
- [ ] 性能测试
- [ ] 生产环境验证

---

## 🆘 故障排除

### 问题：模块加载失败

**症状**: `ModuleSystem.isReady()` 返回 `false`

**解决**:
1. 检查浏览器控制台错误
2. 确认 `modules-compat.js` 已加载
3. 检查服务器是否支持 ES6 模块

### 问题：状态不同步

**症状**: 模块状态和传统状态不一致

**解决**:
- 确保只使用一种方式修改状态
- 不要混用 `State.xxx` 和 `state.xxx`

### 问题：事件未触发

**症状**: 订阅的事件没有响应

**解决**:
```javascript
// 检查事件名称
console.log(Events); // 查看所有可用事件

// 确保正确订阅
appEvents.on(Events.RECORD_UPDATED, callback);
```

---

## 📚 相关文档

- [架构文档](./architecture.md) - 详细架构说明
- [API 参考](./api-reference.md) - 完整的 API 文档
- [模块说明](./modules/README.md) - 各模块详细说明
