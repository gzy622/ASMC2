/**
 * 名单服务模块
 * 管理学生名单的解析、验证和索引
 */

const RosterService = (function() {
    'use strict';

    class RosterManager {
        constructor() {
            // 原始名单数据
            this._list = [];
            // 解析后的学生对象数组
            this._roster = [];
            // 学生ID到索引的映射
            this._indexMap = new Map();
            // 排除英语的学生ID列表
            this._noEnglishIds = [];
            // 版本号（用于变更检测）
            this._version = 0;
        }

        /**
         * 解析名单行
         * @param {string} rawLine - 原始行文本
         * @returns {Object} 解析后的学生对象 {id, name, noEnglish}
         */
        parseLine(rawLine) {
            const lineText = String(rawLine ?? '').trim();
            const noEnRegex = /\s*#(?:非英语|非英|no-en|noeng|not-en)\s*$/i;
            const noEnglish = noEnRegex.test(lineText);
            const line = lineText.replace(noEnRegex, '').trim();
            const i = line.indexOf(' ');
            
            if (i === -1) {
                return { id: line, name: '', noEnglish };
            }
            return { 
                id: line.slice(0, i), 
                name: line.slice(i + 1), 
                noEnglish 
            };
        }

        /**
         * 获取重复的ID列表
         * @param {string[]} ids - ID列表
         * @returns {string[]} 重复的ID列表
         */
        getDuplicateIds(ids) {
            const seen = new Set();
            const dup = new Set();
            
            ids.forEach(id => {
                const key = String(id || '').trim();
                if (!key) return;
                if (seen.has(key)) dup.add(key);
                seen.add(key);
            });
            
            return Array.from(dup);
        }

        /**
         * 断言名单ID唯一
         * @param {string[]} ids - ID列表
         * @param {string} sourceLabel - 来源标签
         * @throws {Error} 存在重复ID时抛出错误
         */
        assertUniqueIds(ids, sourceLabel = '名单') {
            const dup = this.getDuplicateIds(ids);
            if (dup.length) {
                throw new Error(`${sourceLabel}存在重复学号: ${dup.join('、')}`);
            }
        }

        /**
         * 解析名单数据
         * @param {string[]} list - 原始名单数组
         * @returns {Object} 解析结果 {roster, noEnglishIds}
         */
        parse(list) {
            this._list = Array.isArray(list) ? list : [];
            
            // 解析学生对象
            this._roster = this._list
                .map(line => this.parseLine(line))
                .filter(s => s.id);

            // 检查重复ID
            this.assertUniqueIds(this._roster.map(stu => stu.id), '名单');

            // 构建索引映射
            this._indexMap = new Map(
                this._roster.map((stu, index) => [stu.id, index])
            );

            // 提取排除英语的学生ID
            this._noEnglishIds = this._roster
                .filter(stu => stu.noEnglish)
                .map(stu => stu.id);

            this._version++;

            return {
                roster: this._roster,
                noEnglishIds: this._noEnglishIds,
                version: this._version
            };
        }

        /**
         * 获取学生索引
         * @param {string} id - 学生ID
         * @returns {number|undefined}
         */
        getIndex(id) {
            return this._indexMap.get(id);
        }

        /**
         * 获取学生信息
         * @param {string} id - 学生ID
         * @returns {Object|undefined}
         */
        getStudent(id) {
            const index = this._indexMap.get(id);
            if (index !== undefined) {
                return this._roster[index];
            }
            return undefined;
        }

        /**
         * 检查学生是否排除英语
         * @param {string} id - 学生ID
         * @returns {boolean}
         */
        isNoEnglish(id) {
            return this._noEnglishIds.includes(id);
        }

        /**
         * 获取所有学生
         * @returns {Object[]}
         */
        getAllStudents() {
            return [...this._roster];
        }

        /**
         * 获取学生数量
         * @returns {number}
         */
        getCount() {
            return this._roster.length;
        }

        /**
         * 获取原始名单
         * @returns {string[]}
         */
        getRawList() {
            return [...this._list];
        }

        /**
         * 获取当前版本号
         * @returns {number}
         */
        getVersion() {
            return this._version;
        }

        /**
         * 检查学生是否存在
         * @param {string} id - 学生ID
         * @returns {boolean}
         */
        hasStudent(id) {
            return this._indexMap.has(id);
        }

        /**
         * 遍历所有学生
         * @param {Function} callback - 回调函数 (student, index) => void
         */
        forEach(callback) {
            this._roster.forEach(callback);
        }

        /**
         * 映射所有学生
         * @param {Function} callback - 回调函数 (student, index) => any
         * @returns {any[]}
         */
        map(callback) {
            return this._roster.map(callback);
        }

        /**
         * 过滤学生
         * @param {Function} predicate - 谓词函数 (student, index) => boolean
         * @returns {Object[]}
         */
        filter(predicate) {
            return this._roster.filter(predicate);
        }
    }

    // 单例实例
    const instance = new RosterManager();

    return {
        instance,
        // 便捷方法
        parse: (list) => instance.parse(list),
        parseLine: (line) => instance.parseLine(line),
        getIndex: (id) => instance.getIndex(id),
        getStudent: (id) => instance.getStudent(id),
        isNoEnglish: (id) => instance.isNoEnglish(id),
        getAllStudents: () => instance.getAllStudents(),
        getCount: () => instance.getCount(),
        getRawList: () => instance.getRawList(),
        getVersion: () => instance.getVersion(),
        hasStudent: (id) => instance.hasStudent(id),
        forEach: (cb) => instance.forEach(cb),
        map: (cb) => instance.map(cb),
        filter: (cb) => instance.filter(cb),
        assertUniqueIds: (ids, label) => instance.assertUniqueIds(ids, label)
    };
})();

// 导出到全局
if (typeof window !== 'undefined') {
    window.RosterService = RosterService;
}
