/**
 * 模块系统入口
 * 统一导出所有模块
 */

// 核心模块
export * from './core/index.js';

// 数据层
export * from './data/index.js';

// UI 层
export * from './ui/index.js';

// 默认导出
export { state } from './data/index.js';
export { view } from './ui/index.js';
export { appEvents, Events } from './core/index.js';
