/**
 * 数据模型模块
 * 定义应用中使用的数据结构和类型
 */

import { DEFAULTS, REGEX } from '../core/constants.js';

/**
 * ID 生成器
 */
export class IdGenerator {
    static _used = new Set();

    /**
     * 生成唯一 ID
     * @param {Function} exists - 检查 ID 是否存在的函数
     * @returns {number}
     */
    static generate(exists = (id) => this._used.has(id)) {
        let id;
        do {
            id = Date.now() + Math.floor(Math.random() * 1000);
        } while (exists(id));
        this._used.add(id);
        return id;
    }

    /**
     * 清除已使用的 ID 记录
     */
    static clear() {
        this._used.clear();
    }
}

/**
 * 学生记录类
 */
export class StudentRecord {
    constructor(data = {}) {
        this.done = data.done ?? false;
        this.score = data.score ?? null;
        this.note = data.note ?? '';
        this.updatedAt = data.updatedAt ?? Date.now();
    }

    /**
     * 检查是否为空记录
     * @returns {boolean}
     */
    isEmpty() {
        return !this.done && (this.score == null || this.score === '') && !this.note;
    }

    /**
     * 转换为纯对象
     * @returns {Object}
     */
    toJSON() {
        const result = {};
        if (this.done) result.done = true;
        if (this.score != null && this.score !== '') result.score = this.score;
        if (this.note) result.note = this.note;
        return result;
    }

    /**
     * 从纯对象创建
     * @param {Object} data
     * @returns {StudentRecord}
     */
    static fromJSON(data) {
        return new StudentRecord(data);
    }
}

/**
 * 学生类
 */
export class Student {
    constructor(data = {}) {
        this.id = String(data.id ?? '').trim();
        this.name = String(data.name ?? '').trim();
        this.noEnglish = data.noEnglish ?? false;
    }

    /**
     * 检查是否有效
     * @returns {boolean}
     */
    isValid() {
        return !!this.id;
    }

    /**
     * 获取显示名称
     * @returns {string}
     */
    getDisplayName() {
        return this.name || this.id;
    }

    /**
     * 转换为纯对象
     * @returns {Object}
     */
    toJSON() {
        const result = { id: this.id };
        if (this.name) result.name = this.name;
        if (this.noEnglish) result.noEnglish = true;
        return result;
    }

    /**
     * 从字符串解析
     * @param {string} line
     * @returns {Student}
     */
    static parse(line) {
        const lineText = String(line ?? '').trim();
        const noEnglish = REGEX.NO_ENGLISH.test(lineText);
        const cleanLine = lineText.replace(REGEX.NO_ENGLISH, '').trim();
        const spaceIndex = cleanLine.indexOf(' ');
        
        if (spaceIndex === -1) {
            return new Student({ id: cleanLine, name: '', noEnglish });
        }
        return new Student({
            id: cleanLine.slice(0, spaceIndex),
            name: cleanLine.slice(spaceIndex + 1),
            noEnglish
        });
    }

    /**
     * 从纯对象创建
     * @param {Object} data
     * @returns {Student}
     */
    static fromJSON(data) {
        return new Student(data);
    }
}

/**
 * 作业任务类
 */
export class Assignment {
    constructor(data = {}) {
        this.id = data.id ?? IdGenerator.generate();
        this.name = String(data.name ?? '未命名任务').trim() || '未命名任务';
        this.subject = String(data.subject ?? '').trim() || this._inferSubject(this.name);
        this.records = new Map();
        
        // 加载记录
        if (data.records && typeof data.records === 'object') {
            Object.entries(data.records).forEach(([studentId, record]) => {
                if (record && typeof record === 'object') {
                    this.records.set(studentId, new StudentRecord(record));
                }
            });
        }
    }

    /**
     * 从名称推断科目
     * @private
     */
    _inferSubject(name) {
        return /英语/.test(name) ? '英语' : '其他';
    }

    /**
     * 获取科目
     * @returns {string}
     */
    getSubject() {
        return this.subject || this._inferSubject(this.name);
    }

    /**
     * 是否为英语作业
     * @returns {boolean}
     */
    isEnglish() {
        return this.getSubject() === '英语';
    }

    /**
     * 检查学生是否参与
     * @param {Student} student
     * @returns {boolean}
     */
    includesStudent(student) {
        return !(this.isEnglish() && student.noEnglish);
    }

