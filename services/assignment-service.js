/**
 * 任务服务模块
 * 管理作业任务的 CRUD 操作和索引
 */

const AssignmentService = (function() {
    'use strict';

    class AssignmentManager {
        constructor() {
            // 任务数据数组
            this._data = [];
            // 任务ID到对象的映射（性能优化）
            this._asgMap = new Map();
            // 任务顺序数组（ID列表）
            this._order = [];
            // 当前任务ID
            this._currentId = null;
            // 版本号
            this._version = 0;
        }

        /**
         * 生成唯一ID
         * @returns {number}
         */
        _generateId() {
            let id = Date.now();
            while (this._asgMap.has(id)) {
                id++;
            }
            return id;
        }

        /**
         * 规范化任务对象
         * @param {Object} asg - 原始任务对象
         * @returns {Object|null}
         */
        normalize(asg) {
            if (!asg || typeof asg !== 'object') return null;
            
            const name = String(asg.name || '').trim();
            const subject = String(asg.subject || '').trim() || 
                           (/英语/.test(name) ? '英语' : '其他');
            const id = Number(asg.id);
            const invalidId = !Number.isFinite(id);
            
            const normalized = {
                id: invalidId ? null : id,
                name: name || '未命名任务',
                subject,
                records: asg.records && typeof asg.records === 'object' 
                    ? asg.records 
                    : {}
            };
            
            if (invalidId) normalized._invalidId = true;
            return normalized;
        }

        /**
         * 确保任务索引映射已构建
         * @private
         */
        _ensureIndex() {
            if (!this._asgMap.size || this._asgMap.size !== this._data.length) {
                this._asgMap = new Map(this._data.map(a => [a.id, a]));
            }
        }

        /**
         * 重建任务索引映射
         */
        rebuildIndex() {
            this._asgMap = new Map(this._data.map(a => [a.id, a]));
        }

        /**
         * 修复异常任务ID
         * @returns {boolean} 是否修复了异常ID
         */
        sanitizeIds() {
            const used = new Set();
            const cleaned = [];
            let repaired = false;

            this._data.forEach(item => {
                const asg = this.normalize(item);
                if (!asg || asg._invalidId) {
                    repaired = true;
                    return;
                }
                if (used.has(asg.id)) {
                    repaired = true;
                    asg.id = this._generateId();
                }
                used.add(asg.id);
                cleaned.push(asg);
            });

            this._data = cleaned;
            this._order = cleaned.map(a => a.id);
            this.rebuildIndex();
            
            return repaired;
        }

        /**
         * 初始化任务数据
         * @param {Object[]} data - 任务数据数组
         */
        init(data) {
            this._data = Array.isArray(data) 
                ? data.map(a => this.normalize(a)).filter(Boolean)
                : [];
            
            this.sanitizeIds();
            
            // 确保至少有一个任务
            if (this._data.length === 0) {
                this.create('任务 1');
            }
            
            // 设置当前任务
            if (!this._asgMap.has(this._currentId)) {
                this._currentId = this._order[0] || null;
            }
            
            this._version++;
        }

        /**
         * 创建新任务
         * @param {string} name - 任务名称
         * @returns {Object} 新创建的任务
         */
        create(name) {
            const id = this._generateId();
            const subject = /英语/.test(name) ? '英语' : '其他';
            
            const asg = {
                id,
                name: String(name || '').trim() || '未命名任务',
                subject,
                records: {}
            };
            
            this._data.push(asg);
            this._order.push(id);
            this._asgMap.set(id, asg);
            this._currentId = id;
            this._version++;
            
            return asg;
        }

        /**
         * 选择任务
         * @param {number} id - 任务ID
         * @returns {boolean}
         */
        select(id) {
            if (!this._asgMap.has(id)) return false;
            this._currentId = id;
            return true;
        }

        /**
         * 重命名任务
         * @param {number} id - 任务ID
         * @param {string} name - 新名称
         * @returns {boolean}
         */
        rename(id, name) {
            const asg = this._asgMap.get(id);
            if (!asg) return false;
            
            asg.name = String(name || '').trim() || asg.name;
            return true;
        }

        /**
         * 更新任务元数据
         * @param {number} id - 任务ID
         * @param {Object} payload - 更新数据
         * @returns {boolean}
         */
        updateMeta(id, payload = {}) {
            const asg = this._asgMap.get(id);
            if (!asg) return false;
            
            if (payload.name !== undefined) {
                asg.name = String(payload.name || '').trim() || asg.name;
            }
            if (payload.subject !== undefined) {
                asg.subject = String(payload.subject || '').trim();
            }
            
            return true;
        }

        /**
         * 删除任务
         * @param {number} id - 任务ID
         * @returns {boolean}
         */
        remove(id) {
            if (this._data.length <= 1) return false;
            
            const idx = this._order.indexOf(id);
            if (idx === -1) return false;
            
            this._asgMap.delete(id);
            this._order.splice(idx, 1);
            this._data = this._data.filter(a => a.id !== id);
            
            if (this._currentId === id) {
                const newIdx = Math.max(0, idx - 1);
                this._currentId = this._order[newIdx] || null;
            }
            
            this._version++;
            return true;
        }

        /**
         * 获取任务
         * @param {number} id - 任务ID
         * @returns {Object|undefined}
         */
        get(id) {
            return this._asgMap.get(id);
        }

        /**
         * 获取当前任务
         * @returns {Object|undefined}
         */
        getCurrent() {
            return this._asgMap.get(this._currentId);
        }

        /**
         * 获取当前任务ID
         * @returns {number|null}
         */
        getCurrentId() {
            return this._currentId;
        }

        /**
         * 设置当前任务ID
         * @param {number} id - 任务ID
         */
        setCurrentId(id) {
            this._currentId = id;
        }

        /**
         * 获取所有任务
         * @returns {Object[]}
         */
        getAll() {
            return [...this._data];
        }

        /**
         * 获取任务数量
         * @returns {number}
         */
        getCount() {
            return this._data.length;
        }

        /**
         * 检查任务是否存在
         * @param {number} id - 任务ID
         * @returns {boolean}
         */
        has(id) {
            return this._asgMap.has(id);
        }

        /**
         * 获取任务科目
         * @param {Object} asg - 任务对象
         * @returns {string}
         */
        getSubject(asg) {
            return String(asg?.subject || '').trim() || 
                   (/英语/.test(asg?.name || '') ? '英语' : '其他');
        }

        /**
         * 检查是否为英语任务
         * @param {Object} asg - 任务对象
         * @returns {boolean}
         */
        isEnglish(asg) {
            return this.getSubject(asg) === '英语';
        }

        /**
         * 更新学生记录
         * @param {number} asgId - 任务ID
         * @param {string} studentId - 学生ID
         * @param {Object} data - 记录数据
         * @returns {boolean}
         */
        updateRecord(asgId, studentId, data) {
            const asg = this._asgMap.get(asgId);
            if (!asg) return false;
            
            const record = asg.records[studentId] || { done: false };
            asg.records[studentId] = { ...record, ...data };
            
            return true;
        }

        /**
         * 获取学生记录
         * @param {number} asgId - 任务ID
         * @param {string} studentId - 学生ID
         * @returns {Object|undefined}
         */
        getRecord(asgId, studentId) {
            const asg = this._asgMap.get(asgId);
            return asg?.records?.[studentId];
        }

        /**
         * 切换完成状态
         * @param {number} asgId - 任务ID
         * @param {string} studentId - 学生ID
         * @returns {Object|null} 更新后的记录或null
         */
        toggleDone(asgId, studentId) {
            const asg = this._asgMap.get(asgId);
            if (!asg) return null;
            
            const record = asg.records[studentId] || {};
            const updated = { ...record, done: !record.done };
            asg.records[studentId] = updated;
            
            return updated;
        }

        /**
         * 获取任务统计数据
         * @param {number} asgId - 任务ID
         * @param {number} totalStudents - 学生总数
         * @returns {Object} {total, done, pending, percentage}
         */
        getMetrics(asgId, totalStudents) {
            const asg = this._asgMap.get(asgId);
            if (!asg) return { total: 0, done: 0, pending: 0, percentage: 0 };
            
            const records = asg.records || {};
            const done = Object.values(records).filter(r => r.done).length;
            const total = totalStudents || 0;
            
            return {
                total,
                done,
                pending: total - done,
                percentage: total > 0 ? Math.round((done / total) * 100) : 0
            };
        }

        /**
         * 反选任务中的所有学生
         * @param {number} asgId - 任务ID
         * @param {string[]} studentIds - 学生ID列表
         * @returns {boolean}
         */
        invertSelection(asgId, studentIds) {
            const asg = this._asgMap.get(asgId);
            if (!asg) return false;
            
            studentIds.forEach(id => {
                const record = asg.records[id] || {};
                asg.records[id] = { ...record, done: !record.done };
            });
            
            return true;
        }

        /**
         * 获取版本号
         * @returns {number}
         */
        getVersion() {
            return this._version;
        }

        /**
         * 导出数据（用于持久化）
         * @returns {Object[]}
         */
        exportData() {
            return this._data.map(asg => ({
                id: asg.id,
                name: asg.name,
                subject: asg.subject,
                records: { ...asg.records }
            }));
        }
    }

    // 单例实例
    const instance = new AssignmentManager();

    return {
        instance,
        // 便捷方法
        init: (data) => instance.init(data),
        create: (name) => instance.create(name),
        select: (id) => instance.select(id),
        rename: (id, name) => instance.rename(id, name),
        updateMeta: (id, payload) => instance.updateMeta(id, payload),
        remove: (id) => instance.remove(id),
        get: (id) => instance.get(id),
        getCurrent: () => instance.getCurrent(),
        getCurrentId: () => instance.getCurrentId(),
        setCurrentId: (id) => instance.setCurrentId(id),
        getAll: () => instance.getAll(),
        getCount: () => instance.getCount(),
        has: (id) => instance.has(id),
        getSubject: (asg) => instance.getSubject(asg),
        isEnglish: (asg) => instance.isEnglish(asg),
        updateRecord: (asgId, studentId, data) => instance.updateRecord(asgId, studentId, data),
        getRecord: (asgId, studentId) => instance.getRecord(asgId, studentId),
        toggleDone: (asgId, studentId) => instance.toggleDone(asgId, studentId),
        getMetrics: (asgId, total) => instance.getMetrics(asgId, total),
        invertSelection: (asgId, studentIds) => instance.invertSelection(asgId, studentIds),
        sanitizeIds: () => instance.sanitizeIds(),
        normalize: (asg) => instance.normalize(asg),
        exportData: () => instance.exportData(),
        getVersion: () => instance.getVersion()
    };
})();

// 导出到全局
if (typeof window !== 'undefined') {
    window.AssignmentService = AssignmentService;
}
