/**
 * 状态管理模块
 * 集中管理应用状态，提供响应式数据流
 */

import { 
    TIMER_DELAY, 
    CACHE, 
    DEFAULTS,
    Events 
} from '../core/constants.js';
import { appEvents } from '../core/events.js';
import { LS } from './storage.js';
import { 
    Student, 
    Assignment, 
    Preferences, 
    RecoveryDraft,
    IdGenerator 
} from './models.js';

/**
 * 应用状态管理类
 */
export class AppState {
    constructor() {
        // 核心数据
        this._students = []; // Student[]
        this._assignments = new Map(); // Map<id, Assignment>
        this._assignmentOrder = []; // id[]
        this._currentId = null;
        this._prefs = new Preferences();
        
        // 内部状态
        this._initialized = false;
        this._persistTimer = null;
        this._draftTimer = null;
        this._draftDirty = false;
        this._cacheVersion = 0;
        this._metricsCache = new Map();
        
        // 脏标记
        this._dirtyData = false;
        this._dirtyList = false;
    }

    // ============ Getters ============
    
    get initialized() { return this._initialized; }
    get students() { return [...this._students]; }
    get assignments() { return this._assignmentOrder.map(id => this._assignments.get(id)).filter(Boolean); }
    get currentAssignment() { return this._assignments.get(this._currentId) || this.assignments[0] || null; }
    get currentId() { return this._currentId; }
    get preferences() { return this._prefs; }
    get studentCount() { return this._students.length; }
    get assignmentCount() { return this._assignmentOrder.length; }

    // ============ 初始化 ============

    /**
     * 初始化状态
     * @returns {Promise<void>}
     */
    async init() {
        if (this._initialized) return;

        // 加载基本数据
        const listData = LS.get('LIST', DEFAULTS.ROSTER);
        const animData = LS.get('ANIM', true);
        const prefsData = LS.get('PREFS', {});
        
        this._prefs = new Preferences({ ...prefsData, animations: animData });
        this._parseRoster(listData);
        
        // 延迟加载任务数据
        setTimeout(() => {
            this._loadAssignments();
            this._applyRecoveryDraft();
            this._initialized = true;
            appEvents.emit(Events.STATE_INITIALIZED, { state: this });
        }, 100);
    }

    /**
     * 解析名单
     * @private
     */
    _parseRoster(list) {
        this._students = list
            .map(line => Student.parse(line))
            .filter(s => s.isValid());
        
        // 检查重复 ID
        const seen = new Set();
        const duplicates = [];
        this._students.forEach(s => {
            if (seen.has(s.id)) duplicates.push(s.id);
            seen.add(s.id);
        });
        
        if (duplicates.length > 0) {
            throw new Error(`名单存在重复学号: ${duplicates.join('、')}`);
        }
    }

    /**
     * 加载任务数据
     * @private
     */
    _loadAssignments() {
        const data = LS.get('DATA', []);
        
        this._assignments.clear();
        this._assignmentOrder = [];
        
        data.forEach(item => {
            const asg = Assignment.fromJSON(item);
            this._assignments.set(asg.id, asg);
            this._assignmentOrder.push(asg.id);
        });
        
        // 确保至少有一个任务
        if (this._assignments.size === 0) {
            this.createAssignment('任务 1');
        }
        
        // 设置当前任务
        if (!this._assignments.has(this._currentId)) {
            this._currentId = this._assignmentOrder[0];
        }
    }

    /**
     * 应用恢复草稿
     * @private
     */
    _applyRecoveryDraft() {
        const draftData = LS.get('DRAFT', null);
        const draft = RecoveryDraft.fromJSON(draftData);
        
        if (!draft) return false;
        
        // 恢复名单
        if (draft.list.length > 0) {
            this._parseRoster(draft.list);
            this._dirtyList = true;
        }
        
        // 恢复任务
        if (draft.data.length > 0) {
            this._assignments.clear();
            this._assignmentOrder = [];
            draft.data.forEach(item => {
                const asg = Assignment.fromJSON(item);
                this._assignments.set(asg.id, asg);
                this._assignmentOrder.push(asg.id);
            });
            this._dirtyData = true;
        }
        
        // 恢复偏好设置
        if (draft.prefs) {
            this._prefs = new Preferences(draft.prefs);
        }
        
        // 恢复当前任务
        if (draft.curId != null && this._assignments.has(draft.curId)) {
            this._currentId = draft.curId;
        }
        
        appEvents.emit(Events.DRAFT_RESTORED, { draft });
        return true;
    }

