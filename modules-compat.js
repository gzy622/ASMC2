/**
 * 模块系统兼容性层
 * 
 * 此文件为传统脚本提供对 ES6 模块的访问能力
 * 通过动态导入方式加载模块，保持向后兼容
 */

(function(global) {
    'use strict';

    // 模块缓存
    const moduleCache = new Map();

    /**
     * 动态导入模块
     * @param {string} path - 模块路径
     * @returns {Promise<Object>}
     */
    async function importModule(path) {
        if (moduleCache.has(path)) {
            return moduleCache.get(path);
        }
        
        try {
            const module = await import(path);
            moduleCache.set(path, module);
            return module;
        } catch (err) {
            console.error(`Failed to import module: ${path}`, err);
            throw err;
        }
    }

    /**
     * 初始化模块系统
     */
    async function initModules() {
        try {
            const { state, view, appEvents, Events } = await importModule('./modules/index.js');
            
            // 暴露到全局
            global.ModernState = state;
            global.ModernView = view;
            global.ModernEvents = appEvents;
            global.ModernEventList = Events;
            
            // 标记模块系统就绪
            global._modulesReady = true;
            
            console.log('模块系统兼容性层已加载');
            
            return { state, view, appEvents, Events };
        } catch (err) {
            console.warn('模块系统加载失败，使用传统模式:', err);
            global._modulesReady = false;
            return null;
        }
    }

    // 模块系统 API
    global.ModuleSystem = {
        /**
         * 检查模块系统是否就绪
         * @returns {boolean}
         */
        isReady() {
            return !!global._modulesReady;
        },

        /**
         * 获取状态管理器
         * @returns {Object|null}
         */
        getState() {
            return global.ModernState || null;
        },

        /**
         * 获取视图
         * @returns {Object|null}
         */
        getView() {
            return global.ModernView || null;
        },

        /**
         * 获取事件系统
         * @returns {Object|null}
         */
        getEvents() {
            return global.ModernEvents || null;
        },

        /**
         * 订阅事件
         * @param {string} event
         * @param {Function} callback
         * @returns {Function|null}
         */
        on(event, callback) {
            const events = this.getEvents();
            return events ? events.on(event, callback) : null;
        },

        /**
         * 触发事件
         * @param {string} event
         * @param {*} data
         */
        emit(event, data) {
            const events = this.getEvents();
            if (events) events.emit(event, data);
        },

        /**
         * 初始化
         * @returns {Promise<Object|null>}
         */
        init: initModules
    };

    // 自动初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => ModuleSystem.init());
    } else {
        ModuleSystem.init();
    }

})(globalThis);
