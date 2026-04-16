# 作业登记 AssignmentCheck2

一个轻量化、模块化的课堂作业登记工具，面向教师在课上快速标记作业提交状态和分数。项目无需构建，直接在浏览器中运行，同时保留本地持久化与导入导出能力。

## 功能概览

- **网格化点名登记**：按学号或姓名展示学生卡片，点击即可切换"已完成"状态
- **分数登记模式**：开启"打分"后可逐个录入学生分数，支持快捷键盘输入和整十快速打分
- **多任务管理**：支持新增、切换、重命名、删除任务，并维护任务科目标签
- **名单编辑**：批量编辑学生名单，可为个别学生添加"排除英语"标记
- **小测趋势**：按区间查看全班小测成绩，展示均分、最新分、区间变化与得分轨迹
- **学生概览**：查看每位学生的作业提交统计和分数记录
- **一键反选**：快速反选当前所有学生的完成状态
- **本地持久化**：数据保存在浏览器 `localStorage`，刷新页面后仍可恢复
- **备份导入导出**：支持导出为 JSON、Excel、文本格式，导入时校验数据结构后覆盖现有数据
- **动画开关**：可切换界面动画效果，适配低性能设备
- **卡片颜色**：支持自定义卡片颜色主题

## 快速开始

### 本地预览

**方式一：直接打开**
直接在浏览器中打开 `index.html` 即可使用。

**方式二：使用预览服务器（推荐）**

```bash
# 使用 http-server（需 Node.js）
npm run preview
# 访问 http://localhost:3000

# 或使用本地脚本（Linux/Mac）
npm run preview:local
# 支持 Python 内置服务器，自动检测端口占用
```

### 运行测试

安装依赖：

```bash
npm install
npx playwright install chromium
```

## 测试

```bash
# 单元测试
npm run test

# 端到端测试
npm run test:e2e

# 全量测试
npm run test:all

# 覆盖率
npm run test:coverage
```

## 项目结构

```text
.
├── index.html              # 应用入口
├── css/                    # 样式文件（模块化）
│   ├── index.css           # 样式入口
│   ├── base.css            # 基础样式、CSS 变量
│   ├── components.css      # 通用组件样式
│   ├── assignment.css      # 作业相关样式
│   ├── roster.css          # 名单相关样式
│   ├── modal.css           # 弹窗样式
│   ├── bottom-sheet.css    # 底部面板样式
│   ├── scorepad.css        # 分数录入面板样式
│   ├── overview.css        # 概览页面样式
│   ├── trend.css           # 趋势分析样式
│   ├── animations.css      # 动画定义
│   └── responsive.css      # 响应式布局
├── modules/                # ES6 模块系统（新架构）
│   ├── core/               # 核心层
│   │   ├── constants.js    # 常量定义
│   │   ├── events.js       # 事件系统
│   │   └── index.js        # 模块入口
│   ├── data/               # 数据层
│   │   ├── storage.js      # 存储适配器
│   │   ├── models.js       # 数据模型
│   │   ├── state.js        # 状态管理
│   │   └── index.js        # 模块入口
│   ├── ui/                 # 表现层
│   │   ├── renderer.js     # 渲染器
│   │   ├── interactions.js # 交互处理器
│   │   ├── view.js         # 主视图
│   │   └── index.js        # 模块入口
│   └── index.js            # 总入口
├── utils/                  # 工具函数
│   ├── index.js            # 工具入口
│   ├── dom.js              # DOM 操作
│   ├── storage.js          # 存储工具
│   ├── validate.js         # 数据验证
│   ├── format.js           # 格式化工具
│   └── animate.js          # 动画工具
├── tests/                  # 测试文件
│   ├── *.test.js           # 单元测试
│   ├── *.spec.js           # E2E 测试
│   └── setup.js            # 测试环境初始化
├── scripts/
│   └── preview.sh          # 本地预览服务器脚本（Python）
├── docs/                   # 文档
│   ├── architecture.md     # 架构文档
│   ├── api-reference.md    # API 参考
│   ├── migration-guide.md  # 迁移指南
│   └── improvement-plan/   # 改进计划
├── package.json            # 项目配置
├── playwright.config.js    # E2E 测试配置
├── vitest.config.js        # 单元测试配置
└── AGENTS.md               # 智能体协作规范
```

