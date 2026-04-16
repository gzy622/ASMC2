/**
 * 模块加载器
 * 解决"脚本顺序 + 全局对象"强依赖问题
 * 
 * 设计原则：
 * 1. 显式声明依赖关系，而非隐式依赖加载顺序
 * 2. 模块通过依赖注入获取依赖，而非全局对象
 * 3. 保持向后兼容，现有代码无需修改即可运行
 */

(function(global) {
    'use strict';

    // 模块注册表
    const registry = new Map();
    // 已加载的模块
    const loaded = new Map();
    // 加载中的模块（防止循环依赖）
    const loading = new Set();

    /**
     * 定义模块
     * @param {string} name - 模块名
     * @param {string[]} deps - 依赖模块名列表
     * @param {Function} factory - 模块工厂函数，接收依赖作为参数
     */
    function define(name, deps, factory) {
        if (registry.has(name)) {
            console.warn(`Module ${name} already defined, overwriting`);
        }
        registry.set(name, { name, deps, factory });
    }

    /**
     * 同步获取模块（仅对已加载模块有效）
     * @param {string} name - 模块名
     * @returns {any}
     */
    function require(name) {
        if (!loaded.has(name)) {
            throw new Error(`Module ${name} not loaded. Use load() to load it first.`);
        }
        return loaded.get(name);
    }

    /**
     * 异步加载模块及其所有依赖
     * @param {string} name - 模块名
     * @returns {Promise<any>}
     */
    async function load(name) {
        // 已加载直接返回
        if (loaded.has(name)) {
            return loaded.get(name);
        }

        // 检查循环依赖
        if (loading.has(name)) {
            throw new Error(`Circular dependency detected: ${name}`);
        }

        // 检查模块是否已注册
        const mod = registry.get(name);
        if (!mod) {
            throw new Error(`Module ${name} not defined`);
        }

        // 标记为加载中
        loading.add(name);

        try {
            // 递归加载依赖
            const depModules = [];
            for (const depName of mod.deps) {
                const dep = await load(depName);
                depModules.push(dep);
            }

            // 执行工厂函数
            const exports = mod.factory(...depModules);
            
            // 缓存结果
            loaded.set(name, exports);
            
            console.log(`[ModuleLoader] Loaded: ${name}`);
            
            return exports;
        } finally {
            loading.delete(name);
        }
    }

    /**
     * 批量加载多个模块
     * @param {string[]} names - 模块名列表
     * @returns {Promise<Object>} - 模块名到导出的映射
     */
    async function loadAll(names) {
        const result = {};
        for (const name of names) {
            result[name] = await load(name);
        }
        return result;
    }

    /**
     * 检查模块是否已加载
     * @param {string} name - 模块名
     * @returns {boolean}
     */
    function isLoaded(name) {
        return loaded.has(name);
    }

    /**
     * 获取已注册的所有模块名
     * @returns {string[]}
     */
    function getRegisteredModules() {
        return Array.from(registry.keys());
    }

    /**
     * 获取已加载的所有模块名
     * @returns {string[]}
     */
    function getLoadedModules() {
        return Array.from(loaded.keys());
    }

    // 导出模块加载器 API
    global.ModuleLoader = {
        define,
        require,
        load,
        loadAll,
        isLoaded,
        getRegisteredModules,
        getLoadedModules
    };

})(globalThis);
