# ASMC2 - Agent Harness

> 版本：2026-04-28

## 快速开始

```bash
# 预览
npm run preview

# 测试
npm run test
npm run test:e2e
```

## 项目速览

纯前端课堂作业登记工具。数据存 `localStorage`，入口 `index.html`。

**关键约束：**
- 优先保护教师课上使用的稳定性
- 数据兼容性优先于代码整洁
- 传统脚本路径优先于模块化备用路径

## 文档导航

| 文档 | 用途 |
|------|------|
| [docs/project-conventions.md](./docs/project-conventions.md) | 完整项目规范、架构说明、操作边界 |
| [docs/architecture.md](./docs/architecture.md) | 架构设计文档 |
| [docs/api-reference.md](./docs/api-reference.md) | API 参考 |

## 关键路径

```
index.html
├── constants.js → utils.js → core.js
├── back-handler.js → modal.js → bottom-sheet.js → scorepad.js
├── app.js → action-views.js → actions.js → boot.js
└── css/index.css
```

## 数据键名

- `tracker_db` - 作业任务
- `tracker_roster` - 学生名单
- `tracker_prefs` - 用户偏好
- `tracker_recovery_draft` - 恢复草稿

## 任务前必读

1. **修改前** → 阅读 [docs/project-conventions.md#操作边界](./docs/project-conventions.md#4-操作边界)
2. **修改数据/存储** → 阅读 [docs/project-conventions.md#数据兼容性](./docs/project-conventions.md#3-数据与兼容性)
3. **测试失败** → 阅读 [docs/project-conventions.md#失败处理](./docs/project-conventions.md#6-失败处理规则)
