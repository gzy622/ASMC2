/**
 * DOM 操作工具库
 * 提供常用的 DOM 查询、操作和事件处理函数
 */

/**
 * 通过 ID 获取元素（$ 的别名）
 * @param {string} id - 元素 ID
 * @returns {HTMLElement|null}
 */
export const $ = id => document.getElementById(id);

/**
 * 通过选择器获取单个元素
 * @param {string} selector - CSS 选择器
 * @param {HTMLElement|Document} [parent=document] - 父元素
 * @returns {HTMLElement|null}
 */
export const qs = (selector, parent = document) => parent.querySelector(selector);

/**
 * 通过选择器获取所有匹配元素
 * @param {string} selector - CSS 选择器
 * @param {HTMLElement|Document} [parent=document] - 父元素
 * @returns {NodeListOf<HTMLElement>}
 */
export const qsa = (selector, parent = document) => parent.querySelectorAll(selector);

/**
 * 绑定事件监听器
 * @param {HTMLElement} el - 目标元素
 * @param {string} event - 事件名称
 * @param {Function} handler - 事件处理函数
 * @param {Object|boolean} [options] - 事件选项
 */
export const on = (el, event, handler, options = false) => {
    if (el && el.addEventListener) {
        el.addEventListener(event, handler, options);
    }
};

/**
 * 移除事件监听器
 * @param {HTMLElement} el - 目标元素
 * @param {string} event - 事件名称
 * @param {Function} handler - 事件处理函数
 * @param {Object|boolean} [options] - 事件选项
 */
export const off = (el, event, handler, options = false) => {
    if (el && el.removeEventListener) {
        el.removeEventListener(event, handler, options);
    }
};

/**
 * 创建 DOM 元素
 * @param {string} tag - 标签名
 * @param {Object} [attrs={}] - 属性对象
 * @param {string} [text=''] - 文本内容
 * @returns {HTMLElement}
 */
