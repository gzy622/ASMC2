# ASMC2 - Agent Harness

> 版本：2026-04-29

## 快速开始

```bash
# 预览（必须通过 HTTP 服务运行）
npm run preview

# 测试
npm run test
npm run test:e2e
npm run test:all
```

## 项目速览

纯前端课堂作业登记工具。数据存 `localStorage`，入口 `index.html`。

**架构**: 原生 ES Modules，零构建

**关键约束：**
- 优先保护教师课上使用的稳定性
- 数据兼容性优先于代码整洁
- 所有模块通过 `import/export` 显式依赖

## 文档导航

| 文档 | 用途 |
|------|------|
| [docs/project-conventions.md](./docs/project-conventions.md) | 完整项目规范、架构说明、操作边界 |
| [docs/architecture.md](./docs/architecture.md) | ESM 架构设计文档 |
| [docs/api-reference.md](./docs/api-reference.md) | 模块导出接口参考 |
| [docs/migration-guide.md](./docs/migration-guide.md) | 架构迁移说明 |

## 关键路径

```
index.html
├── XLSX CDN
└── boot.js (type="module")
    ├── app.js (State, UI)
    │   ├── utils.js ($, LS, Toast, ColorUtil, ...)
    │   └── constants.js (APP_CONFIG, KEYS, ...)
    ├── actions.js (Actions)
    ├── action-views.js (ActionViews)
    ├── modal.js (Modal)
    └── scorepad.js (ScorePad)
```

## 核心模块导出

```javascript
// constants.js
export const APP_CONFIG, TIMER_DELAY, KEYS, DEFAULT_ROSTER

// utils.js
export const $, qs, qsa, createEl, LS, Toast, ColorUtil, IdGenerator, Validator

// app.js
export const State, UI

// actions.js
export const Actions

// action-views.js
export const ActionViews

// modal.js
export const Modal

// scorepad.js
export const ScorePad
```

## 数据键名

- `tracker_db` - 作业任务
- `tracker_roster` - 学生名单
- `tracker_prefs` - 用户偏好
- `tracker_recovery_draft` - 恢复草稿
- `tracker_scorepad_fast_ten` - 打分面板快捷设置

## 任务前必读

1. **修改前** → 阅读 [docs/project-conventions.md#操作边界](./docs/project-conventions.md#4-操作边界)
2. **修改数据/存储** → 阅读 [docs/project-conventions.md#数据兼容性](./docs/project-conventions.md#3-数据与兼容性)
3. **测试失败** → 阅读 [docs/project-conventions.md#失败处理](./docs/project-conventions.md#6-失败处理规则)

## 运行方式

**必须通过 HTTP 服务运行**，不再支持 `file://` 协议：

```bash
npm run preview        # 启动预览服务
npm run preview:local  # 使用本地脚本
```

访问 `http://localhost:3000`
