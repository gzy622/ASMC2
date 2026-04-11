/**
 * 数据验证工具库
 * 统一处理各种数据验证逻辑，减少代码重复
 */

/**
 * 验证是否为有效的对象
 * @param {*} value - 要验证的值
 * @returns {boolean}
 */
export const isValidObject = (value) => {
    return value !== null && typeof value === 'object';
};

/**
 * 验证是否为有效的数组
 * @param {*} value - 要验证的值
 * @returns {boolean}
 */
export const isValidArray = (value) => {
    return Array.isArray(value);
};

/**
 * 验证是否为非空数组
 * @param {*} value - 要验证的值
 * @returns {boolean}
 */
export const isNonEmptyArray = (value) => {
    return Array.isArray(value) && value.length > 0;
};

/**
 * 验证是否为非空字符串
 * @param {*} value - 要验证的值
 * @returns {boolean}
 */
export const isNonEmptyString = (value) => {
    return typeof value === 'string' && value.trim().length > 0;
};

/**
 * 验证是否为有效的数字
 * @param {*} value - 要验证的值
 * @returns {boolean}
 */
export const isValidNumber = (value) => {
    return typeof value === 'number' && Number.isFinite(value);
};

/**
 * 验证是否为正整数
 * @param {*} value - 要验证的值
 * @returns {boolean}
 */
export const isPositiveInteger = (value) => {
    return Number.isInteger(value) && value > 0;
};

/**
 * 验证是否为有效的布尔值
 * @param {*} value - 要验证的值
 * @returns {boolean}
 */
export const isBoolean = (value) => {
    return typeof value === 'boolean';
};

/**
 * 验证是否为有效的函数
 * @param {*} value - 要验证的值
 * @returns {boolean}
 */
export const isFunction = (value) => {
    return typeof value === 'function';
};

/**
 * 验证是否为有效的日期
 * @param {*} value - 要验证的值
 * @returns {boolean}
 */
export const isValidDate = (value) => {
    return value instanceof Date && !isNaN(value.getTime());
};

/**
 * 验证存储数据的基本结构
 * @param {*} data - 要验证的数据
 * @param {string[]} [requiredArrays=[]] - 必需的数组字段名
 * @returns {boolean}
 */
export const validateStorageData = (data, requiredArrays = []) => {
    if (!isValidObject(data)) {
        return false;
    }
    for (const key of requiredArrays) {
        if (!isValidArray(data[key])) {
            return false;
        }
    }
    return true;
};

/**
 * 验证导入/恢复数据格式
 * @param {*} data - 要验证的数据
 * @returns {boolean}
 */
export const isValidImportData = (data) => {
    return validateStorageData(data, ['list', 'data']);
};

/**
 * 验证恢复草稿数据格式
 * @param {*} draft - 要验证的草稿数据
 * @returns {boolean}
 */
export const isValidRecoveryDraft = (draft) => {
    return validateStorageData(draft, ['list', 'data']);
};

/**
 * 验证学生ID格式（两位数字）
 * @param {*} id - 要验证的ID
 * @returns {boolean}
 */
export const isValidStudentId = (id) => {
    return isNonEmptyString(id) && /^\d{2}$/.test(id);
};

/**
 * 验证任务对象的基本结构
 * @param {*} asg - 要验证的任务对象
 * @returns {boolean}
 */
export const isValidAssignment = (asg) => {
    return isValidObject(asg) &&
           isValidNumber(asg.id) &&
           isNonEmptyString(asg.name);
};

/**
 * 验证分数值是否在有效范围内
 * @param {*} value - 要验证的值
 * @param {number} [min=0] - 最小值
 * @param {number} [max=100] - 最大值
 * @returns {boolean}
 */
export const isValidScore = (value, min = 0, max = 100) => {
    const num = Number(value);
    return Number.isFinite(num) && num >= min && num <= max;
};

/**
 * 验证邮箱格式
 * @param {*} email - 要验证的邮箱
 * @returns {boolean}
 */
export const isValidEmail = (email) => {
    if (!isNonEmptyString(email)) return false;
    const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return pattern.test(email);
};

/**
 * 验证URL格式
 * @param {*} url - 要验证的URL
 * @returns {boolean}
 */
export const isValidUrl = (url) => {
    if (!isNonEmptyString(url)) return false;
    try {
        new URL(url);
        return true;
    } catch {
        return false;
    }
};

/**
 * 验证颜色格式（十六进制）
 * @param {*} color - 要验证的颜色值
 * @returns {boolean}
 */
