/**
 * 核心模块
 * 负责初始化全局常量和工具函数
 * 
 * 注意：工具函数已迁移至 utils.js
 * 此文件保留以确保向后兼容，实际功能由 utils.js 提供
 */

// 工具函数现在由 utils.js 提供
// 此文件保留以兼容现有代码引用

// 确保全局对象存在（utils.js 会先加载并设置这些）
if (typeof globalThis !== 'undefined') {
    // 如果 utils.js 未加载，提供基本兼容
    if (!globalThis.$) {
        globalThis.$ = id => document.getElementById(id);
    }
    
    // 确保常量全局可用
    if (!globalThis.ANIMATION_DURATION) {
        globalThis.ANIMATION_DURATION = {
            FULL_ENTER: 220,
            FULL_EXIT: 160,
            PAGE_EXIT: 160,
            BOTTOM_SHEET_CLOSE: 260,
            LOADING_MASK_FADE: 90,
            POINTER_GUARD_DEFAULT: 320,
            POINTER_GUARD_FULL: 240,
            POINTER_GUARD_PAGE: 200,
            FOCUS_DELAY_DEFAULT: 60,
            FOCUS_DELAY_INPUT: 180
        };
    }
    
    if (!globalThis.TIMER_DELAY) {
        globalThis.TIMER_DELAY = {
            DRAFT_PERSIST: 1200,
            CARD_META_SAVE: 250,
            SCOREPAD_CLOSE: 120,
            BACK_SIGNAL_DEBOUNCE: 80,
            EXIT_WINDOW: 1500
        };
    }
    
    if (!globalThis.INTERACTION_THRESHOLD) {
        globalThis.INTERACTION_THRESHOLD = {
            DRAG_CLOSE: 80,
            DRAG_MAX_OFFSET: 200
        };
    }
}