    // ============ 任务操作 ============

    /**
     * 创建任务
     * @param {string} name
     * @returns {Assignment}
     */
    createAssignment(name) {
        const asg = new Assignment({ name });
        this._assignments.set(asg.id, asg);
        this._assignmentOrder.push(asg.id);
        this._currentId = asg.id;
        this._dirtyData = true;
        
        this._queuePersist();
        this._queueDraft();
        
        appEvents.emit(Events.ASG_CREATED, { assignment: asg });
        return asg;
    }

    /**
     * 选择任务
     * @param {number} id
     * @returns {boolean}
     */
    selectAssignment(id) {
        if (!this._assignments.has(id)) return false;
        
        this._currentId = id;
        this._invalidateCache();
        
        appEvents.emit(Events.ASG_SELECTED, { assignment: this.currentAssignment });
        return true;
    }

    /**
     * 更新任务
     * @param {number} id
     * @param {Object} updates
     * @returns {boolean}
     */
    updateAssignment(id, updates) {
        const asg = this._assignments.get(id);
        if (!asg) return false;
        
        asg.updateMeta(updates);
        this._dirtyData = true;
        
        this._queuePersist();
        this._queueDraft();
        
        appEvents.emit(Events.ASG_UPDATED, { assignment: asg, updates });
        return true;
    }

    /**
     * 删除任务
     * @param {number} id
     * @returns {boolean}
     */
    deleteAssignment(id) {
        if (this._assignments.size <= 1) return false;
        
        const idx = this._assignmentOrder.indexOf(id);
        if (idx === -1) return false;
        
        this._assignments.delete(id);
        this._assignmentOrder.splice(idx, 1);
        
        if (this._currentId === id) {
            const newIdx = Math.max(0, idx - 1);
            this._currentId = this._assignmentOrder[newIdx];
        }
        
        this._dirtyData = true;
        this._invalidateCache();
        
        this._queuePersist();
        this._queueDraft();
        
        appEvents.emit(Events.ASG_DELETED, { id });
        return true;
    }

    // ============ 记录操作 ============

    /**
     * 更新学生记录
     * @param {string} studentId
     * @param {Object} data
     * @returns {boolean}
     */
    updateRecord(studentId, data) {
        const asg = this.currentAssignment;
        if (!asg) return false;
        
        const record = asg.getRecord(studentId) || { done: false };
        const updated = { ...record, ...data, updatedAt: Date.now() };
        
        asg.setRecord(studentId, updated);
        this._dirtyData = true;
        
        this._invalidateCache();
        this._queuePersist();
        this._queueDraft();
        
        appEvents.emit(Events.RECORD_UPDATED, { 
            studentId, 
            assignmentId: asg.id,
            record: updated 
        });
        
        return true;
    }

    /**
     * 切换完成状态
     * @param {string} studentId
     * @returns {boolean}
     */
    toggleDone(studentId) {
        const asg = this.currentAssignment;
        if (!asg) return false;
        
        const record = asg.getRecord(studentId) || {};
        return this.updateRecord(studentId, { done: !record.done });
    }

    /**
     * 反选当前任务
     */
    invertSelection() {
        const asg = this.currentAssignment;
        if (!asg) return;
        
        this._students.forEach(student => {
            if (asg.includesStudent(student)) {
                const record = asg.getRecord(student.id) || {};
                asg.setRecord(student.id, { ...record, done: !record.done });
            }
        });
        
        this._dirtyData = true;
        this._invalidateCache();
        this._queuePersist();
        this._queueDraft();
        
        appEvents.emit(Events.RECORDS_CLEARED, { assignmentId: asg.id });
    }

    // ============ 持久化 ============

