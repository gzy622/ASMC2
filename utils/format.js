/**
 * 格式化工具库
 * 提供日期、数字、颜色等格式化函数
 */

/**
 * 应用名称标识
 */
export const APP_NAME_SLUG = 'assignmentcheck2';

/**
 * 默认颜色预设
 */
export const CARD_COLOR_PRESETS = ['#68c490', '#8ecae6', '#f4a261', '#e9c46a', '#c084fc', '#f28482'];

/**
 * 默认名单数据
 */
export const PLACEHOLDER_NAME_PREFIXES = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
export const PLACEHOLDER_NAME_SUFFIXES = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十', '子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉'];
export const PLACEHOLDER_NAME_TAILS = ['东', '南', '西', '北', '中'];

export const createPlaceholderStudentName = index => {
    const safeIndex = Math.max(0, Number(index) || 0);
    const prefix = PLACEHOLDER_NAME_PREFIXES[safeIndex % PLACEHOLDER_NAME_PREFIXES.length];
    const suffix = PLACEHOLDER_NAME_SUFFIXES[Math.floor(safeIndex / PLACEHOLDER_NAME_PREFIXES.length) % PLACEHOLDER_NAME_SUFFIXES.length];
    const block = Math.floor(safeIndex / (PLACEHOLDER_NAME_PREFIXES.length * PLACEHOLDER_NAME_SUFFIXES.length));
    return block ? `${prefix}${suffix}${PLACEHOLDER_NAME_TAILS[(block - 1) % PLACEHOLDER_NAME_TAILS.length]}` : `${prefix}${suffix}`;
};

export const DEFAULT_ROSTER_SIZE = 50;
export const DEFAULT_ROSTER = Array.from({ length: DEFAULT_ROSTER_SIZE }, (_, index) => {
    const id = String(index + 1).padStart(2, '0');
    return `${id} ${createPlaceholderStudentName(index)}`;
});

/**
 * 科目预设列表
 */
export const SUBJECT_PRESETS = ['英语', '语文', '数学', '物理', '化学', '其他'];

/**
 * 数值限制在范围内
 * @param {number} v - 值
 * @param {number} [min=0] - 最小值
 * @param {number} [max=255] - 最大值
 * @returns {number}
 */
export const clamp = (v, min = 0, max = 255) => Math.max(min, Math.min(max, Math.round(v)));

/**
 * 格式化日期为本地字符串
 * @param {Date} [date=new Date()] - 日期对象
 * @param {Object} [options] - 格式化选项
 * @returns {string}
 */
export const formatDate = (date = new Date(), options = {}) => {
    const d = date instanceof Date ? date : new Date(date);
    if (isNaN(d.getTime())) return '';
    
    const opts = {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        ...options
    };
    return d.toLocaleDateString('zh-CN', opts);
};

/**
 * 格式化日期时间为本地字符串
 * @param {Date} [date=new Date()] - 日期对象
 * @returns {string}
 */
export const formatDateTime = (date = new Date()) => {
    const d = date instanceof Date ? date : new Date(date);
    if (isNaN(d.getTime())) return '';
    
    return d.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
};

/**
 * 生成备份文件名
 * @param {Date} [date=new Date()] - 日期对象
 * @returns {string}
 */
export const formatBackupFileName = (date = new Date()) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    const hh = String(date.getHours()).padStart(2, '0');
    const mm = String(date.getMinutes()).padStart(2, '0');
    const ss = String(date.getSeconds()).padStart(2, '0');
    return `${APP_NAME_SLUG}_backup_${y}${m}${d}_${hh}${mm}${ss}.json`;
};

/**
 * 颜色工具类
 */
