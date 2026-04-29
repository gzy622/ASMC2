# ASMC2 项目规范

## 1. 项目定位

ASMC2 是纯前端单页应用，用于课堂作业登记、名单维护、分数记录、趋势查看和数据导入导出。

- 不依赖后端，数据保存在 `localStorage`
- 默认入口：`index.html`
- 架构：原生 ES Modules，零构建

## 2. 关键文件

| 路径 | 角色 |
|------|------|
| `index.html` | 页面入口、加载 XLSX CDN 和 `boot.js` |
| `boot.js` | ESM 启动入口，初始化所有模块 |
| `constants.js` | 全局常量（命名导出） |
| `utils.js` | 工具、校验、`KEYS`、`LS`（命名导出） |
| `app.js` | 主状态、名单、任务、持久化（命名导出 `State`, `UI`） |
| `actions.js` | 菜单动作、导入导出、趋势等业务流程（命名导出 `Actions`） |
| `action-views.js` | 视图工厂（命名导出 `ActionViews`） |
| `modal.js` / `bottom-sheet.js` / `scorepad.js` | 组件（命名导出） |
| `back-handler.js` | 浏览器返回处理（命名导出 `BackHandler`） |
| `css/index.css` | 样式入口 |

**模块依赖链：**
```
boot.js
├── app.js (State, UI)
│   ├── utils.js ($, LS, Toast, ColorUtil, ...)
│   └── constants.js (APP_CONFIG, KEYS, ...)
├── actions.js (Actions)
├── action-views.js (ActionViews)
├── modal.js (Modal)
└── scorepad.js (ScorePad)
```

## 3. 数据与兼容性

### localStorage 键名

| 键名 | 用途 |
|------|------|
| `tracker_db` | 作业任务数据 |
| `tracker_roster` | 学生名单原始行 |
| `tracker_anim` | 动画开关 |
| `tracker_prefs` | 用户偏好 |
| `tracker_recovery_draft` | 恢复草稿 |
| `tracker_scorepad_fast_ten` | 分数面板整十模式 |

### 必守规则

- 修改 `localStorage` key 前必须确认迁移方案
- 修改导入导出 JSON 字段前保留向后兼容
- 导入逻辑必须防御式处理缺失/非法字段

## 4. 操作边界

### 允许
- 修复明确定位的 bug
- 补充与现有结构一致的小功能
- 增加针对既有行为的测试

### 谨慎
- 修改 `index.html` 模块入口配置
- 修改 `app.js` 全局状态结构
- 修改 `actions.js` 核心业务流程
- 修改导入导出数据结构
- 修改 `localStorage` key
- 修改 `tests/setup.js` 模块导入逻辑

### 禁止（除非任务明确要求）
- 未核对就新增替代架构
- 删除 `globalThis` 兼容桥但不提供迁移说明
- 引入后端/构建流程/大型框架
- 恢复 `file://` 协议直接打开的支持

## 5. 高风险区域

- `index.html` ESM 入口配置
- `tests/setup.js` ESM 动态导入逻辑
- `app.js` 全局状态
- `actions.js` 业务流程
- `utils.js` 中的 `KEYS`、`LS`、`Validator`
- `localStorage` 数据兼容
- 导入导出结构校验
- 外部 CDN：`xlsx@0.18.5`
- 移动端弹窗/底部面板/返回处理
- `globalThis` 兼容桥（供测试/控制台使用）

## 6. 失败处理规则

- 测试失败时优先定位最近改动，不扩大范围
- 文档与代码冲突时以代码和 `index.html` 为准
- 改动影响导入导出或 `localStorage` 时必须保留旧数据可读
- 修复需要迁移数据时须写明旧/新数据样例和回滚风险

## 7. 测试命令

```bash
npm run test          # 单元测试
npm run test:e2e      # E2E 测试
npm run test:all      # 完整测试
```
