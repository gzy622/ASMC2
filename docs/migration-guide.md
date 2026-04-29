# 迁移指南

> **ESM 架构迁移完成说明**
> **版本**: 2.0
> **日期**: 2026-04-29

---

## 📋 迁移概览

项目已完成从传统全局脚本到原生 ES Modules 的架构迁移。当前架构为单一 ESM 模式，所有模块通过 `import/export` 显式依赖。

---

## 🏗️ 架构变更

### 变更前 (传统脚本)

```html
<!-- index.html -->
<script src="constants.js"></script>
<script src="utils.js"></script>
<script src="core.js"></script>
<script src="back-handler.js"></script>
<script src="modal.js"></script>
<script src="bottom-sheet.js"></script>
<script src="scorepad.js"></script>
<script src="app.js"></script>
<script src="action-views.js"></script>
<script src="actions.js"></script>
<script src="boot.js"></script>
```

### 变更后 (ES Modules)

```html
<!-- index.html -->
<script src="https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.core.min.js"></script>
<script type="module" src="./boot.js"></script>
```

```javascript
// boot.js
import { State, UI } from './app.js'
import { Actions } from './actions.js'
import { ActionViews } from './action-views.js'
import { Modal } from './modal.js'
import { ScorePad } from './scorepad.js'

export function bootstrapApp() {
  // 初始化...
}

bootstrapApp()
```

---

## 📦 模块导出对照

### constants.js

```javascript
// 命名导出
export const APP_CONFIG = { ... }
export const TIMER_DELAY = { ... }
export const INTERACTION_THRESHOLD = { ... }
export const CACHE_CONFIG = { ... }
export const GRID_CONFIG = { ... }
export const KEYS = { ... }
export const DEFAULT_ROSTER = [ ... ]
```

### utils.js

```javascript
// DOM 操作
export const $ = id => document.getElementById(id)
export const qs = (selector, parent) => ...
export const qsa = (selector, parent) => ...
export const createEl = (tag, attrs, text) => ...

// 存储
export const LS = { get, set, remove }

// 工具类
export const Toast = { init, show, hide }
export const ColorUtil = { hexToHsl, hslToHex, darken }
export const IdGenerator = { generate }
export const Validator = { isValidStudentId, isValidName }

// 常量
export { APP_CONFIG, TIMER_DELAY, KEYS, DEFAULT_ROSTER } from './constants.js'
```

### app.js

```javascript
export const State = { ... }
export const UI = { ... }
```

### actions.js

```javascript
export const Actions = { ... }
```

### action-views.js

```javascript
export const ActionViews = { ... }
```

### modal.js

```javascript
export const Modal = { ... }
```

### scorepad.js

```javascript
export const ScorePad = { ... }
```

---

## 🔄 API 变更对照

### 状态管理

| 变更前 (全局) | 变更后 (ESM) |
|---------------|--------------|
| `State.list` | `State.list` (相同) |
| `State.data` | `State.data` (相同) |
| `State.curId` | `State.curId` (相同) |
| `State.prefs` | `State.prefs` (相同) |
| `State.addAsg(name)` | `State.addAsg(name)` (相同) |
| `State.selectAsg(id)` | `State.selectAsg(id)` (相同) |
| `State.removeAsg(id)` | `State.removeAsg(id)` (相同) |
| `State.updRec(id, val)` | `State.updRec(id, val)` (相同) |
| `State.toggleDone(id)` | `State.toggleDone(id)` (相同) |
| `State.save()` | `State.save()` (相同) |

### 工具函数

| 变更前 (全局) | 变更后 (ESM) |
|---------------|--------------|
| `$(id)` | `import { $ } from './utils.js'` |
| `LS.get(key, default)` | `import { LS } from './utils.js'` |
| `Toast.show(msg)` | `import { Toast } from './utils.js'` |
| `ColorUtil.hexToHsl(hex)` | `import { ColorUtil } from './utils.js'` |

---

## 🚀 运行方式变更

### 变更前

可直接双击 `index.html` 在浏览器中打开（`file://` 协议）。

### 变更后

必须通过 HTTP 服务运行：

```bash
# 使用 npm
npm run preview

# 或使用本地脚本
npm run preview:local
```

访问 `http://localhost:3000`

**注意**: 不再支持 `file://` 协议直接打开，因为 ES Modules 需要 HTTP 上下文。

---

## 🧪 测试更新

### 单元测试

测试文件使用 ESM 动态导入：

```javascript
// tests/setup.js
const { State, UI } = await import('../app.js')
const { $, LS } = await import('../utils.js')
```

运行测试：

```bash
npm run test
```

### E2E 测试

Playwright 配置使用 HTTP 预览服务：

```javascript
// playwright.config.js
export default {
  webServer: {
    command: 'npm run preview',
    port: 3000,
  },
  use: {
    baseURL: 'http://localhost:3000',
  },
}
```

运行 E2E 测试：

```bash
npm run test:e2e
```

---

## 🗑️ 已删除文件

以下文件已删除，不再使用：

- `app-modular.js` - 旧模块化入口
- `module-loader.js` - 模块加载器
- `tests/setup-modular.js` - 旧测试配置
- `modules/` 目录 - 未接入的模块化实现

---

## ✅ 兼容性说明

### 数据兼容性

- localStorage 键名保持不变：
  - `tracker_db` - 作业任务
  - `tracker_roster` - 学生名单
  - `tracker_anim` - 动画开关
  - `tracker_prefs` - 用户偏好
  - `tracker_recovery_draft` - 恢复草稿
  - `tracker_scorepad_fast_ten` - 打分面板设置

- 现有数据可无缝迁移，无需转换

### 全局兼容桥

部分工具仍挂载到 `globalThis` 供浏览器控制台使用：

```javascript
// 浏览器控制台仍可使用
globalThis.Toast
globalThis.LS
globalThis.$
```

---

## 📚 相关文档

- [架构文档](./architecture.md) - ESM 架构详细说明
- [API 参考](./api-reference.md) - 模块导出接口文档
- [README.md](../README.md) - 项目概览和快速开始
