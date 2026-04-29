# 作业登记 AssignmentCheck2

一个轻量化、零构建的课堂作业登记工具。基于原生 ES Modules 架构，支持本地持久化、导入导出、趋势分析、学生概览和整十快捷打分。

## 版本信息

- 当前菜单版本：`20260428-01`
- 入口：`index.html`
- 运行方式：原生 ES Modules (`type="module"`)
- 启动入口：`boot.js`

## 功能概览

- 网格化点名登记
- 按学号或姓名展示学生卡片
- 点击切换完成状态
- 分数登记模式
- 支持数字键盘输入和整十快速打分
- 多任务管理
- 新增、切换、重命名、删除任务
- 名单编辑
- 支持批量编辑名单和“排除英语”标记
- 小测趋势
- 查看区间均分、最新分、变化与轨迹
- 学生概览
- 查看单个学生的提交统计与分数记录
- 一键反选
- 本地持久化
- 数据保存在浏览器 `localStorage`
- 备份导入导出
- 支持 JSON、Excel、文本格式
- 动画开关
- 卡片颜色自定义

## 快速开始

本项目使用原生 ES Modules，必须通过 HTTP 服务运行，不支持 `file://` 协议直接打开。

### 使用预览服务器

```bash
npm run preview
```

访问 `http://localhost:3000`

### 使用本地脚本

```bash
npm run preview:local
```

`scripts/preview.sh` 会优先使用 `python3`，再回退到 `python`。

## 测试

```bash
npm run test
npm run test:e2e
npm run test:all
npm run test:coverage
```

## 项目结构

```text
.
├── index.html          # 应用入口，加载 XLSX CDN 和 boot.js
├── boot.js             # ESM 启动入口
├── constants.js        # 全局常量（命名导出）
├── utils.js            # 工具函数库（命名导出）
├── app.js              # 状态管理与 UI 协调（命名导出 State, UI）
├── actions.js          # 菜单动作、导入导出等业务逻辑
├── action-views.js     # 业务视图工厂
├── back-handler.js     # 浏览器返回处理
├── modal.js            # 弹窗组件
├── bottom-sheet.js     # 底部滑出面板
├── scorepad.js         # 分数录入面板
├── core.js             # 兼容层
├── css/                # 样式文件
├── tests/              # 测试文件
├── scripts/            # 脚本工具
├── docs/               # 文档
├── package.json
├── playwright.config.js
├── vitest.config.js
└── AGENTS.md
```

## 核心文件

| 文件 | 说明 |
| --- | --- |
| `index.html` | 应用入口，定义页面结构和脚本加载顺序 |
| `app.js` | 主状态管理与 UI 协调 |
| `actions.js` | 菜单动作、导入导出、趋势、小测、概览等业务逻辑 |
| `core.js` | 兼容层，保留基础全局能力 |
| `constants.js` | 全局常量 |
| `utils.js` | 通用工具函数 |

## UI 组件

| 文件 | 说明 |
| --- | --- |
| `modal.js` | 弹窗组件，支持渐进式渲染 |
| `bottom-sheet.js` | 底部滑出面板 |
| `scorepad.js` | 分数录入面板 |
| `action-views.js` | 业务视图工厂 |
| `back-handler.js` | 浏览器返回处理 |

## ESM 模块依赖

应用使用原生 ES Modules，入口 `index.html` 仅加载：

```html
<script src="https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.core.min.js"></script>
<script type="module" src="./boot.js"></script>
```

`boot.js` 通过 `import/export` 组织依赖：

```text
boot.js
├── app.js (State, UI)
├── actions.js (Actions)
├── action-views.js (ActionViews)
├── modal.js (Modal)
├── scorepad.js (ScorePad)
└── utils.js (Toast 等全局兼容)
```

各模块通过命名导出提供接口：
- `constants.js`: `APP_CONFIG`, `TIMER_DELAY`, `KEYS`, `DEFAULT_ROSTER` 等
- `utils.js`: `LS`, `$`, `Toast`, `ColorUtil`, `IdGenerator`, `Validator` 等
- `app.js`: `State`, `UI`
- `actions.js`: `Actions`
- `modal.js`: `Modal`
- `scorepad.js`: `ScorePad`

## 开发脚本

- `npm run preview`：启动静态预览
- `npm run preview:local`：使用本地脚本启动预览
- `npm run test`：运行单元测试
- `npm run test:watch`：监听模式
- `npm run test:ui`：Vitest UI
- `npm run test:coverage`：覆盖率
- `npm run test:e2e`：E2E 测试
- `npm run test:all`：单测 + E2E

## 适用场景

- 课堂作业即时登记
- 随堂小测提交追踪
- 需要离线、快速、轻量化记录的教学场景

## 技术特点

- 零构建
- 原生 ES Modules 架构
- 纯原生 JavaScript
- 响应式布局
- 本地持久化
- 导入导出能力
- 渐进式渲染

## 相关文档

- [架构文档](docs/architecture.md)
- [API 参考](docs/api-reference.md)
- [迁移指南](docs/migration-guide.md)
- [改进计划](docs/improvement-plan/README.md)
