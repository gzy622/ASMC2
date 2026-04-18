/**
 * 常量定义
 * 统一的常量集合，集中管理全应用使用的魔法数字和配置值
 */

if (typeof globalThis !== 'undefined') {
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

    if (!globalThis.CACHE_CONFIG) {
        globalThis.CACHE_CONFIG = {
            MAX_METRICS_CACHE_SIZE: 50
        };
    }

    if (!globalThis.GRID_CONFIG) {
        globalThis.GRID_CONFIG = {
            VIRTUAL_SCROLL_THRESHOLD: 50,
            GRID_COLS: 5,
            MIN_CARD_SIZE: 18,
            MAX_CARD_SIZE: 24,
            BATCH_SIZE: 10
        };
    }

    if (!globalThis.APP_CONFIG) {
        globalThis.APP_CONFIG = {
            DEFAULT_CARD_COLOR: '#68c490',
            PERSIST_DELAY_MS: 300,
            INIT_DELAY_MS: 100,
            UI_READY_DELAY_MS: 200,
            LONG_PRESS_DURATION_MS: 500,
            SUPPRESS_CLICK_DURATION_MS: 80
        };
    }
}