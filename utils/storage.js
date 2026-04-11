/**
 * 存储工具库
 * 提供 localStorage 封装和键值管理
 */

/**
 * 存储键名常量
 */
export const KEYS = {
    /** 任务数据 */
    DATA: 'tracker_db',
    /** 名单数据 */
    LIST: 'tracker_roster',
    /** 动画设置 */
    ANIM: 'tracker_anim',
    /** 用户偏好设置 */
    PREFS: 'tracker_prefs',
    /** 恢复草稿 */
    DRAFT: 'tracker_recovery_draft',
    /** 记分板快速十分设置 */
    SCOREPAD_FAST_TEN: 'tracker_scorepad_fast_ten'
};

/**
 * 存储操作日志
 * @param {string} action - 操作类型
 * @param {string} key - 键名
 * @param {Error} [err] - 错误对象
 */
const logStorage = (action, key, err) => {
    const msg = `[LS.${action}] key=${key}${err ? ` error=${err.message}` : ''}`;
    if (err || action === 'get') console.warn(msg);
};

/**
 * localStorage 封装对象
 */
export const LS = {
    /**
     * 获取存储值
     * @param {string} key - 键名
     * @param {*} [defaultValue] - 默认值
     * @returns {*}
     */
    get(key, defaultValue) {
        const raw = localStorage.getItem(key);
        if (raw == null) {
            return defaultValue;
        }
        try {
            const val = JSON.parse(raw);
            return val;
        } catch (err) {
            logStorage('get', key, err);
            return defaultValue;
        }
    },

    /**
     * 设置存储值
     * @param {string} key - 键名
     * @param {*} value - 值
     */
    set(key, value) {
        try {
            const nextRaw = JSON.stringify(value);
            if (localStorage.getItem(key) === nextRaw) return;
            localStorage.setItem(key, nextRaw);
        } catch (err) {
            logStorage('set', key, err);
        }
    },

    /**
     * 移除存储值
     * @param {string} key - 键名
     */
    remove(key) {
        try {
            localStorage.removeItem(key);
        } catch (err) {
            logStorage('remove', key, err);
        }
    },

    /**
     * 清空所有存储
     */
    clear() {
        try {
            localStorage.clear();
        } catch (err) {
            logStorage('clear', '*', err);
        }
    },

    /**
     * 检查键是否存在
     * @param {string} key - 键名
     * @returns {boolean}
     */
    has(key) {
        return localStorage.getItem(key) !== null;
    },

    /**
     * 获取原始字符串值
     * @param {string} key - 键名
     * @returns {string|null}
     */
    getRaw(key) {
        return localStorage.getItem(key);
    },

    /**
     * 设置原始字符串值
     * @param {string} key - 键名
     * @param {string} value - 值
     */
    setRaw(key, value) {
        try {
            localStorage.setItem(key, value);
        } catch (err) {
            logStorage('setRaw', key, err);
        }
    }
};

/**
 * SessionStorage 封装对象
 */
export const SS = {
    /**
     * 获取存储值
     * @param {string} key - 键名
     * @param {*} [defaultValue] - 默认值
     * @returns {*}
     */
    get(key, defaultValue) {
        const raw = sessionStorage.getItem(key);
        if (raw == null) {
            return defaultValue;
        }
        try {
            return JSON.parse(raw);
        } catch (err) {
            console.warn(`[SS.get] key=${key} error=${err.message}`);
            return defaultValue;
        }
    },

    /**
     * 设置存储值
     * @param {string} key - 键名
     * @param {*} value - 值
     */
    set(key, value) {
        try {
            sessionStorage.setItem(key, JSON.stringify(value));
        } catch (err) {
            console.warn(`[SS.set] key=${key} error=${err.message}`);
        }
    },

    /**
     * 移除存储值
     * @param {string} key - 键名
     */
    remove(key) {
        try {
            sessionStorage.removeItem(key);
        } catch (err) {
            console.warn(`[SS.remove] key=${key} error=${err.message}`);
        }
    },

    /**
     * 清空所有存储
     */
    clear() {
        try {
            sessionStorage.clear();
        } catch (err) {
            console.warn(`[SS.clear] error=${err.message}`);
        }
    }
};

