/**
 * 核心常量模块
 * 集中管理应用中的所有常量
 */

// 动画时长常量 (ms)
export const ANIMATION_DURATION = Object.freeze({
    FULL_ENTER: 220,
    FULL_EXIT: 160,
    PAGE_EXIT: 160,
    BOTTOM_SHEET_CLOSE: 260,
    LOADING_MASK_FADE: 90,
    POINTER_GUARD_DEFAULT: 320,
    POINTER_GUARD_FULL: 240,
    POINTER_GUARD_PAGE: 200,
    FOCUS_DELAY_DEFAULT: 60,
    FOCUS_DELAY_INPUT: 180,
    MENU_CLOSE: 160
});

// 定时器延迟常量 (ms)
export const TIMER_DELAY = Object.freeze({
    DRAFT_PERSIST: 1200,
    CARD_META_SAVE: 250,
    SCOREPAD_CLOSE: 120,
    BACK_SIGNAL_DEBOUNCE: 80,
    EXIT_WINDOW: 1500,
    PERSIST: 300
});

// 交互阈值常量
export const INTERACTION_THRESHOLD = Object.freeze({
    DRAG_CLOSE: 80,
    DRAG_MAX_OFFSET: 200,
    LONG_PRESS: 500,
    CLICK_SUPPRESS: 80,
    MOVE_THRESHOLD_X: 10,
    MOVE_THRESHOLD_Y: 8
});

// 虚拟滚动配置
export const VIRTUAL_SCROLL = Object.freeze({
    THRESHOLD: 50,
    BATCH_SIZE: 10
});

// 缓存配置
export const CACHE = Object.freeze({
    MAX_METRICS_SIZE: 50
});

// 网格布局配置
export const GRID = Object.freeze({
    COLS: 5,
    MIN_CELL_SIZE: 18,
    BASE_GAP: 4,
    MAX_GAP: 10
});

// 存储键名
export const STORAGE_KEYS = Object.freeze({
    LIST: 'ac2_list',
    DATA: 'ac2_data',
    ANIM: 'ac2_anim',
    PREFS: 'ac2_prefs',
    DRAFT: 'ac2_draft'
});

// 应用标识
export const APP = Object.freeze({
    NAME_SLUG: 'assignmentcheck2',
    VERSION: '20260411-08'
});

// 默认数据
export const DEFAULTS = Object.freeze({
    ROSTER: ['1 张三', '2 李四', '3 王五', '4 赵六', '5 钱七', '6 孙八', '7 周九', '8 吴十'],
    CARD_COLOR: '#68c490',
    SUBJECT_PRESETS: ['英语', '语文', '数学', '物理', '化学', '其他'],
    COLOR_PRESETS: ['#68c490', '#8ecae6', '#f4a261', '#e9c46a', '#c084fc', '#f28482']
});

// 分数解析正则
export const REGEX = Object.freeze({
    NUMERIC_SCORE: /^-?\d+(?:\.\d+)?$/,
    NO_ENGLISH: /\s*#(?:非英语|非英|no-en|noeng|not-en)\s*$/i
});
