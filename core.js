const $ = id => document.getElementById(id);

const LS = {
    _log(action, key, err) {
        const msg = `[LS.${action}] key=${key}${err ? ` error=${err.message}` : ''}`;
        if (err || action === 'get') console.warn(msg);
    },
    get(k, d) {
        const raw = localStorage.getItem(k);
        if (raw == null) {
            return d;
        }
        try {
            const val = JSON.parse(raw);
            return val;
        } catch (err) {
            this._log('get', k, err);
            return d;
        }
    },
    set(k, v) {
        try {
            const nextRaw = JSON.stringify(v);
            if (localStorage.getItem(k) === nextRaw) return;
            localStorage.setItem(k, nextRaw);
        } catch (err) {
            this._log('set', k, err);
        }
    }
};

const KEYS = { DATA: 'tracker_db', LIST: 'tracker_roster', ANIM: 'tracker_anim', PREFS: 'tracker_prefs', DRAFT: 'tracker_recovery_draft', SCOREPAD_FAST_TEN: 'tracker_scorepad_fast_ten' };
const SUBJECT_PRESETS = ['英语', '语文', '数学', '物理', '化学', '其他'];

/**
 * 动画时长常量（单位：毫秒）
 * 集中管理所有动画时间，便于统一调整和维护
 */
const ANIMATION_DURATION = {
    // 弹窗动画
    FULL_ENTER: 220,        // 全屏弹窗进入动画时长
    FULL_EXIT: 160,         // 全屏弹窗退出动画时长
    PAGE_EXIT: 160,         // 页面弹窗退出动画时长
    // 底部面板动画
    BOTTOM_SHEET_CLOSE: 260, // 底部面板关闭动画时长
    // 遮罩与过渡
    LOADING_MASK_FADE: 90,  // 加载遮罩淡入淡出时长
    // 指针保护（防止动画期间误操作）
    POINTER_GUARD_DEFAULT: 320,   // 默认指针保护时长
    POINTER_GUARD_FULL: 240,      // 全屏弹窗指针保护时长
    POINTER_GUARD_PAGE: 200,      // 页面弹窗指针保护时长
    // 焦点管理
    FOCUS_DELAY_DEFAULT: 60,      // 默认焦点延迟
    FOCUS_DELAY_INPUT: 180        // 输入框焦点延迟（Android Firefox 需要更长时间）
};

/**
 * 定时器延迟常量（单位：毫秒）
 */
const TIMER_DELAY = {
    DRAFT_PERSIST: 1200,    // 草稿持久化延迟
    CARD_META_SAVE: 250,    // 卡片元数据保存延迟
    SCOREPAD_CLOSE: 120,    // 分数面板关闭延迟
    BACK_SIGNAL_DEBOUNCE: 80,   // 返回信号防抖时间
    EXIT_WINDOW: 1500       // 退出窗口时间（连按两次返回退出）
};

/**
 * 手势与交互阈值
 */
const INTERACTION_THRESHOLD = {
    DRAG_CLOSE: 80,         // 拖拽关闭阈值（超过此值触发关闭）
    DRAG_MAX_OFFSET: 200    // 最大拖拽偏移量
};

// 在全局作用域中暴露常量，确保测试环境和其他模块可以访问
if (typeof globalThis !== 'undefined') {
    globalThis.ANIMATION_DURATION = ANIMATION_DURATION;
    globalThis.TIMER_DELAY = TIMER_DELAY;
    globalThis.INTERACTION_THRESHOLD = INTERACTION_THRESHOLD;
}
const Device = {
    isAndroid() {
        return /Android/i.test(navigator.userAgent);
    },
    isFirefox() {
        return /Firefox/i.test(navigator.userAgent);
    },
    isCoarsePointer() {
        if (typeof window.matchMedia === 'function') return window.matchMedia('(pointer: coarse)').matches;
        return 'ontouchstart' in window || Number(navigator.maxTouchPoints) > 0;
    }
};