export const isValidHexColor = (color) => {
    if (!isNonEmptyString(color)) return false;
    const hex = color.trim().replace(/^#/, '').toLowerCase();
    return /^([0-9a-f]{3}|[0-9a-f]{6})$/.test(hex);
};

/**
 * 验证对象是否有指定的所有属性
 * @param {*} obj - 要验证的对象
 * @param {string[]} keys - 必需的属性名数组
 * @returns {boolean}
 */
export const hasAllKeys = (obj, keys) => {
    if (!isValidObject(obj)) return false;
    return keys.every(key => key in obj);
};

/**
 * 验证对象是否有任一指定属性
 * @param {*} obj - 要验证的对象
 * @param {string[]} keys - 属性名数组
 * @returns {boolean}
 */
export const hasAnyKey = (obj, keys) => {
    if (!isValidObject(obj)) return false;
    return keys.some(key => key in obj);
};

/**
 * 验证字符串长度是否在范围内
 * @param {*} value - 要验证的值
 * @param {number} [min=0] - 最小长度
 * @param {number} [max=Infinity] - 最大长度
 * @returns {boolean}
 */
export const isValidLength = (value, min = 0, max = Infinity) => {
    const str = String(value || '');
    const len = str.length;
    return len >= min && len <= max;
};

/**
 * 验证是否为有效的JSON字符串
 * @param {*} value - 要验证的值
 * @returns {boolean}
 */
export const isValidJson = (value) => {
    if (!isNonEmptyString(value)) return false;
    try {
        JSON.parse(value);
        return true;
    } catch {
        return false;
    }
};

/**
 * 验证器类 - 提供链式验证接口
 */
export class Validator {
    constructor(value) {
        this.value = value;
        this.errors = [];
        this._optional = false;
    }

    /**
     * 标记值为可选
     * @returns {Validator}
     */
    optional() {
        this._optional = true;
        return this;
    }

    /**
     * 验证是否为非空
     * @param {string} [message] - 错误消息
     * @returns {Validator}
     */
    required(message = '值不能为空') {
        if (this._optional && (this.value == null || this.value === '')) return this;
        if (this.value == null || this.value === '') {
            this.errors.push(message);
        }
        return this;
    }

    /**
     * 验证是否为字符串
     * @param {string} [message] - 错误消息
     * @returns {Validator}
     */
    string(message = '值必须是字符串') {
        if (this._optional && this.value == null) return this;
        if (typeof this.value !== 'string') {
            this.errors.push(message);
        }
        return this;
    }

    /**
     * 验证是否为数字
     * @param {string} [message] - 错误消息
     * @returns {Validator}
     */
    number(message = '值必须是数字') {
        if (this._optional && this.value == null) return this;
        if (!isValidNumber(this.value)) {
            this.errors.push(message);
        }
        return this;
    }

    /**
     * 验证数值范围
     * @param {number} min - 最小值
     * @param {number} max - 最大值
     * @param {string} [message] - 错误消息
     * @returns {Validator}
     */
    range(min, max, message) {
        if (this._optional && this.value == null) return this;
        const msg = message || `值必须在 ${min} 和 ${max} 之间`;
        if (!isValidNumber(this.value) || this.value < min || this.value > max) {
            this.errors.push(msg);
        }
        return this;
    }

    /**
     * 验证字符串长度
     * @param {number} min - 最小长度
     * @param {number} max - 最大长度
     * @param {string} [message] - 错误消息
     * @returns {Validator}
     */
    length(min, max, message) {
        if (this._optional && this.value == null) return this;
        const str = String(this.value || '');
        const msg = message || `长度必须在 ${min} 和 ${max} 之间`;
        if (str.length < min || str.length > max) {
            this.errors.push(msg);
        }
        return this;
    }

    /**
     * 验证是否匹配正则表达式
     * @param {RegExp} pattern - 正则表达式
     * @param {string} [message] - 错误消息
     * @returns {Validator}
     */
    match(pattern, message = '格式不正确') {
        if (this._optional && this.value == null) return this;
        if (!pattern.test(String(this.value))) {
            this.errors.push(message);
        }
        return this;
    }

    /**
     * 验证是否为数组
     * @param {string} [message] - 错误消息
     * @returns {Validator}
     */
    array(message = '值必须是数组') {
        if (this._optional && this.value == null) return this;
        if (!Array.isArray(this.value)) {
            this.errors.push(message);
        }
        return this;
    }

    /**
     * 验证是否为对象
     * @param {string} [message] - 错误消息
     * @returns {Validator}
     */
    object(message = '值必须是对象') {
        if (this._optional && this.value == null) return this;
        if (!isValidObject(this.value)) {
            this.errors.push(message);
        }
        return this;
    }

    /**
     * 验证是否为布尔值
     * @param {string} [message] - 错误消息
     * @returns {Validator}
     */
    boolean(message = '值必须是布尔值') {
        if (this._optional && this.value == null) return this;
        if (typeof this.value !== 'boolean') {
            this.errors.push(message);
        }
        return this;
    }

    /**
     * 自定义验证
     * @param {Function} fn - 验证函数
     * @param {string} [message] - 错误消息
     * @returns {Validator}
     */
    custom(fn, message = '验证失败') {
        if (this._optional && this.value == null) return this;
        if (!fn(this.value)) {
            this.errors.push(message);
        }
        return this;
    }

    /**
     * 获取验证结果
     * @returns {{valid: boolean, errors: string[], value: *}}
     */
    validate() {
        return {
            valid: this.errors.length === 0,
            errors: [...this.errors],
            value: this.value
        };
    }

    /**
     * 检查是否验证通过
     * @returns {boolean}
     */
    isValid() {
        return this.errors.length === 0;
    }

    /**
     * 获取错误消息
     * @returns {string[]}
     */
    getErrors() {
        return [...this.errors];
    }

    /**
     * 抛出第一个错误
     */
    throwIfInvalid() {
        if (this.errors.length > 0) {
            throw new Error(this.errors[0]);
        }
    }
}

/**
 * 创建验证器实例
 * @param {*} value - 要验证的值
 * @returns {Validator}
 */
export const validate = (value) => new Validator(value);

// 默认导出所有工具
export default {
    isValidObject,
    isValidArray,
    isNonEmptyArray,
    isNonEmptyString,
    isValidNumber,
    isPositiveInteger,
    isBoolean,
    isFunction,
    isValidDate,
    validateStorageData,
    isValidImportData,
    isValidRecoveryDraft,
    isValidStudentId,
    isValidAssignment,
    isValidScore,
    isValidEmail,
    isValidUrl,
    isValidHexColor,
    hasAllKeys,
    hasAnyKey,
    isValidLength,
    isValidJson,
    Validator,
    validate
};
