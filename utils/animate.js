/**
 * 动画工具库
 * 提供动画时长常量、帧管理、过渡效果等
 */

/**
 * 动画时长常量（单位：毫秒）
 * 集中管理所有动画时间，便于统一调整和维护
 */
export const ANIMATION_DURATION = {
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
export const TIMER_DELAY = {
    DRAFT_PERSIST: 1200,    // 草稿持久化延迟
    CARD_META_SAVE: 250,    // 卡片元数据保存延迟
    SCOREPAD_CLOSE: 120,    // 分数面板关闭延迟
    BACK_SIGNAL_DEBOUNCE: 80,   // 返回信号防抖时间
    EXIT_WINDOW: 1500       // 退出窗口时间（连按两次返回退出）
};

/**
 * 手势与交互阈值
 */
export const INTERACTION_THRESHOLD = {
    DRAG_CLOSE: 80,         // 拖拽关闭阈值（超过此值触发关闭）
    DRAG_MAX_OFFSET: 200    // 最大拖拽偏移量
};

/**
 * 设备检测工具
 */
export const Device = {
    /**
     * 是否为 Android 设备
     * @returns {boolean}
     */
    isAndroid() {
        return /Android/i.test(navigator.userAgent);
    },

    /**
     * 是否为 Firefox 浏览器
     * @returns {boolean}
     */
    isFirefox() {
        return /Firefox/i.test(navigator.userAgent);
    },

    /**
     * 是否为 iOS 设备
     * @returns {boolean}
     */
    isIOS() {
        return /iPad|iPhone|iPod/i.test(navigator.userAgent);
    },

    /**
     * 是否为 Safari 浏览器
     * @returns {boolean}
     */
    isSafari() {
        return /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    },

    /**
     * 是否为触摸设备
     * @returns {boolean}
     */
    isCoarsePointer() {
        if (typeof window.matchMedia === 'function') {
            return window.matchMedia('(pointer: coarse)').matches;
        }
        return 'ontouchstart' in window || Number(navigator.maxTouchPoints) > 0;
    },

    /**
     * 是否支持被动事件监听
     * @returns {boolean}
     */
    supportsPassive() {
        let passive = false;
        try {
            const opts = Object.defineProperty({}, 'passive', {
                get() { passive = true; return true; }
            });
            window.addEventListener('test', null, opts);
            window.removeEventListener('test', null, opts);
        } catch (e) {
            passive = false;
        }
        return passive;
    }
};

/**
 * 是否为 Android Firefox 浏览器
 * @returns {boolean}
 */
export const IS_ANDROID_FIREFOX = Device.isAndroid() && Device.isFirefox();

/**
 * 下一帧执行
 * @param {Function} callback - 回调函数
 * @returns {number} requestAnimationFrame ID
 */
export const nextFrame = (callback) => requestAnimationFrame(callback);

/**
 * 取消帧请求
 * @param {number} id - requestAnimationFrame ID
 */
export const cancelFrame = (id) => cancelAnimationFrame(id);

/**
 * 多帧后执行
 * @param {Function} callback - 回调函数
 * @param {number} [frames=1] - 帧数
 * @returns {Promise<void>}
 */
export const afterFrames = (callback, frames = 1) => {
    return new Promise(resolve => {
        let count = 0;
        const step = () => {
            count++;
            if (count >= frames) {
                callback();
                resolve();
            } else {
                requestAnimationFrame(step);
            }
        };
        requestAnimationFrame(step);
    });
};

/**
 * 延迟执行
 * @param {number} ms - 延迟毫秒数
 * @returns {Promise<void>}
 */
export const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * 动画帧调度器
 * 用于管理动画帧的调度和取消
 */
export class FrameScheduler {
    constructor() {
        this._rafId = null;
        this._callbacks = new Set();
    }

    /**
     * 添加回调
     * @param {Function} callback - 回调函数
     */
    add(callback) {
        this._callbacks.add(callback);
        if (!this._rafId) {
            this._schedule();
        }
    }

    /**
     * 移除回调
     * @param {Function} callback - 回调函数
     */
    remove(callback) {
        this._callbacks.delete(callback);
        if (this._callbacks.size === 0) {
            this.cancel();
        }
    }

    /**
     * 调度帧
     * @private
     */
    _schedule() {
        this._rafId = requestAnimationFrame((time) => {
            this._rafId = null;
            this._callbacks.forEach(cb => {
                try {
                    cb(time);
                } catch (err) {
                    console.error('Frame callback error:', err);
                }
            });
            if (this._callbacks.size > 0) {
                this._schedule();
            }
        });
    }

    /**
     * 取消所有调度
     */
    cancel() {
        if (this._rafId) {
            cancelAnimationFrame(this._rafId);
            this._rafId = null;
        }
    }

    /**
     * 清空所有回调
     */
    clear() {
        this.cancel();
        this._callbacks.clear();
    }
}

/**
 * 过渡动画管理器
 * 管理元素的 CSS 过渡动画
 */
export class TransitionManager {
    /**
     * @param {HTMLElement} element - 目标元素
     */
    constructor(element) {
        this.el = element;
        this._transitionEndHandler = null;
    }

    /**
     * 等待过渡结束
     * @param {string} [property='all'] - CSS 属性名
     * @returns {Promise<void>}
     */
    waitForEnd(property = 'all') {
        return new Promise(resolve => {
            const handler = (e) => {
                if (property === 'all' || e.propertyName === property) {
                    this.el.removeEventListener('transitionend', handler);
                    resolve();
                }
            };
            this.el.addEventListener('transitionend', handler);
        });
    }

    /**
     * 应用过渡并等待完成
     * @param {Object} styles - 样式对象
     * @param {number} [duration=300] - 过渡时长
     * @returns {Promise<void>}
     */
    async transition(styles, duration = 300) {
        this.el.style.transition = `all ${duration}ms ease`;
        Object.assign(this.el.style, styles);
        await this.waitForEnd();
        this.el.style.transition = '';
    }

    /**
     * 淡入
     * @param {number} [duration=300] - 时长
     * @returns {Promise<void>}
     */
    async fadeIn(duration = 300) {
        this.el.style.opacity = '0';
        this.el.style.display = '';
        await this.transition({ opacity: '1' }, duration);
    }

    /**
     * 淡出
     * @param {number} [duration=300] - 时长
     * @returns {Promise<void>}
     */
    async fadeOut(duration = 300) {
        await this.transition({ opacity: '0' }, duration);
        this.el.style.display = 'none';
    }
}

/**
 * 创建渐进式渲染控制器
 * 支持按优先级分阶段渲染（shell/aboveFold/heavy），优化首屏体验
 * @param {Element} root - 弹窗内容的根元素
 * @param {Object} options - 配置选项
 * @param {boolean} [options.animated=true] - 是否启用动画，影响各阶段的延迟时间
 * @returns {Object} 控制器API对象，包含调度、取消、清理等方法
 */
export const createProgressiveController = (root, { animated = true } = {}) => {
    const timers = new Set();
    const rafs = new Set();
    const cleanups = new Set();
    let pending = 0;
    let idleNotified = false;
    let idleTimer = 0;

    const stageOffsets = animated
        ? { shell: 0, aboveFold: ANIMATION_DURATION.FULL_ENTER, heavy: ANIMATION_DURATION.FULL_ENTER + 72 }
        : { shell: 0, aboveFold: 0, heavy: 0 };

    const state = { cancelled: false, root };

    const captureCleanup = result => {
        if (typeof result === 'function') cleanups.add(result);
        return result;
    };

    const acquirePending = () => {
        let released = false;
        pending++;
        return () => {
            if (released) return;
            released = true;
            pending = Math.max(0, pending - 1);
            settleIdle();
        };
    };

    const settleIdle = () => {
        if (state.cancelled || pending > 0 || idleNotified || typeof api.onIdle !== 'function') return;
        if (idleTimer) return;
        idleTimer = setTimeout(() => {
            idleTimer = 0;
            if (state.cancelled || pending > 0 || idleNotified || typeof api.onIdle !== 'function') return;
            idleNotified = true;
            api.onIdle();
        }, 0);
    };

    const runTask = (task, release = acquirePending()) => {
        try {
            return captureCleanup(task(api));
        } finally {
            release();
        }
    };

    const api = {
        root,
        animated,
        stageOffsets,
        onIdle: null,

        /**
         * 触发空闲检查
         */
        kickIdle: () => settleIdle(),

        /**
         * 检查是否仍处于活动状态
         * @returns {boolean}
         */
        isActive: () => !state.cancelled,

        /**
         * 注册清理函数
         * @param {Function} fn - 清理函数
         * @returns {Function}
         */
        registerCleanup: fn => {
            if (typeof fn === 'function') cleanups.add(fn);
            return fn;
        },

        /**
         * 延迟执行任务
         * @param {Function} task - 任务函数
         * @param {number} [delay=0] - 延迟时间
         * @param {Object} [options] - 选项
         * @returns {number}
         */
        after: (task, delay = 0, { frame = false, frames = 1 } = {}) => {
            if (typeof task !== 'function') return 0;

            const invoke = () => {
                if (!api.isActive()) {
                    release();
                    return 0;
                }
                if (frame) return api.frame(task, frames, release);
                return runTask(task, release);
            };

            const ms = Math.max(0, Number(delay) || 0);
            if (!animated && ms <= 0) {
                runTask(task);
                return 0;
            }

            const release = acquirePending();
            const timerId = setTimeout(() => {
                timers.delete(timerId);
                invoke();
            }, ms);
            timers.add(timerId);
            return timerId;
        },

        /**
         * 在下一帧执行任务
         * @param {Function} task - 任务函数
         * @param {number} [frames=1] - 帧数
         * @param {Function} [release] - 释放函数
         * @returns {number}
         */
        frame: (task, frames = 1, release = null) => {
            if (typeof task !== 'function') return 0;

            const ownRelease = release || acquirePending();
            if (!api.isActive()) {
                ownRelease();
                return 0;
            }

            const totalFrames = Math.max(1, Number(frames) || 1);
            if (!animated) {
                runTask(task, ownRelease);
                return 0;
            }

            let remaining = totalFrames;
            const step = () => {
                if (!api.isActive()) return;
                if (remaining > 1) {
                    remaining--;
                    const nextId = requestAnimationFrame(() => {
                        rafs.delete(nextId);
                        step();
                    });
                    rafs.add(nextId);
                    return;
                }
                runTask(task, ownRelease);
            };

            const rafId = requestAnimationFrame(() => {
                rafs.delete(rafId);
                step();
            });
            rafs.add(rafId);
            return rafId;
        },

        /**
         * 按阶段调度任务
         * @param {Function} task - 任务函数
         * @param {Object} [options] - 选项
         * @returns {number}
         */
        schedule: (task, { phase = 'shell', delay = 0, frame = true, frames = 1 } = {}) => {
            if (typeof task !== 'function') return 0;

            if (!animated) {
                const d = Math.max(0, Number(delay) || 0);
                if (d === 0) {
                    const release = acquirePending();
                    if (api.isActive()) runTask(task, release);
                    else release();
                    return 0;
                }
                const release = acquirePending();
                const timerId = setTimeout(() => {
                    timers.delete(timerId);
                    if (!api.isActive()) {
                        release();
                        return;
                    }
                    runTask(task, release);
                }, d);
                timers.add(timerId);
                return timerId;
            }

            const baseDelay = animated ? (stageOffsets[phase] ?? stageOffsets.heavy) : 0;
            return api.after(task, baseDelay + Math.max(0, Number(delay) || 0), { frame, frames });
        },

        /**
         * 取消所有任务
         */
        cancel: () => {
            if (state.cancelled) return;
            state.cancelled = true;
            clearTimeout(idleTimer);
            idleTimer = 0;
            timers.forEach(timerId => clearTimeout(timerId));
            timers.clear();
            rafs.forEach(rafId => cancelAnimationFrame(rafId));
            rafs.clear();
            cleanups.forEach(fn => {
                try { fn(); } catch (err) { }
            });
            cleanups.clear();
            pending = 0;
        }
    };

    return api;
};

// 默认导出所有工具
export default {
    ANIMATION_DURATION,
    TIMER_DELAY,
    INTERACTION_THRESHOLD,
    Device,
    IS_ANDROID_FIREFOX,
    nextFrame,
    cancelFrame,
    afterFrames,
    delay,
    FrameScheduler,
    TransitionManager,
    createProgressiveController
};
