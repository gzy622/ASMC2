/**
 * 缓存服务模块
 * 简化并统一管理应用中的缓存逻辑
 */

const CacheService = (function() {
    'use strict';

    class CacheManager {
        constructor() {
            // 统一缓存存储
            this._caches = new Map();
            // 全局缓存版本号
            this._version = 0;
            // 脏标记管理
            this._dirtyFlags = new Map();
        }

        /**
         * 获取或创建命名缓存
         * @param {string} name - 缓存名称
         * @returns {Map} 缓存实例
         */
        getCache(name) {
            if (!this._caches.has(name)) {
                this._caches.set(name, new Map());
            }
            return this._caches.get(name);
        }

        /**
         * 设置缓存值
         * @param {string} cacheName - 缓存名称
         * @param {string} key - 缓存键
         * @param {*} value - 缓存值
         */
        set(cacheName, key, value) {
            const cache = this.getCache(cacheName);
            cache.set(key, value);
        }

        /**
         * 获取缓存值
         * @param {string} cacheName - 缓存名称
         * @param {string} key - 缓存键
         * @returns {*} 缓存值或undefined
         */
        get(cacheName, key) {
            const cache = this.getCache(cacheName);
            return cache.get(key);
        }

        /**
         * 检查缓存是否存在
         * @param {string} cacheName - 缓存名称
         * @param {string} key - 缓存键
         * @returns {boolean}
         */
        has(cacheName, key) {
            const cache = this.getCache(cacheName);
            return cache.has(key);
        }

        /**
         * 删除缓存项
         * @param {string} cacheName - 缓存名称
         * @param {string} key - 缓存键
         */
        delete(cacheName, key) {
            const cache = this.getCache(cacheName);
            cache.delete(key);
        }

        /**
         * 清空指定缓存
         * @param {string} cacheName - 缓存名称
         */
        clear(cacheName) {
            if (this._caches.has(cacheName)) {
                this._caches.get(cacheName).clear();
            }
        }

        /**
         * 清空所有缓存
         */
        clearAll() {
            this._caches.forEach(cache => cache.clear());
            this._version++;
        }

        /**
         * 使所有缓存失效
         */
        invalidateAll() {
            this.clearAll();
        }

        /**
         * 获取当前缓存版本号
         * @returns {number}
         */
        getVersion() {
            return this._version;
        }

        /**
         * 设置脏标记
         * @param {string} flag - 标记名称
         * @param {boolean} value - 标记值
         */
        setDirty(flag, value = true) {
            this._dirtyFlags.set(flag, value);
        }

        /**
         * 获取脏标记
         * @param {string} flag - 标记名称
         * @returns {boolean}
         */
        isDirty(flag) {
            return !!this._dirtyFlags.get(flag);
        }

        /**
         * 清除脏标记
         * @param {string} flag - 标记名称
         */
        clearDirty(flag) {
            this._dirtyFlags.set(flag, false);
        }

        /**
         * 获取所有脏标记
         * @returns {Object}
         */
        getDirtyFlags() {
            const result = {};
            this._dirtyFlags.forEach((value, key) => {
                result[key] = value;
            });
            return result;
        }

        /**
         * 清除所有脏标记
         */
        clearAllDirty() {
            this._dirtyFlags.clear();
        }
    }

    // 预定义的缓存名称常量
    const CacheNames = Object.freeze({
        METRICS: 'metrics',
        TREND: 'trend',
        RENDER: 'render',
        STUDENT_STATS: 'studentStats'
    });

    // 预定义的脏标记常量
    const DirtyFlags = Object.freeze({
        DATA: 'data',
        LIST: 'list',
        GRID: 'grid',
        ROSTER: 'roster'
    });

    // 单例实例
    const instance = new CacheManager();

    return {
        instance,
        CacheNames,
        DirtyFlags,
        // 便捷方法
        get: (name, key) => instance.get(name, key),
        set: (name, key, value) => instance.set(name, key, value),
        has: (name, key) => instance.has(name, key),
        clear: (name) => instance.clear(name),
        clearAll: () => instance.clearAll(),
        invalidateAll: () => instance.invalidateAll(),
        setDirty: (flag, value) => instance.setDirty(flag, value),
        isDirty: (flag) => instance.isDirty(flag),
        clearDirty: (flag) => instance.clearDirty(flag),
        getVersion: () => instance.getVersion()
    };
})();

// 导出到全局
if (typeof window !== 'undefined') {
    window.CacheService = CacheService;
}