    /**
     * 获取学生记录
     * @param {string} studentId
     * @returns {StudentRecord|null}
     */
    getRecord(studentId) {
        return this.records.get(studentId) || null;
    }

    /**
     * 设置学生记录
     * @param {string} studentId
     * @param {StudentRecord} record
     */
    setRecord(studentId, record) {
        if (record.isEmpty()) {
            this.records.delete(studentId);
        } else {
            this.records.set(studentId, record);
        }
    }

    /**
     * 获取统计信息
     * @param {Student[]} students
     * @returns {Object}
     */
    getMetrics(students) {
        let total = 0;
        let done = 0;
        
        for (const student of students) {
            if (this.includesStudent(student)) {
                total++;
                const record = this.getRecord(student.id);
                if (record?.done) done++;
            }
        }
        
        return { total, done, pending: total - done };
    }

    /**
     * 更新元数据
     * @param {Object} payload
     */
    updateMeta(payload) {
        if (payload.name != null) {
            this.name = String(payload.name).trim() || this.name;
        }
        if (payload.subject != null) {
            this.subject = String(payload.subject).trim() || '其他';
        }
    }

    /**
     * 克隆
     * @returns {Assignment}
     */
    clone() {
        return new Assignment({
            id: this.id,
            name: this.name,
            subject: this.subject,
            records: this.toJSON().records
        });
    }

    /**
     * 转换为纯对象
     * @returns {Object}
     */
    toJSON() {
        const records = {};
        this.records.forEach((record, studentId) => {
            const data = record.toJSON();
            if (Object.keys(data).length > 0) {
                records[studentId] = data;
            }
        });
        
        return {
            id: this.id,
            name: this.name,
            subject: this.subject,
            records
        };
    }

    /**
     * 从纯对象创建
     * @param {Object} data
     * @returns {Assignment}
     */
    static fromJSON(data) {
        return new Assignment(data);
    }
}

/**
 * 应用偏好设置类
 */
export class Preferences {
    constructor(data = {}) {
        this.cardDoneColor = data.cardDoneColor ?? DEFAULTS.CARD_COLOR;
        this.animations = data.animations ?? true;
        this.showNames = data.showNames ?? true;
    }

    /**
     * 更新设置
     * @param {Object} updates
     */
    update(updates) {
        if (updates.cardDoneColor != null) {
            this.cardDoneColor = updates.cardDoneColor;
        }
        if (updates.animations != null) {
            this.animations = updates.animations;
        }
        if (updates.showNames != null) {
            this.showNames = updates.showNames;
        }
    }

    /**
     * 转换为纯对象
     * @returns {Object}
     */
    toJSON() {
        return {
            cardDoneColor: this.cardDoneColor,
            animations: this.animations,
            showNames: this.showNames
        };
    }

    /**
     * 从纯对象创建
     * @param {Object} data
     * @returns {Preferences}
     */
    static fromJSON(data) {
        return new Preferences(data);
    }
}

/**
 * 恢复草稿类
 */
export class RecoveryDraft {
    constructor(data = {}) {
        this.version = data.version ?? 1;
        this.updatedAt = data.updatedAt ?? Date.now();
        this.list = Array.isArray(data.list) ? data.list : [];
        this.data = Array.isArray(data.data) ? data.data : [];
        this.prefs = data.prefs ?? {};
        this.curId = data.curId ?? null;
    }

    /**
     * 检查是否有效
     * @returns {boolean}
     */
    isValid() {
        return this.version === 1 && 
               Array.isArray(this.list) && 
               Array.isArray(this.data);
    }

    /**
     * 转换为纯对象
     * @returns {Object}
     */
    toJSON() {
        return {
            version: this.version,
            updatedAt: this.updatedAt,
            list: this.list,
            data: this.data,
            prefs: this.prefs,
            curId: this.curId
        };
    }

    /**
     * 从纯对象创建
     * @param {Object} data
     * @returns {RecoveryDraft|null}
     */
    static fromJSON(data) {
        if (!data || typeof data !== 'object') return null;
        const draft = new RecoveryDraft(data);
        return draft.isValid() ? draft : null;
    }
}

export default {
    IdGenerator,
    Student,
    StudentRecord,
    Assignment,
    Preferences,
    RecoveryDraft
};