export const ColorUtil = {
    /**
     * 限制数值在范围内
     * @param {number} v - 值
     * @param {number} [min=0] - 最小值
     * @param {number} [max=255] - 最大值
     * @returns {number}
     */
    clamp(v, min = 0, max = 255) {
        return Math.max(min, Math.min(max, Math.round(v)));
    },

    /**
     * 规范化十六进制颜色
     * @param {string} hex - 颜色值
     * @param {string} [fallback='#68c490'] - 回退颜色
     * @returns {string}
     */
    normalizeHex(hex, fallback = '#68c490') {
        return this.rgbToHex(this.hexToRgb(hex, fallback));
    },

    /**
     * 十六进制转 RGB
     * @param {string} hex - 颜色值
     * @param {string} [fallback='#68c490'] - 回退颜色
     * @returns {{r: number, g: number, b: number}}
     */
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

    /**
     * RGB 转十六进制
     * @param {{r: number, g: number, b: number}} param0 - RGB 对象
     * @returns {string}
     */
    rgbToHex({ r, g, b }) {
        return `#${[r, g, b].map(v => this.clamp(v).toString(16).padStart(2, '0')).join('')}`;
    },

    /**
     * 混合两种颜色
     * @param {string} hexA - 颜色 A
     * @param {string} hexB - 颜色 B
     * @param {number} ratio - 混合比例 (0-1)
     * @returns {string}
     */
    mix(hexA, hexB, ratio) {
        const a = this.hexToRgb(hexA), b = this.hexToRgb(hexB);
        const t = Math.max(0, Math.min(1, Number(ratio) || 0));
        return this.rgbToHex({
            r: a.r + (b.r - a.r) * t,
            g: a.g + (b.g - a.g) * t,
            b: a.b + (b.b - a.b) * t
        });
    },

    /**
     * 添加透明度到颜色
     * @param {string} hex - 颜色值
     * @param {number} alpha - 透明度 (0-1)
     * @returns {string}
     */
    withAlpha(hex, alpha) {
        const { r, g, b } = this.hexToRgb(hex);
        return `rgba(${r}, ${g}, ${b}, ${Math.max(0, Math.min(1, Number(alpha) || 0))})`;
    },

    /**
     * 计算颜色亮度
     * @param {string} hex - 颜色值
     * @returns {number}
     */
    luminance(hex) {
        const { r, g, b } = this.hexToRgb(hex);
        const toLinear = c => {
            const v = c / 255;
            return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
        };
        return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
    }
};

/**
 * ID 生成器工具类
 */
export const IdGenerator = {
    _lastId: 0,

    /**
     * 生成唯一 ID（基于时间戳，确保递增）
     * @returns {number}
     */
    generate() {
        const now = Date.now();
        this._lastId = Math.max(now, this._lastId + 1);
        return this._lastId;
    },

    /**
     * 生成唯一 ID，并检查是否存在于给定的集合中
     * @param {Function} existsCheck - 存在检查函数
     * @returns {number}
     */
    generateUnique(existsCheck) {
        let id = this.generate();
        while (existsCheck(id)) {
            id = this.generate();
        }
        return id;
    },

    /**
     * 重置内部状态（仅用于测试）
     */
    reset() {
        this._lastId = 0;
    },

    /**
     * 获取下一个可能的 ID（不增加计数器）
     * @returns {number}
     */
    peek() {
        return Math.max(Date.now(), this._lastId + 1);
    }
};

/**
 * 格式化数字为百分比
 * @param {number} value - 数值
 * @param {number} [decimals=0] - 小数位数
 * @returns {string}
 */
export const formatPercent = (value, decimals = 0) => {
    const num = Number(value);
    if (!Number.isFinite(num)) return '0%';
    return `${(num * 100).toFixed(decimals)}%`;
};

/**
 * 格式化数字为千分位
 * @param {number} value - 数值
 * @returns {string}
 */
export const formatNumber = (value) => {
    const num = Number(value);
    if (!Number.isFinite(num)) return '0';
    return num.toLocaleString('zh-CN');
};

/**
 * 截断文本
 * @param {string} text - 文本
 * @param {number} maxLength - 最大长度
 * @param {string} [suffix='...'] - 后缀
 * @returns {string}
 */
export const truncate = (text, maxLength, suffix = '...') => {
    const str = String(text || '');
    if (str.length <= maxLength) return str;
    return str.slice(0, maxLength - suffix.length) + suffix;
};

/**
 * 首字母大写
 * @param {string} str - 字符串
 * @returns {string}
 */
export const capitalize = (str) => {
    const s = String(str || '');
    return s.charAt(0).toUpperCase() + s.slice(1);
};

/**
 * 转换为驼峰命名
 * @param {string} str - 字符串
 * @returns {string}
 */
export const toCamelCase = (str) => {
    return String(str || '')
        .replace(/[-_\s]+(.)?/g, (_, c) => c ? c.toUpperCase() : '')
        .replace(/^(.)/, (_, c) => c.toLowerCase());
};

/**
 * 转换为 kebab-case
 * @param {string} str - 字符串
 * @returns {string}
 */
export const toKebabCase = (str) => {
    return String(str || '')
        .replace(/([a-z])([A-Z])/g, '$1-$2')
        .replace(/[\s_]+/g, '-')
        .toLowerCase();
};

// 默认导出所有工具
export default {
    APP_NAME_SLUG,
    CARD_COLOR_PRESETS,
    createPlaceholderStudentName,
    DEFAULT_ROSTER,
    DEFAULT_ROSTER_SIZE,
    SUBJECT_PRESETS,
    clamp,
    formatDate,
    formatDateTime,
    formatBackupFileName,
    ColorUtil,
    IdGenerator,
    formatPercent,
    formatNumber,
    truncate,
    capitalize,
    toCamelCase,
    toKebabCase
};
