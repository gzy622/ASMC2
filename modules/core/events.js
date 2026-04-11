/**
 * 事件系统模块
 * 提供应用内的事件订阅/发布机制
 */

class EventBus {
    constructor() {
        this._listeners = new Map();
    }

    /**
     * 订阅事件
     * @param {string} event - 事件名称
     * @param {Function} callback - 回调函数
     * @returns {Function} 取消订阅函数
     */
    on(event, callback) {
        if (!this._listeners.has(event)) {
            this._listeners.set(event, new Set());
        }
        this._listeners.get(event).add(callback);
        
        return () => this.off(event, callback);
    }

    /**
     * 取消订阅
     * @param {string} event - 事件名称
     * @param {Function} callback - 回调函数
     */
    off(event, callback) {
        const listeners = this._listeners.get(event);
        if (listeners) {
            listeners.delete(callback);
        }
    }

    /**
     * 触发事件
     * @param {string} event - 事件名称
     * @param {*} data - 事件数据
     */
    emit(event, data) {
        const listeners = this._listeners.get(event);
        if (listeners) {
            listeners.forEach(callback => {
                try {
                    callback(data);
                } catch (err) {
                    console.error(`Event handler error for "${event}":`, err);
                }
            });
        }
    }

    /**
     * 订阅一次性事件
     * @param {string} event - 事件名称
     * @param {Function} callback - 回调函数
     */
    once(event, callback) {
        const unsubscribe = this.on(event, (data) => {
            unsubscribe();
            callback(data);
        });
    }

    /**
     * 清除所有监听器
     */
    clear() {
        this._listeners.clear();
    }
}

// 应用级事件总线
export const appEvents = new EventBus();

// 预定义事件名称
export const Events = Object.freeze({
    // 状态事件
    STATE_INITIALIZED: 'state:initialized',
    STATE_CHANGED: 'state:changed',
    STATE_PERSISTED: 'state:persisted',
    
    // 数据事件
    DATA_LOADED: 'data:loaded',
    DATA_SAVED: 'data:saved',
    DRAFT_SAVED: 'draft:saved',
    DRAFT_RESTORED: 'draft:restored',
    
    // 任务事件
    ASG_CREATED: 'asg:created',
    ASG_UPDATED: 'asg:updated',
    ASG_DELETED: 'asg:deleted',
    ASG_SELECTED: 'asg:selected',
    
    // 记录事件
    RECORD_UPDATED: 'record:updated',
    RECORDS_CLEARED: 'records:cleared',
    
    // 视图事件
    VIEW_READY: 'view:ready',
    VIEW_RENDERED: 'view:rendered',
    GRID_DIRTY: 'view:grid:dirty',
    
    // UI 事件
    MODAL_OPENED: 'ui:modal:opened',
    MODAL_CLOSED: 'ui:modal:closed',
    MENU_TOGGLED: 'ui:menu:toggled',
    SCOREPAD_OPENED: 'ui:scorepad:opened',
    SCOREPAD_CLOSED: 'ui:scorepad:closed'
});

export default EventBus;
