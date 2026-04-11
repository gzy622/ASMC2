/**
 * 工具函数库入口
 * 统一导出所有工具模块
 */

// DOM 操作工具
export * from './dom.js';

// 格式化工具
export * from './format.js';

// 验证工具
export * from './validate.js';

// 存储工具
export * from './storage.js';

// 动画工具
export * from './animate.js';

// 默认导出所有工具
export { default as dom } from './dom.js';
export { default as format } from './format.js';
export { default as validate } from './validate.js';
export { default as storage } from './storage.js';
export { default as animate } from './animate.js';