const IS_ANDROID_FIREFOX = Device.isAndroid() && Device.isFirefox();
const CARD_COLOR_PRESETS = ['#68c490', '#8ecae6', '#f4a261', '#e9c46a', '#c084fc', '#f28482'];
const APP_NAME_SLUG = 'assignmentcheck2';
const DEFAULT_ROSTER = [
    '01 蓝慧婷', '02 陈静', '03 李智豪', '04 朱佑豪', '05 张伟芬',
    '06 许俊熠', '07 李凤君', '08 黄文涛', '09 黄泺绮', '10 利子见',
    '11 蔡嘉乐', '12 刘静娴', '13 蓝烽', '14 张思琪', '15 卢佳慧',
    '16 钟佳渝', '17 叶帆', '18 吴梦婷', '19 彭文佳', '20 吴思静',
    '21 刘嘉莹', '22 温秋茹', '23 李乐', '24 温沁钰', '25 林思婷',
    '26 巫依霞', '27 刘雅淇', '28 侯润楹', '29 叶塘美', '30 黄宇凡',
    '31 叶煌', '32 张清雅', '33 杨梓豪', '34 王政铭', '35 陈圆',
    '36 刘斌', '37 丘雅莹', '38 罗燕', '39 何苑琦', '40 赵玉婷',
    '41 曾宝茹', '42 张栩瑜', '43 李孝霖', '44 杨欢', '45 彭嘉红',
    '46 丘瑜诗', '47 李欣', '48 吴嘉钰', '49 刘依婷', '50 曾誉宸'
];

const ColorUtil = {
    clamp(v, min = 0, max = 255) { return Math.max(min, Math.min(max, Math.round(v))); },
    normalizeHex(hex, fallback = '#68c490') {
        return this.rgbToHex(this.hexToRgb(hex, fallback));
    },
    hexToRgb(hex, fallback = '#68c490') {
        const raw = String(hex || '').trim().replace(/^#/, '').toLowerCase();
        let r, g, b;
        if (raw.length === 3) {
            [r, g, b] = [0, 1, 2].map(i => parseInt(raw[i] + raw[i], 16));
        } else if (raw.length === 6) {
            [r, g, b] = [0, 2, 4].map(i => parseInt(raw.slice(i, i + 2), 16));
        } else {
            const fb = this.hexToRgb(fallback, '#68c490');
            return fb;
        }
        return isNaN(r) || isNaN(g) || isNaN(b) ? this.hexToRgb(fallback, '#68c490') : { r, g, b };
    },
    rgbToHex({ r, g, b }) {
        return `#${[r, g, b].map(v => this.clamp(v).toString(16).padStart(2, '0')).join('')}`;
    },
    mix(hexA, hexB, ratio) {
        const a = this.hexToRgb(hexA), b = this.hexToRgb(hexB);
        const t = Math.max(0, Math.min(1, Number(ratio) || 0));
        return this.rgbToHex({
            r: a.r + (b.r - a.r) * t,
            g: a.g + (b.g - a.g) * t,
            b: a.b + (b.b - a.b) * t
        });
    },
    withAlpha(hex, alpha) {
        const { r, g, b } = this.hexToRgb(hex);
        return `rgba(${r}, ${g}, ${b}, ${Math.max(0, Math.min(1, Number(alpha) || 0))})`;
    },
    luminance(hex) {
        const { r, g, b } = this.hexToRgb(hex);
        const toLinear = c => {
            const v = c / 255;
            return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
        };
        return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
    }
};

const formatBackupFileName = (date = new Date()) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    const hh = String(date.getHours()).padStart(2, '0');
    const mm = String(date.getMinutes()).padStart(2, '0');
    const ss = String(date.getSeconds()).padStart(2, '0');
    return `${APP_NAME_SLUG}_backup_${y}${m}${d}_${hh}${mm}${ss}.json`;
};

