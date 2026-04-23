# 作业登记 AssignmentCheck2

一个轻量化、零构建的课堂作业登记工具。默认通过 `index.html` 直接运行，支持本地持久化、导入导出、趋势分析、学生概览和整十快捷打分。

## 版本信息

- 当前菜单版本：`20260423-04`
- 入口：`index.html`
- 默认运行方式：传统 `<script>` 顺序加载
- 模块化入口：`app-modular.js`
- 模块总入口：`modules/index.js`

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

### 直接打开

直接在浏览器中打开 `index.html` 即可使用。

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
├── index.html
├── app.js
├── actions.js
├── action-views.js
├── app-modular.js
├── back-handler.js
├── boot.js
├── bottom-sheet.js
├── constants.js
├── core.js
├── modal.js
├── module-loader.js
├── scorepad.js
├── utils.js
├── css/
│   ├── index.css
│   ├── base.css
│   ├── components.css
│   ├── assignment.css
│   ├── roster.css
│   ├── modal.css
│   ├── bottom-sheet.css
│   ├── scorepad.css
│   ├── overview.css
│   ├── trend.css
│   ├── animations.css
│   └── responsive.css
├── modules/
│   ├── core/
│   │   ├── constants.js
│   │   ├── events.js
│   │   └── index.js
│   ├── data/
│   │   ├── storage.js
│   │   ├── models.js
│   │   ├── state.js
│   │   └── index.js
│   ├── ui/
│   │   ├── renderer.js
│   │   ├── interactions.js
│   │   ├── view.js
│   │   └── index.js
│   └── index.js
├── utils/
│   ├── index.js
│   ├── dom.js
│   ├── storage.js
│   ├── validate.js
│   ├── format.js
│   └── animate.js
├── tests/
├── scripts/
│   └── preview.sh
├── docs/
│   ├── architecture.md
│   ├── api-reference.md
│   ├── migration-guide.md
│   └── improvement-plan/
├── assets/
│   └── fonts/
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

## 模块化实现

仓库保留一套 ES6 模块实现，目录如下：

- `modules/core/`：常量与事件总线
- `modules/data/`：存储、模型、状态
- `modules/ui/`：渲染、交互、视图

模块化入口为 `app-modular.js`，总入口为 `modules/index.js`。

## 模块依赖

默认页面的脚本加载顺序如下：

```text
index.html
├── constants.js
├── utils.js
├── core.js
├── back-handler.js
├── modal.js
├── bottom-sheet.js
├── scorepad.js
├── app.js
├── action-views.js
├── actions.js
└── boot.js
```

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
- 纯原生 JavaScript
- 响应式布局
- 本地持久化
- 导入导出能力
- 渐进式渲染
- 传统脚本与模块化实现并存

## 相关文档

- [架构文档](docs/architecture.md)
- [API 参考](docs/api-reference.md)
- [迁移指南](docs/migration-guide.md)
- [改进计划](docs/improvement-plan/README.md)
