# 完成 ASMC2 原生 ES Modules 迁移计划

## Summary

目标是把当前项目从"传统全局脚本 + 未接入模块化产物"的中间态，收敛为单一的原生 ES Modules 架构。迁移基线采用当前已通过测试的生产链，不直接启用现有 `modules/`，因为它的存储键、默认数据和 API 覆盖与当前入口不兼容。

运行方式改为零构建但需要 HTTP 静态服务：`npm run preview` / `npm run preview:local`。不再把 `file://index.html` 作为受支持入口。

## Key Changes

- 将当前生产文件转换为原生 ESM：`constants.js`、`utils.js`、`back-handler.js`、`modal.js`、`bottom-sheet.js`、`scorepad.js`、`app.js`、`action-views.js`、`actions.js`、`boot.js`。
- `index.html` 保留 XLSX CDN 普通脚本，然后只加载一个入口：
  ```html
  <script type="module" src="./boot.js"></script>
  ```
- 每个核心文件提供命名导出，例如 `State`、`UI`、`Actions`、`Modal`、`ScorePad`、`BackHandler`、`ActionViews`、`Toast`、`LS`、`KEYS`。
- 暂保留 `globalThis` 兼容桥，供现有测试、E2E、浏览器控制台和旧调用继续工作；主架构以 `import/export` 为准。
- 不改 `localStorage` 键名，继续使用 `tracker_db`、`tracker_roster`、`tracker_anim`、`tracker_prefs`、`tracker_recovery_draft`、`tracker_scorepad_fast_ten`。
- 删除或移除入口引用中的过期迁移产物：`app-modular.js`、`module-loader.js`、`tests/setup-modular.js`、当前不接入的 `modules/`。
- 更新 `README.md`、`docs/architecture.md`、`docs/api-reference.md`、`docs/migration-guide.md`、`AGENTS.md`，明确当前唯一架构是原生 ESM + 静态服务。

## Implementation Plan

### Phase 1: 测试基线与入口保护
- [ ] 记录当前 `npm run test` 通过状态
- [ ] 新增/调整入口测试，断言 `index.html` 只包含一个本地 `type="module"` 入口且不再包含传统脚本链注释
- [ ] 更新 `tests/setup.js` 为 ESM 动态导入模式

### Phase 2: 基础层迁移
- [ ] 转换 `constants.js` 为命名导出
- [ ] 转换 `utils.js` 为命名导出，保留 `globalThis` 兼容桥
- [ ] 确保 `utils.test.js` 不改语义通过

### Phase 3: 组件层迁移
- [ ] 转换 `back-handler.js`，显式导入所需工具
- [ ] 转换 `modal.js`，显式导入所需工具
- [ ] 转换 `bottom-sheet.js`，显式导入所需工具
- [ ] 转换 `scorepad.js`，显式导入所需工具
- [ ] 移除组件间隐式加载顺序依赖

### Phase 4: 业务层迁移
- [ ] 转换 `app.js`，保持 `State`/`UI` API 不变
- [ ] 转换 `action-views.js`，显式导入依赖
- [ ] 转换 `actions.js`，显式导入依赖
- [ ] 确保业务逻辑与数据流不变

### Phase 5: 启动层迁移
- [ ] 转换 `boot.js` 为 ESM 入口
- [ ] 导出 `bootstrapApp()` 函数
- [ ] 浏览器入口自动执行 `State.init(); UI.init();`

### Phase 6: 测试与 E2E 更新
- [ ] 更新 `tests/setup.js` 支持 ESM 动态导入
- [ ] 更新 Playwright 配置使用 HTTP 预览服务
- [ ] E2E 测试改用 `baseURL` 而非 `file://`
- [ ] 验证 `npm run test` 通过
- [ ] 验证 `npm run test:e2e` 通过

### Phase 7: 清理与文档
- [ ] 删除 `app-modular.js`
- [ ] 删除 `module-loader.js`
- [ ] 删除 `tests/setup-modular.js`
- [ ] 移除或归档未接入的 `modules/` 目录
- [ ] 更新 `README.md` 说明新的运行方式
- [ ] 更新 `docs/architecture.md` 描述 ESM 架构
- [ ] 更新 `docs/api-reference.md` 导出接口说明
- [ ] 更新 `docs/migration-guide.md` 迁移步骤
- [ ] 更新 `AGENTS.md` 快速开始指引

### Phase 8: 验证
- [ ] 手工 HTTP 检查：启动 `npm run preview`，确认首页、`/boot.js`、核心模块文件返回 200
- [ ] 浏览器手检：菜单打开、作业切换、卡片标记、打分面板、导入备份、导出 JSON/Excel、小测趋势、学生概览
- [ ] 兼容检查：用旧 `tracker_*` 本地数据启动，确认名单、作业、偏好、草稿仍可读取
- [ ] 运行完整验证：`npm run test:all`

## Test Plan

- 单元/集成：`npm run test`
- E2E：`npm run test:e2e`
- 完整验证：`npm run test:all`
- 手工 HTTP 检查：启动 `npm run preview`，确认首页、`/boot.js`、核心模块文件返回 200。
- 浏览器手检：菜单打开、作业切换、卡片标记、打分面板、导入备份、导出 JSON/Excel、小测趋势、学生概览。
- 兼容检查：用旧 `tracker_*` 本地数据启动，确认名单、作业、偏好、草稿仍可读取。

## Assumptions

- 接受原生 ES Modules 需要 HTTP 静态服务，不再保证双击 `index.html` 的 `file://` 运行方式。
- 本次只做架构收敛，不主动引入 Vite、打包流程、后端或新状态管理库。
- 现有 `modules/` 不作为迁移基础；它是过期迁移产物，删除优先于修补。
- 传统全局对象会作为兼容桥暂留，但不再作为主架构文档化。