## 文件说明

### 核心文件

| 文件           | 说明                                                  |
| ------------ | --------------------------------------------------- |
| `index.html` | 应用主页面，包含页面结构和模块引用                                   |
| `app.js`     | 状态管理 `State` 和 UI 渲染 `UI`，包含名单解析、任务管理、数据持久化         |
| `actions.js` | 业务操作中心：作业管理、名单编辑、导入导出、小测趋势、学生概览                     |
| `core.js`    | 基础工具：DOM 选择器、localStorage 封装、设备检测、颜色工具、ID 生成器、数据验证器 |
| `utils.js`   | 通用工具函数                                              |

### UI 组件

| 文件                | 说明                   |
| ----------------- | -------------------- |
| `modal.js`        | 弹窗组件，支持全屏/页面模式、渐进式渲染 |
| `bottom-sheet.js` | 底部滑出面板，支持拖拽关闭        |
| `scorepad.js`     | 分数录入面板，支持数字键盘和整十快速模式 |
| `action-views.js` | 视图生成工厂，提供弹窗/面板的骨架结构  |

### 其他

| 文件                  | 说明                  |
| ------------------- | ------------------- |
| `back-handler.js`   | 浏览器返回键处理，实现"再按一次退出" |
| `boot.js`           | 应用启动脚本，初始化各模块       |
| `app-modern.js`     | 基于 ES6 模块的新版本应用入口   |
| `modules-compat.js` | 模块系统兼容层，支持渐进迁移      |

### CSS 模块

| 文件                     | 说明               |
| ---------------------- | ---------------- |
| `css/index.css`        | 样式入口，导入所有其他样式    |
| `css/base.css`         | CSS 变量、基础样式、重置样式 |
| `css/components.css`   | 按钮、徽章、下拉菜单等通用组件  |
| `css/assignment.css`   | 作业卡片、网格布局        |
| `css/roster.css`       | 名单编辑相关样式         |
| `css/modal.css`        | 弹窗、对话框样式         |
| `css/bottom-sheet.css` | 底部面板样式           |
| `css/scorepad.css`     | 分数录入面板样式         |
| `css/overview.css`     | 学生概览页面样式         |
| `css/trend.css`        | 小测趋势分析样式         |
| `css/animations.css`   | 动画关键帧和过渡效果       |
| `css/responsive.css`   | 响应式断点和适配         |

### ES6 模块系统

详见 [架构文档](docs/architecture.md) 和 [迁移指南](docs/migration-guide.md)。

| 模块              | 说明                |
| --------------- | ----------------- |
| `modules/core/` | 核心层：常量、事件系统       |
| `modules/data/` | 数据层：模型、状态管理、存储适配器 |
| `modules/ui/`   | 表现层：渲染器、交互处理器、视图  |

## 模块依赖

```
index.html
    ├── css/index.css
    ├── utils.js（工具函数）
    ├── core.js（基础工具，无依赖）
    ├── back-handler.js → core.js
    ├── modal.js → core.js
    ├── bottom-sheet.js → core.js
    ├── scorepad.js → core.js, app.js
    ├── app.js → core.js, modal.js, back-handler.js
    ├── action-views.js → modal.js
    ├── actions.js → core.js, app.js, modal.js, bottom-sheet.js, scorepad.js
    └── boot.js（初始化所有模块）
```

## 适用场景

- 课堂作业即时登记
- 随堂小测提交追踪
- 需要离线、快速、轻量化记录的教学场景

## 技术特点

- **零构建**：纯原生 JavaScript，无需打包工具
- **模块化**：按功能拆分模块，职责清晰
- **响应式**：适配桌面和移动端
- **渐进式渲染**：大数据量时分块渲染，避免阻塞主线程
- **数据持久化**：localStorage 自动保存，支持导入导出
- **ES6 模块支持**：新架构采用分层设计，支持渐进式迁移

## 版本信息

当前版本：`20260416-01`

## 相关文档

- [架构文档](docs/architecture.md) - 应用架构设计
- [API 参考](docs/api-reference.md) - ES6 模块 API 文档
- [迁移指南](docs/migration-guide.md) - 从传统脚本迁移到模块系统
- [改进计划](docs/improvement-plan/README.md) - 项目演进路线图

