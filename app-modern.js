/**
 * 现代应用入口 (ES6 模块版本)
 * 
 * 此文件使用 ES6 模块系统，提供清晰的架构分层：
 * - 数据层 (data/): 状态管理、存储、模型
 * - 视图层 (ui/): 渲染、交互、DOM 操作
 * - 核心层 (core/): 常量、事件系统
 * 
 * 使用方法:
 * 在 index.html 中:
 * <script type="module" src="app-modern.js"></script>
 */

import { state, view, appEvents, Events } from './modules/index.js';
import { LS } from './modules/data/storage.js';

// 导出到全局（用于调试和兼容性）
if (typeof globalThis !== 'undefined') {
    globalThis.State = state;
    globalThis.UI = view;
    globalThis.AppEvents = appEvents;
    globalThis.AppEventsList = Events;
}

/**
 * 应用初始化
 */
async function initApp() {
    try {
        // 初始化状态
        await state.init();
        
        // 初始化视图
        view.init();
        
        // 绑定全局事件
        window.addEventListener('beforeunload', () => {
            // 确保数据保存
            state._persist?.();
            state._saveDraft?.();
        });
        
        console.log('应用初始化完成 (ES6 模块模式)');
    } catch (err) {
        console.error('应用初始化失败:', err);
        alert('应用初始化失败: ' + (err?.message || '未知错误'));
    }
}

// 启动应用
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}

// 导出主要对象
export { state, view, appEvents, Events };
export default { state, view, appEvents };