/**
 * 内存缓存存储
 * 用于临时数据存储，页面刷新后丢失
 */
export const MemoryStorage = {
    _store: new Map(),

    /**
     * 获取值
     * @param {string} key - 键名
     * @param {*} [defaultValue] - 默认值
     * @returns {*}
     */
    get(key, defaultValue) {
        return this._store.has(key) ? this._store.get(key) : defaultValue;
    },

    /**
     * 设置值
     * @param {string} key - 键名
     * @param {*} value - 值
     */
    set(key, value) {
        this._store.set(key, value);
    },

    /**
     * 移除值
     * @param {string} key - 键名
     */
    remove(key) {
        this._store.delete(key);
    },

    /**
     * 清空所有值
     */
    clear() {
        this._store.clear();
    },

    /**
     * 检查键是否存在
     * @param {string} key - 键名
     * @returns {boolean}
     */
    has(key) {
        return this._store.has(key);
    },

    /**
     * 获取所有键
     * @returns {string[]}
     */
    keys() {
        return Array.from(this._store.keys());
    },

    /**
     * 获取存储大小
     * @returns {number}
     */
    size() {
        return this._store.size;
    }
};

/**
 * 带过期时间的存储
 */
export const ExpirableStorage = {
    /**
     * 设置带过期时间的值
     * @param {string} key - 键名
     * @param {*} value - 值
     * @param {number} ttl - 过期时间（毫秒）
     */
    set(key, value, ttl) {
        const item = {
            value,
            expiry: Date.now() + ttl
        };
        LS.set(key, item);
    },

    /**
     * 获取值（自动检查过期）
     * @param {string} key - 键名
     * @param {*} [defaultValue] - 默认值
     * @returns {*}
     */
    get(key, defaultValue) {
        const item = LS.get(key);
        if (!item) return defaultValue;
        if (Date.now() > item.expiry) {
            LS.remove(key);
            return defaultValue;
        }
        return item.value;
    },

    /**
     * 检查键是否有效（未过期）
     * @param {string} key - 键名
     * @returns {boolean}
     */
    isValid(key) {
        const item = LS.get(key);
        if (!item) return false;
        if (Date.now() > item.expiry) {
            LS.remove(key);
            return false;
        }
        return true;
    }
};

/**
 * 存储命名空间
 * 为不同模块创建隔离的存储空间
 * @param {string} namespace - 命名空间
 * @returns {Object}
 */
export const createNamespace = (namespace) => {
    const prefix = `${namespace}:`;
    
    return {
        /**
         * 获取完整键名
         * @param {string} key - 键名
         * @returns {string}
         */
        _key(key) {
            return prefix + key;
        },

        /**
         * 获取值
         * @param {string} key - 键名
         * @param {*} [defaultValue] - 默认值
         * @returns {*}
         */
        get(key, defaultValue) {
            return LS.get(this._key(key), defaultValue);
        },

        /**
         * 设置值
         * @param {string} key - 键名
         * @param {*} value - 值
         */
        set(key, value) {
            LS.set(this._key(key), value);
        },

        /**
         * 移除值
         * @param {string} key - 键名
         */
        remove(key) {
            LS.remove(this._key(key));
        },

        /**
         * 清空命名空间下的所有值
         */
        clear() {
            const keys = [];
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith(prefix)) {
                    keys.push(key);
                }
            }
            keys.forEach(key => localStorage.removeItem(key));
        },

        /**
         * 获取所有键
         * @returns {string[]}
         */
        keys() {
            const keys = [];
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith(prefix)) {
                    keys.push(key.slice(prefix.length));
                }
            }
            return keys;
        }
    };
};

// 默认导出所有工具
export default {
    KEYS,
    LS,
    SS,
    MemoryStorage,
    ExpirableStorage,
    createNamespace
};
