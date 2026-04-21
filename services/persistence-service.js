/**
 * 持久化服务模块
 * 统一管理数据的保存、恢复草稿、持久化队列等
 */

const PersistenceService = (function() {
    'use strict';

    class PersistenceManager {
        constructor() {
            // 持久化定时器
            this._persistTimer = 0;
            // 草稿定时器
            this._draftTimer = 0;
            // 草稿脏标记
            this._draftDirty = false;
            // 草稿持久化延迟时间
            this._draftPersistMs = TIMER_DELAY?.DRAFT_PERSIST || 1200;
            // 上一次草稿快照
            this._lastDraftSnapshot = null;
            // 脏标记
            this._dirtyData = false;
            this._dirtyList = false;
        }

        /**
         * 队列持久化操作
         * @param {number} delay - 延迟时间（毫秒）
         */
        queuePersist(delay = 300) {
            clearTimeout(this._persistTimer);
            this._persistTimer = setTimeout(() => this._flushPersist(), delay);
        }

        /**
         * 立即持久化
         * @param {Object} options - 选项
         * @param {boolean} options.includeDraft - 是否包括草稿
         */
        flushPersist(options = {}) {
            clearTimeout(this._persistTimer);
            this._persistTimer = 0;
            this._flushPersist(options);
        }

        /**
         * 内部持久化方法
         * @private
         * @param {Object} options - 选项
         * @param {boolean} options.includeDraft - 是否包括草稿
         */
        _flushPersist(options = {}) {
            if (this._dirtyData) {
                LS?.set?.(KEYS?.DATA, AssignmentService?.exportData?.() || State?.data);
                this._dirtyData = false;
            }
            if (this._dirtyList) {
                LS?.set?.(KEYS?.LIST, RosterService?.getRawList?.() || State?.list);
                this._dirtyList = false;
            }
            if (options.includeDraft) {
                this.flushDraft();
            }
        }

        /**
         * 标记数据为脏
         * @param {boolean} value - 标记值
         */
        markDirtyData(value = true) {
            this._dirtyData = value;
        }

        /**
         * 标记名单为脏
         * @param {boolean} value - 标记值
         */
        markDirtyList(value = true) {
            this._dirtyList = value;
        }

        /**
         * 获取恢复草稿
         * @returns {Object|null}
         */
        getRecoveryDraft() {
            const draft = LS?.get?.(KEYS?.DRAFT, null);
            if (!Validator?.isValidRecoveryDraft?.(draft)) return null;
            return this._cloneRecoveryState(draft);
        }

        /**
         * 克隆恢复记录
         * @param {Object} records
         * @returns {Object}
         */
        _cloneRecoveryRecords(records) {
            const source = records && typeof records === 'object' ? records : {};
            return Object.fromEntries(
                Object.entries(source).map(([id, entry]) => [id, entry && typeof entry === 'object' ? { ...entry } : entry])
            );
        }

        /**
         * 克隆恢复数据
         * @param {Array} data
         * @returns {Array}
         */
        _cloneRecoveryData(data) {
            return (Array.isArray(data) ? data : [])
                .map(item => AssignmentService?.normalize?.(item) || item)
                .filter(Boolean)
                .map(asg => ({
                    id: asg.id,
                    name: asg.name,
                    subject: asg.subject,
                    records: this._cloneRecoveryRecords(asg.records)
                }));
        }

        /**
         * 克隆恢复状态
         * @param {Object} state
         * @returns {Object}
         */
        _cloneRecoveryState(state) {
            const source = state && typeof state === 'object' ? state : {};
            const curId = source.curId == null || source.curId === '' ? null : Number(source.curId);
            return {
                list: Array.isArray(source.list) ? source.list.map(v => String(v ?? '').trim()).filter(Boolean) : [],
                data: this._cloneRecoveryData(source.data),
                prefs: PreferenceService?.normalize?.(source.prefs) || (source.prefs && typeof source.prefs === 'object' ? { ...source.prefs } : {}),
                curId: Number.isFinite(curId) ? curId : null
            };
        }

        /**
         * 获取当前恢复快照
         * @returns {Object}
         */
        getRecoverySnapshot() {
            const list = RosterService?.getRawList?.() || State?.list || [];
            const data = AssignmentService?.exportData?.() || State?.data || [];
            const prefs = PreferenceService?.getPrefs?.() || State?.prefs || {};
            const curId = AssignmentService?.getCurrentId?.() || State?.curId || null;

            return this._cloneRecoveryState({
                list,
                data,
                prefs,
                curId
            });
        }

        /**
         * 比较两个恢复值是否相同
         * @param {*} a
         * @param {*} b
         * @returns {boolean}
         */
        _isSameRecoveryValue(a, b) {
            return a === b || (a == null && b == null);
        }

        /**
         * 比较两个恢复条目是否相同
         * @param {*} a
         * @param {*} b
         * @returns {boolean}
         */
        _isSameRecoveryEntry(a, b) {
            if (a === b) return true;
            const objA = a && typeof a === 'object' ? a : null;
            const objB = b && typeof b === 'object' ? b : null;
            if (!objA || !objB) return objA === objB;
            const keysA = Object.keys(objA);
            const keysB = Object.keys(objB);
            if (keysA.length !== keysB.length) return false;
            return keysA.every(key => this._isSameRecoveryValue(objA[key], objB[key]));
        }

        /**
         * 比较两组恢复记录是否相同
         * @param {Object} a
         * @param {Object} b
         * @returns {boolean}
         */
        _isSameRecoveryRecords(a, b) {
            const recA = a && typeof a === 'object' ? a : {};
            const recB = b && typeof b === 'object' ? b : {};
            const idsA = Object.keys(recA);
            const idsB = Object.keys(recB);
            if (idsA.length !== idsB.length) return false;
            return idsA.every(id => this._isSameRecoveryEntry(recA[id], recB[id]));
        }

        /**
         * 比较两组恢复数据是否相同
         * @param {Array} a
         * @param {Array} b
         * @returns {boolean}
         */
        _isSameRecoveryData(a, b) {
            if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) return false;
            for (let i = 0; i < a.length; i++) {
                const left = a[i];
                const right = b[i];
                if (!left || !right) return false;
                if (left.id !== right.id || left.name !== right.name || left.subject !== right.subject) return false;
                if (!this._isSameRecoveryRecords(left.records, right.records)) return false;
            }
            return true;
        }

        /**
         * 比较两个恢复状态是否相同
         * @param {Object} a
         * @param {Object} b
         * @returns {boolean}
         */
        _isSameRecoveryState(a, b) {
            if (!a || !b) return false;
            if (!Array.isArray(a.list) || !Array.isArray(b.list) || a.list.length !== b.list.length) return false;
            if (a.list.some((item, index) => item !== b.list[index])) return false;
            if (!this._isSameRecoveryData(a.data, b.data)) return false;
            const curA = Number.isFinite(a.curId) ? a.curId : null;
            const curB = Number.isFinite(b.curId) ? b.curId : null;

            const colorA = PreferenceService?.normalize?.(a.prefs)?.cardDoneColor || a.prefs?.cardDoneColor;
            const colorB = PreferenceService?.normalize?.(b.prefs)?.cardDoneColor || b.prefs?.cardDoneColor;

            return curA === curB && colorA === colorB;
        }

        /**
         * 应用恢复草稿
         * @returns {boolean}
         */
        applyRecoveryDraft() {
            const draft = this.getRecoveryDraft();
            if (!draft) return false;

            const current = this.getRecoverySnapshot();
            if (this._isSameRecoveryState(draft, current)) return false;

            // 恢复名单
            if (draft.list.length > 0 && RosterService?.parse) {
                RosterService.parse(draft.list);
                this.markDirtyList(true);
            }

            // 恢复任务
            if (draft.data.length > 0 && AssignmentService?.init) {
                AssignmentService.init(draft.data);
                this.markDirtyData(true);
            }

            // 恢复偏好
            if (draft.prefs && PreferenceService?.setPrefs) {
                PreferenceService.setPrefs(draft.prefs);
            }

            // 恢复当前任务
            if (draft.curId != null && AssignmentService?.select) {
                AssignmentService.select(draft.curId);
            }

            return true;
        }

        /**
         * 队列草稿保存
         */
        queueDraft() {
            clearTimeout(this._draftTimer);
            this._draftDirty = true;
            this._draftTimer = setTimeout(() => this.flushDraft(), this._draftPersistMs);
        }

        /**
         * 立即保存草稿
         * @returns {boolean}
         */
        flushDraft() {
            clearTimeout(this._draftTimer);
            this._draftTimer = 0;
            if (!this._draftDirty) return false;
            this._draftDirty = false;
            return this.saveDraft();
        }

        /**
         * 保存草稿
         * @returns {boolean}
         */
        saveDraft() {
            const snapshot = this.getRecoverySnapshot();
            if (this._lastDraftSnapshot && this._isSameRecoveryState(snapshot, this._lastDraftSnapshot)) return false;
            this._lastDraftSnapshot = this._cloneRecoveryState(snapshot);
            LS?.set?.(KEYS?.DRAFT, { version: 1, updatedAt: Date.now(), ...snapshot });
            return true;
        }

        /**
         * 清空草稿
         */
        clearDraft() {
            this._lastDraftSnapshot = null;
            this._draftDirty = false;
            clearTimeout(this._draftTimer);
            LS?.set?.(KEYS?.DRAFT, null);
        }

        /**
         * 初始化
         */
        init() {
            this._lastDraftSnapshot = this.getRecoverySnapshot();
        }
    }

    // 单例实例
    const instance = new PersistenceManager();

    return {
        instance,
        // 便捷方法
        queuePersist: (delay) => instance.queuePersist(delay),
        flushPersist: (options) => instance.flushPersist(options),
        markDirtyData: (value) => instance.markDirtyData(value),
        markDirtyList: (value) => instance.markDirtyList(value),
        getRecoveryDraft: () => instance.getRecoveryDraft(),
        getRecoverySnapshot: () => instance.getRecoverySnapshot(),
        applyRecoveryDraft: () => instance.applyRecoveryDraft(),
        queueDraft: () => instance.queueDraft(),
        flushDraft: () => instance.flushDraft(),
        saveDraft: () => instance.saveDraft(),
        clearDraft: () => instance.clearDraft(),
        init: () => instance.init()
    };
})();

// 导出到全局
if (typeof window !== 'undefined') {
    window.PersistenceService = PersistenceService;
}