// ID 生成器工具类
const IdGenerator = {
    _lastId: 0,

    // 生成唯一 ID（基于时间戳，确保递增）
    generate() {
        const now = Date.now();
        this._lastId = Math.max(now, this._lastId + 1);
        return this._lastId;
    },

    // 生成唯一 ID，并检查是否存在于给定的集合中
    generateUnique(existsCheck) {
        let id = this.generate();
        while (existsCheck(id)) {
            id = this.generate();
        }
        return id;
    },

    // 重置内部状态（仅用于测试）
    reset() {
        this._lastId = 0;
    },

    // 获取下一个可能的 ID（不增加计数器）
    peek() {
        return Math.max(Date.now(), this._lastId + 1);
    }
};

/**
 * 数据验证工具类
 * 统一处理各种数据验证逻辑，减少代码重复
 */
const Validator = {
    /**
     * 验证是否为有效的对象
     * @param {*} value - 要验证的值
     * @returns {boolean}
     */
    isValidObject(value) {
        return value !== null && typeof value === 'object';
    },

    /**
     * 验证是否为有效的数组
     * @param {*} value - 要验证的值
     * @returns {boolean}
     */
    isValidArray(value) {
        return Array.isArray(value);
    },

    /**
     * 验证是否为非空字符串
     * @param {*} value - 要验证的值
     * @returns {boolean}
     */
    isNonEmptyString(value) {
        return typeof value === 'string' && value.trim().length > 0;
    },

    /**
     * 验证是否为有效的数字
     * @param {*} value - 要验证的值
     * @returns {boolean}
     */
    isValidNumber(value) {
        return typeof value === 'number' && Number.isFinite(value);
    },

    /**
     * 验证存储数据的基本结构
     * @param {*} data - 要验证的数据
     * @param {string[]} requiredArrays - 必需的数组字段名
     * @returns {boolean}
     */
    validateStorageData(data, requiredArrays = []) {
        if (!this.isValidObject(data)) {
            return false;
        }
        for (const key of requiredArrays) {
            if (!this.isValidArray(data[key])) {
                return false;
            }
        }
        return true;
    },

    /**
     * 验证导入/恢复数据格式
     * @param {*} data - 要验证的数据
     * @returns {boolean}
     */
    isValidImportData(data) {
        return this.validateStorageData(data, ['list', 'data']);
    },

    /**
     * 验证恢复草稿数据格式
     * @param {*} draft - 要验证的草稿数据
     * @returns {boolean}
     */
    isValidRecoveryDraft(draft) {
        return this.validateStorageData(draft, ['list', 'data']);
    },

    /**
     * 验证学生ID格式（两位数字）
     * @param {*} id - 要验证的ID
     * @returns {boolean}
     */
    isValidStudentId(id) {
        return this.isNonEmptyString(id) && /^\d{2}$/.test(id);
    },

    /**
     * 验证任务对象的基本结构
     * @param {*} asg - 要验证的任务对象
     * @returns {boolean}
     */
    isValidAssignment(asg) {
        return this.isValidObject(asg) &&
               this.isValidNumber(asg.id) &&
               this.isNonEmptyString(asg.name);
    }
};

globalThis.Device = Device;

const Toast = {
    el: null,
    timer: 0,
    init() { this.el = $('toast'); },
    show(msg, ms = 1500) {
        if (!this.el) return;
        this.el.textContent = msg;
        this.el.classList.add('show');
        clearTimeout(this.timer);
        this.timer = setTimeout(() => this.el.classList.remove('show'), ms);
    }
};

Object.assign(globalThis, {
    $,
    LS,
    KEYS,
    SUBJECT_PRESETS,
    DEFAULT_ROSTER,
    IS_ANDROID_FIREFOX,
    CARD_COLOR_PRESETS,
    APP_NAME_SLUG,
    ColorUtil,
    formatBackupFileName,
    IdGenerator,
    Validator,
    Toast
});