    /**
     * 队列持久化
     * @private
     */
    _queuePersist() {
        clearTimeout(this._persistTimer);
        this._persistTimer = setTimeout(() => this._persist(), TIMER_DELAY.PERSIST);
    }

    /**
     * 立即持久化
     * @private
     */
    _persist() {
        clearTimeout(this._persistTimer);
        
        if (this._dirtyData) {
            const data = this.assignments.map(a => a.toJSON());
            LS.set('DATA', data);
            this._dirtyData = false;
        }
        
        if (this._dirtyList) {
            LS.set('LIST', this._students.map(s => `${s.id} ${s.name}`.trim()));
            this._dirtyList = false;
        }
        
        appEvents.emit(Events.STATE_PERSISTED, {});
    }

    /**
     * 队列草稿保存
     * @private
     */
    _queueDraft() {
        clearTimeout(this._draftTimer);
        this._draftDirty = true;
        this._draftTimer = setTimeout(() => this._saveDraft(), TIMER_DELAY.DRAFT_PERSIST);
    }

    /**
     * 保存恢复草稿
     * @private
     */
    _saveDraft() {
        clearTimeout(this._draftTimer);
        if (!this._draftDirty) return;
        
        this._draftDirty = false;
        
        const draft = new RecoveryDraft({
            list: this._students.map(s => `${s.id} ${s.name}`.trim()),
            data: this.assignments.map(a => a.toJSON()),
            prefs: this._prefs.toJSON(),
            curId: this._currentId
        });
        
        LS.set('DRAFT', draft.toJSON());
        appEvents.emit(Events.DRAFT_SAVED, { draft });
    }

    // ============ 缓存管理 ============

    /**
     * 使缓存失效
     * @private
     */
    _invalidateCache() {
        this._cacheVersion++;
        if (this._metricsCache.size >= CACHE.MAX_METRICS_SIZE) {
            this._metricsCache.clear();
        }
    }

    /**
     * 获取任务统计（带缓存）
     * @param {Assignment} asg
     * @returns {Object}
     */
    getMetrics(asg) {
        const cached = this._metricsCache.get(asg.id);
        if (cached && cached.version === this._cacheVersion) {
            return cached.metrics;
        }
        
        const metrics = asg.getMetrics(this._students);
        this._metricsCache.set(asg.id, { version: this._cacheVersion, metrics });
        return metrics;
    }

    // ============ 偏好设置 ============

    /**
     * 更新偏好设置
     * @param {Object} updates
     */
    updatePreferences(updates) {
        this._prefs.update(updates);
        LS.set('PREFS', this._prefs.toJSON());
        LS.set('ANIM', this._prefs.animations);
    }

    // ============ 导出/导入 ============

    /**
     * 导出所有数据
     * @returns {Object}
     */
    export() {
        return {
            version: 1,
            exportedAt: Date.now(),
            list: this._students.map(s => s.toJSON()),
            data: this.assignments.map(a => a.toJSON()),
            prefs: this._prefs.toJSON()
        };
    }

    /**
     * 导入数据
     * @param {Object} data
     * @returns {boolean}
     */
    import(data) {
        if (!data || typeof data !== 'object') return false;
        
        // 导入名单
        if (Array.isArray(data.list)) {
            this._students = data.list
                .map(s => Student.fromJSON(s))
                .filter(s => s.isValid());
            this._dirtyList = true;
        }
        
        // 导入任务
        if (Array.isArray(data.data)) {
            this._assignments.clear();
            this._assignmentOrder = [];
            data.data.forEach(item => {
                const asg = Assignment.fromJSON(item);
                this._assignments.set(asg.id, asg);
                this._assignmentOrder.push(asg.id);
            });
            this._currentId = this._assignmentOrder[0] || null;
            this._dirtyData = true;
        }
        
        // 导入偏好设置
        if (data.prefs) {
            this._prefs = new Preferences(data.prefs);
        }
        
        this._invalidateCache();
        this._persist();
        
        appEvents.emit(Events.DATA_LOADED, { state: this });
        return true;
    }
}

// 单例实例
export const state = new AppState();

export default AppState;
