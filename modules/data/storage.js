/**
 * 存储模块
 * 封装 localStorage 操作，提供类型安全和错误处理
 */

import { STORAGE_KEYS } from '../core/constants.js';

/**
 * 存储适配器类
 */
class StorageAdapter {
    constructor() {
        this._prefix = '';
        this._enabled = this._checkAvailability();
    }

    /**
     * 检查 localStorage 是否可用
     * @private
     */
    _checkAvailability() {
        try {
            const test = '__storage_test__';
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            return true;
        } catch {
            return false;
        }
    }

    /**
     * 获取完整键名
     * @private
     */
    _key(key) {
        return this._prefix ? `${this._prefix}:${key}` : key;
    }

    /**
     * 获取值
     * @param {string} key - 键名
     * @param {*} defaultValue - 默认值
     * @returns {*}
     */
    get(key, defaultValue = null) {
        if (!this._enabled) return defaultValue;
        try {
            const item = localStorage.getItem(this._key(key));
            if (item === null) return defaultValue;
            return JSON.parse(item);
        } catch {
            return defaultValue;
        }
    }

    /**
     * 设置值
     * @param {string} key - 键名
     * @param {*} value - 值
     * @returns {boolean}
     */
    set(key, value) {
        if (!this._enabled) return false;
        try {
            localStorage.setItem(this._key(key), JSON.stringify(value));
            return true;
        } catch {
            return false;
        }
    }

    /**
     * 删除值
     * @param {string} key - 键名
     * @returns {boolean}
     */
    remove(key) {
        if (!this._enabled) return false;
        try {
            localStorage.removeItem(this._key(key));
            return true;
        } catch {
            return false;
        }
    }

    /**
     * 清空所有值
     * @returns {boolean}
     */
    clear() {
        if (!this._enabled) return false;
        try {
            localStorage.clear();
            return true;
        } catch {
            return false;
        }
    }

    /**
     * 获取所有键
     * @returns {string[]}
     */
    keys() {
        if (!this._enabled) return [];
        const keys = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && (!this._prefix || key.startsWith(`${this._prefix}:`))) {
                keys.push(this._prefix ? key.slice(this._prefix.length + 1) : key);
            }
        }
        return keys;
    }

    /**
     * 创建命名空间
     * @param {string} prefix - 前缀
     * @returns {StorageAdapter}
     */
    namespace(prefix) {
        const namespaced = new StorageAdapter();
        namespaced._prefix = this._prefix ? `${this._prefix}:${prefix}` : prefix;
        namespaced._enabled = this._enabled;
        return namespaced;
    }
}

// 默认存储实例
export const storage = new StorageAdapter();

// 应用专用存储（带前缀）
export const appStorage = storage.namespace('ac2');

// 便捷访问方法
export const LS = {
    get: (key, defaultValue) => appStorage.get(key, defaultValue),
    set: (key, value) => appStorage.set(key, value),
    remove: (key) => appStorage.remove(key)
};

// 导出键名常量
export { STORAGE_KEYS as KEYS };

export default StorageAdapter;
