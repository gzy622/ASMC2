/**
 * 模块化应用入口
 * 
 * 使用 ModuleLoader 解决"脚本顺序 + 全局对象"强依赖问题
 * 
 * 特点：
 * 1. 显式声明模块依赖关系
 * 2. 异步加载，错误可追踪
 * 3. 保持向后兼容，全局对象仍然可用
 */

// 定义工具模块
ModuleLoader.define('utils', [], () => {
    // DOM 操作工具
    const $ = id => document.getElementById(id);
    const qs = (selector, parent = document) => parent.querySelector(selector);
    const qsa = (selector, parent = document) => parent.querySelectorAll(selector);
    const createEl = (tag, attrs = {}, text = '') => {
        const el = document.createElement(tag);
        Object.entries(attrs).forEach(([key, value]) => {
            if (key === 'className') {
                el.className = value;
            } else if (key === 'dataset') {
                Object.assign(el.dataset, value);
            } else if (key.startsWith('on') && typeof value === 'function') {
                el.addEventListener(key.slice(2).toLowerCase(), value);
            } else {
                el.setAttribute(key, value);
            }
        });
        if (text) el.textContent = text;
        return el;
    };

    // 格式化工具
    const APP_NAME_SLUG = 'assignmentcheck2';
    const CARD_COLOR_PRESETS = ['#68c490', '#8ecae6', '#f4a261', '#e9c46a', '#c084fc', '#f28482'];
    const SUBJECT_PRESETS = ['英语', '语文', '数学', '物理', '化学', '其他'];
    const clamp = (v, min = 0, max = 255) => Math.max(min, Math.min(max, Math.round(v)));
    const formatBackupFileName = (date = new Date()) => {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        const hh = String(date.getHours()).padStart(2, '0');
        const mm = String(date.getMinutes()).padStart(2, '0');
        const ss = String(date.getSeconds()).padStart(2, '0');
        return `${APP_NAME_SLUG}_backup_${y}${m}${d}_${hh}${mm}${ss}.json`;
    };

    // 颜色工具
    const ColorUtil = {
        clamp(v, min = 0, max = 255) {
            return Math.max(min, Math.min(max, Math.round(v)));
        },
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
                return this.hexToRgb(fallback, '#68c490');
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

    // ID 生成器
    const IdGenerator = {
        _lastId: 0,
        generate() {
            const now = Date.now();
            this._lastId = Math.max(now, this._lastId + 1);
            return this._lastId;
        },
        generateUnique(existsCheck) {
            let id = this.generate();
            while (existsCheck(id)) {
                id = this.generate();
            }
            return id;
        },
        reset() {
            this._lastId = 0;
        },
        peek() {
            return Math.max(Date.now(), this._lastId + 1);
        }
    };

    // 验证工具
    const isValidObject = (value) => value !== null && typeof value === 'object';
    const isValidArray = (value) => Array.isArray(value);
    const isNonEmptyString = (value) => typeof value === 'string' && value.trim().length > 0;
    const isValidNumber = (value) => typeof value === 'number' && Number.isFinite(value);
    const validateStorageData = (data, requiredArrays = []) => {
        if (!isValidObject(data)) return false;
        for (const key of requiredArrays) {
            if (!isValidArray(data[key])) return false;
        }
        return true;
    };
    const isValidImportData = (data) => validateStorageData(data, ['list', 'data']);
    const isValidRecoveryDraft = (draft) => validateStorageData(draft, ['list', 'data']);
    const isValidStudentId = (id) => isNonEmptyString(id) && /^\d{2}$/.test(id);
    const isValidAssignment = (asg) => isValidObject(asg) && isValidNumber(asg.id) && isNonEmptyString(asg.name);
    const Validator = {
        isValidObject, isValidArray, isNonEmptyString, isValidNumber,
        validateStorageData, isValidImportData, isValidRecoveryDraft,
        isValidStudentId, isValidAssignment
    };

    // 存储工具
    const KEYS = {
        DATA: 'tracker_db',
        LIST: 'tracker_roster',
        ANIM: 'tracker_anim',
        PREFS: 'tracker_prefs',
        DRAFT: 'tracker_recovery_draft',
        SCOREPAD_FAST_TEN: 'tracker_scorepad_fast_ten'
    };
    const LS = {
        _log(action, key, err) {
            const msg = `[LS.${action}] key=${key}${err ? ` error=${err.message}` : ''}`;
            if (err || action === 'get') console.warn(msg);
        },
        get(k, d) {
            const raw = localStorage.getItem(k);
            if (raw == null) return d;
            try {
                return JSON.parse(raw);
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
        },
        remove(k) {
            try {
                localStorage.removeItem(k);
            } catch (err) {
                this._log('remove', k, err);
            }
        }
    };

    // 动画常量
    const ANIMATION_DURATION = {
        FULL_ENTER: 220, FULL_EXIT: 160, PAGE_EXIT: 160,
        BOTTOM_SHEET_CLOSE: 260, LOADING_MASK_FADE: 90,
        POINTER_GUARD_DEFAULT: 320, POINTER_GUARD_FULL: 240,
        POINTER_GUARD_PAGE: 200, FOCUS_DELAY_DEFAULT: 60,
        FOCUS_DELAY_INPUT: 180
    };
    const TIMER_DELAY = {
        DRAFT_PERSIST: 1200, CARD_META_SAVE: 250,
        SCOREPAD_CLOSE: 120, BACK_SIGNAL_DEBOUNCE: 80, EXIT_WINDOW: 1500
    };
    const INTERACTION_THRESHOLD = { DRAG_CLOSE: 80, DRAG_MAX_OFFSET: 200 };

    // 设备检测
    const Device = {
        isAndroid() { return /Android/i.test(navigator.userAgent); },
        isFirefox() { return /Firefox/i.test(navigator.userAgent); },
        isCoarsePointer() {
            if (typeof window.matchMedia === 'function') {
                return window.matchMedia('(pointer: coarse)').matches;
            }
            return 'ontouchstart' in window || Number(navigator.maxTouchPoints) > 0;
        }
    };
    const IS_ANDROID_FIREFOX = Device.isAndroid() && Device.isFirefox();

    // 动画工具
    const nextFrame = callback => requestAnimationFrame(callback);
    const cancelFrame = id => cancelAnimationFrame(id);

    // Toast
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

    // 默认名单
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

    const exports = {
        $, qs, qsa, createEl,
        APP_NAME_SLUG, CARD_COLOR_PRESETS, SUBJECT_PRESETS, clamp, formatBackupFileName,
        ColorUtil, IdGenerator,
        isValidObject, isValidArray, isNonEmptyString, isValidNumber,
        validateStorageData, isValidImportData, isValidRecoveryDraft,
        isValidStudentId, isValidAssignment, Validator,
        KEYS, LS,
        ANIMATION_DURATION, TIMER_DELAY, INTERACTION_THRESHOLD,
        Device, IS_ANDROID_FIREFOX, nextFrame, cancelFrame,
        Toast, DEFAULT_ROSTER
    };

    // 同时暴露到全局以保持兼容
    Object.assign(globalThis, exports);

    return exports;
});

// 定义核心模块（向后兼容层）
ModuleLoader.define('core', ['utils'], (utils) => {
    // core.js 现在主要是兼容层，实际功能在 utils 中
    return { ...utils };
});

// 定义 back-handler 模块
ModuleLoader.define('back-handler', ['utils'], (utils) => {
    // 如果全局已存在 BackHandler，直接返回
    if (typeof BackHandler !== 'undefined') {
        return BackHandler;
    }
    // 否则返回一个占位符，等待实际脚本加载
    return null;
});

// 定义 modal 模块
ModuleLoader.define('modal', ['utils', 'back-handler'], (utils, backHandler) => {
    if (typeof Modal !== 'undefined') {
        return Modal;
    }
    return null;
});

// 定义 bottom-sheet 模块
ModuleLoader.define('bottom-sheet', ['utils'], (utils) => {
    if (typeof BottomSheet !== 'undefined') {
        return BottomSheet;
    }
    return null;
});

// 定义 scorepad 模块
ModuleLoader.define('scorepad', ['utils'], (utils) => {
    if (typeof ScorePad !== 'undefined') {
        return ScorePad;
    }
    return null;
});

// 定义 app 模块（状态管理）
ModuleLoader.define('app', ['utils'], (utils) => {
    if (typeof State !== 'undefined' && typeof UI !== 'undefined') {
        return { State, UI };
    }
    return null;
});

// 定义 action-views 模块
ModuleLoader.define('action-views', ['utils'], (utils) => {
    if (typeof ActionViews !== 'undefined') {
        return ActionViews;
    }
    return null;
});

// 定义 actions 模块
ModuleLoader.define('actions', ['utils', 'app', 'modal', 'bottom-sheet', 'scorepad', 'action-views'], 
    (utils, app, modal, bottomSheet, scorepad, actionViews) => {
        if (typeof Actions !== 'undefined') {
            return Actions;
        }
        return null;
    }
);

// 应用初始化
async function initModularApp() {
    try {
        console.log('[AppModular] Starting initialization...');

        // 按顺序加载模块
        const utils = await ModuleLoader.load('utils');
        console.log('[AppModular] Utils loaded');

        // 等待传统脚本加载完成（通过检查全局对象）
        await waitForGlobal('BackHandler', 5000);
        const backHandler = await ModuleLoader.load('back-handler');
        console.log('[AppModular] BackHandler ready');

        await waitForGlobal('Modal', 5000);
        const modal = await ModuleLoader.load('modal');
        console.log('[AppModular] Modal ready');

        await waitForGlobal('BottomSheet', 5000);
        const bottomSheet = await ModuleLoader.load('bottom-sheet');
        console.log('[AppModular] BottomSheet ready');

        await waitForGlobal('ScorePad', 5000);
        const scorepad = await ModuleLoader.load('scorepad');
        console.log('[AppModular] ScorePad ready');

        await waitForGlobal('State', 5000);
        await waitForGlobal('UI', 5000);
        const app = await ModuleLoader.load('app');
        console.log('[AppModular] App ready');

        await waitForGlobal('ActionViews', 5000);
        const actionViews = await ModuleLoader.load('action-views');
        console.log('[AppModular] ActionViews ready');

        await waitForGlobal('Actions', 5000);
        const actions = await ModuleLoader.load('actions');
        console.log('[AppModular] Actions ready');

        // 初始化 Toast
        utils.Toast.init();

        console.log('[AppModular] All modules loaded successfully');

        // 触发模块就绪事件
        if (typeof Event !== 'undefined') {
            window.dispatchEvent(new CustomEvent('app:modules-ready', {
                detail: { utils, backHandler, modal, bottomSheet, scorepad, app, actionViews, actions }
            }));
        }

        return { utils, backHandler, modal, bottomSheet, scorepad, app, actionViews, actions };

    } catch (err) {
        console.error('[AppModular] Initialization failed:', err);
        throw err;
    }
}

/**
 * 等待全局对象可用
 * @param {string} name - 全局对象名
 * @param {number} timeout - 超时时间（毫秒）
 * @returns {Promise<void>}
 */
function waitForGlobal(name, timeout = 5000) {
    return new Promise((resolve, reject) => {
        if (typeof globalThis[name] !== 'undefined') {
            resolve();
            return;
        }

        const startTime = Date.now();
        const checkInterval = setInterval(() => {
            if (typeof globalThis[name] !== 'undefined') {
                clearInterval(checkInterval);
                resolve();
                return;
            }

            if (Date.now() - startTime > timeout) {
                clearInterval(checkInterval);
                reject(new Error(`Timeout waiting for global: ${name}`));
            }
        }, 50);
    });
}

// 启动应用
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initModularApp);
} else {
    initModularApp();
}

// 导出到全局
globalThis.initModularApp = initModularApp;