export const createEl = (tag, attrs = {}, text = '') => {
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

/**
 * 清空元素内容
 * @param {HTMLElement} el - 目标元素
 */
export const empty = el => {
    if (el) el.innerHTML = '';
};

/**
 * 切换类名
 * @param {HTMLElement} el - 目标元素
 * @param {string} className - 类名
 * @param {boolean} [force] - 强制添加或移除
 */
export const toggleClass = (el, className, force) => {
    if (el) el.classList.toggle(className, force);
};

/**
 * 检查元素是否匹配选择器
 * @param {HTMLElement} el - 目标元素
 * @param {string} selector - CSS 选择器
 * @returns {boolean}
 */
export const matches = (el, selector) => {
    return el && el.matches ? el.matches(selector) : false;
};

/**
 * 获取或设置元素文本内容
 * @param {HTMLElement} el - 目标元素
 * @param {string} [text] - 要设置的文本
 * @returns {string|void}
 */
export const text = (el, text) => {
    if (!el) return '';
    if (text === undefined) return el.textContent;
    el.textContent = text;
};

/**
 * 获取或设置元素 HTML 内容
 * @param {HTMLElement} el - 目标元素
 * @param {string} [html] - 要设置的 HTML
 * @returns {string|void}
 */
export const html = (el, html) => {
    if (!el) return '';
    if (html === undefined) return el.innerHTML;
    el.innerHTML = html;
};

/**
 * 设置 CSS 变量
 * @param {HTMLElement} el - 目标元素
 * @param {string} name - 变量名
 * @param {string} value - 变量值
 */
export const setCSSVar = (el, name, value) => {
    if (el && el.style) {
        el.style.setProperty(name, value);
    }
};

/**
 * 移除 CSS 变量
 * @param {HTMLElement} el - 目标元素
 * @param {string} name - 变量名
 */
export const removeCSSVar = (el, name) => {
    if (el && el.style) {
        el.style.removeProperty(name);
    }
};

/**
 * 获取最近的匹配祖先元素
 * @param {HTMLElement} el - 起始元素
 * @param {string} selector - CSS 选择器
 * @returns {HTMLElement|null}
 */
export const closest = (el, selector) => {
    return el && el.closest ? el.closest(selector) : null;
};

/**
 * 获取兄弟元素
 * @param {HTMLElement} el - 目标元素
 * @param {string} [selector] - 可选的过滤选择器
 * @returns {HTMLElement[]}
 */
export const siblings = (el, selector) => {
    if (!el || !el.parentNode) return [];
    return Array.from(el.parentNode.children).filter(
        child => child !== el && (!selector || child.matches(selector))
    );
};

/**
 * 在元素后插入新元素
 * @param {HTMLElement} newEl - 新元素
 * @param {HTMLElement} referenceEl - 参考元素
 */
export const insertAfter = (newEl, referenceEl) => {
    if (referenceEl && referenceEl.parentNode) {
        referenceEl.parentNode.insertBefore(newEl, referenceEl.nextSibling);
    }
};

/**
 * 移除元素
 * @param {HTMLElement} el - 要移除的元素
 */
export const remove = el => {
    if (el && el.parentNode) {
        el.parentNode.removeChild(el);
    }
};

/**
 * 获取/设置 data 属性
 * @param {HTMLElement} el - 目标元素
 * @param {string} key - 属性名
 * @param {string} [value] - 属性值
 * @returns {string|void}
 */
export const data = (el, key, value) => {
    if (!el) return '';
    if (value === undefined) return el.dataset[key];
    el.dataset[key] = value;
};

/**
 * 聚焦元素
 * @param {HTMLElement} el - 目标元素
 * @param {Object} [options] - 聚焦选项
 */
export const focus = (el, options = { preventScroll: true }) => {
    if (el && el.focus) {
        el.focus(options);
    }
};

/**
 * 失焦当前活动元素
 * @param {HTMLElement} [container=document] - 容器元素
 */
export const blurActive = (container = document) => {
    const active = container.activeElement;
    if (active && active !== container.body && active.blur) {
        active.blur();
    }
};

/**
 * 检查元素是否在视口内
 * @param {HTMLElement} el - 目标元素
 * @param {number} [threshold=0] - 阈值
 * @returns {boolean}
 */
export const isInViewport = (el, threshold = 0) => {
    if (!el) return false;
    const rect = el.getBoundingClientRect();
    return (
        rect.top >= -threshold &&
        rect.left >= 0 &&
        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) + threshold &&
        rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
};

/**
 * 滚动元素到视口
 * @param {HTMLElement} el - 目标元素
 * @param {Object} [options] - 滚动选项
 */
export const scrollIntoView = (el, options = { behavior: 'smooth', block: 'nearest' }) => {
    if (el && el.scrollIntoView) {
        el.scrollIntoView(options);
    }
};

/**
 * 防抖函数
 * @param {Function} fn - 要执行的函数
 * @param {number} delay - 延迟时间（毫秒）
 * @returns {Function}
 */
export const debounce = (fn, delay) => {
    let timer = null;
    return function (...args) {
        clearTimeout(timer);
        timer = setTimeout(() => fn.apply(this, args), delay);
    };
};

/**
 * 节流函数
 * @param {Function} fn - 要执行的函数
 * @param {number} limit - 限制时间（毫秒）
 * @returns {Function}
 */
export const throttle = (fn, limit) => {
    let inThrottle = false;
    return function (...args) {
        if (!inThrottle) {
            fn.apply(this, args);
            inThrottle = true;
            setTimeout(() => (inThrottle = false), limit);
        }
    };
};

/**
 * 下一帧执行
 * @param {Function} callback - 回调函数
 * @returns {number} requestAnimationFrame ID
 */
export const nextFrame = callback => requestAnimationFrame(callback);

/**
 * 取消帧请求
 * @param {number} id - requestAnimationFrame ID
 */
export const cancelFrame = id => cancelAnimationFrame(id);

// 默认导出所有工具
export default {
    $,
    qs,
    qsa,
    on,
    off,
    createEl,
    empty,
    toggleClass,
    matches,
    text,
    html,
    setCSSVar,
    removeCSSVar,
    closest,
    siblings,
    insertAfter,
    remove,
    data,
    focus,
    blurActive,
    isInViewport,
    scrollIntoView,
    debounce,
    throttle,
    nextFrame,
    cancelFrame
};
