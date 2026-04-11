import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('Assignment (任务管理)', () => {
    beforeEach(() => {
        // 重置 State
        State.data = [];
        State.asgMap = new Map();
        State.curId = null;
        State._cacheVersion = 0;
        State._metricsCache = new Map();
        State._asgListVersion = 0;
        State._dirtyData = false;
        State._gridDirtyFull = true;
        State._gridDirtyStudentIds.clear();

        // 设置默认名单
        State.list = ['01 张三', '02 李四', '03 王五'];
        State.parseRoster();

        // Mock view
        vi.spyOn(State.view, 'isReady').mockReturnValue(true);
        vi.spyOn(State.view, 'render').mockImplementation(() => {});
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('任务创建', () => {
        it('应该能够添加新任务', () => {
            State.addAsg('测试任务');

            expect(State.data.length).toBe(1);
            expect(State.data[0].name).toBe('测试任务');
            expect(State.data[0].subject).toBe('英语');
            expect(State.data[0].records).toEqual({});
        });

        it('添加任务时应该自动生成唯一ID', () => {
            State.addAsg('任务1');
            State.addAsg('任务2');

            expect(State.data[0].id).toBeDefined();
            expect(State.data[1].id).toBeDefined();
            expect(State.data[0].id).not.toBe(State.data[1].id);
        });

        it('空任务名应该使用默认名称', () => {
            State.addAsg('');
            expect(State.data[0].name).toBe('未命名任务');
        });

        it('添加任务后应该自动选中该任务', () => {
            State.addAsg('新任务');
            expect(State.curId).toBe(State.data[0].id);
        });

        it('应该更新任务索引映射', () => {
            State.addAsg('任务1');
            expect(State.asgMap.has(State.data[0].id)).toBe(true);
        });
    });

    describe('任务选择', () => {
        beforeEach(() => {
            State.addAsg('任务1');
            State.addAsg('任务2');
        });

        it('应该能够选择任务', () => {
            const id2 = State.data[1].id;
            State.selectAsg(id2);

            expect(State.curId).toBe(id2);
        });

        it('选择无效ID应该被忽略', () => {
            const currentId = State.curId;
            State.selectAsg(99999);

            expect(State.curId).toBe(currentId);
        });

        it('选择任务后应该标记网格需要重绘', () => {
            State._gridDirtyFull = false;
            State.selectAsg(State.data[1].id);

            expect(State._gridDirtyFull).toBe(true);
        });
    });

    describe('任务重命名', () => {
        beforeEach(() => {
            State.addAsg('原名称');
        });

        it('应该能够重命名任务', () => {
            const id = State.data[0].id;
            const result = State.renameAsg(id, '新名称');

            expect(result).toBe(true);
            expect(State.data[0].name).toBe('新名称');
        });

        it('重命名无效ID应该返回false', () => {
            const result = State.renameAsg(99999, '新名称');
            expect(result).toBe(false);
        });

        it('空名称应该返回false', () => {
            const id = State.data[0].id;
            const result = State.renameAsg(id, '');
            expect(result).toBe(false);
        });

        it('只有空格的名称应该返回false', () => {
            const id = State.data[0].id;
            const result = State.renameAsg(id, '   ');
            expect(result).toBe(false);
        });
    });

    describe('任务元数据更新', () => {
        beforeEach(() => {
            State.addAsg('任务1');
        });

        it('应该能够更新任务名称和科目', () => {
            const id = State.data[0].id;
            const result = State.updateAsgMeta(id, { name: '新名称', subject: '数学' });

            expect(result).toBe(true);
            expect(State.data[0].name).toBe('新名称');
            expect(State.data[0].subject).toBe('数学');
        });

        it('无效ID应该返回false', () => {
            const result = State.updateAsgMeta(99999, { name: '新名称' });
            expect(result).toBe(false);
        });

        it('空名称应该返回false', () => {
            const id = State.data[0].id;
            const result = State.updateAsgMeta(id, { name: '' });
            expect(result).toBe(false);
        });

        it('未指定字段应该保持原值', () => {
            const id = State.data[0].id;
            const originalSubject = State.data[0].subject;
            State.updateAsgMeta(id, { name: '新名称' });

            expect(State.data[0].subject).toBe(originalSubject);
        });
    });

    describe('任务删除', () => {
        beforeEach(() => {
            State.addAsg('任务1');
            State.addAsg('任务2');
        });

        it('应该能够删除任务', () => {
            const id = State.data[0].id;
            const result = State.removeAsg(id);

            expect(result).toBe(true);
            expect(State.data.length).toBe(1);
        });

        it('删除后应该更新索引映射', () => {
            const id = State.data[0].id;
            State.removeAsg(id);

            expect(State.asgMap.has(id)).toBe(false);
        });

        it('删除最后一个任务应该被阻止', () => {
            State.removeAsg(State.data[0].id);
            const result = State.removeAsg(State.data[0].id);

            expect(result).toBe(false);
            expect(State.data.length).toBe(1);
        });

        it('删除当前选中任务后应该自动选择其他任务', () => {
            const id1 = State.data[0].id;
            const id2 = State.data[1].id;
            State.selectAsg(id2);

            State.removeAsg(id2);

            expect(State.curId).toBe(id1);
        });

        it('删除无效ID应该返回false', () => {
            const result = State.removeAsg(99999);
            expect(result).toBe(false);
        });
    });

    describe('任务规范化', () => {
        it('应该正确规范化任务对象', () => {
            const raw = { id: 123, name: '测试', subject: '英语', records: { '01': { score: '85' } } };
            const normalized = State.normalizeAsg(raw);

            expect(normalized.id).toBe(123);
            expect(normalized.name).toBe('测试');
            expect(normalized.subject).toBe('英语');
            expect(normalized.records).toEqual({ '01': { score: '85' } });
        });

        it('无效对象应该返回null', () => {
            expect(State.normalizeAsg(null)).toBeNull();
            expect(State.normalizeAsg(undefined)).toBeNull();
            expect(State.normalizeAsg('string')).toBeNull();
        });

        it('空名称应该使用默认名称', () => {
            const raw = { id: 123, name: '', subject: '英语' };
            const normalized = State.normalizeAsg(raw);
            expect(normalized.name).toBe('未命名任务');
        });

        it('空科目应该根据名称推断', () => {
            const raw1 = { id: 123, name: '英语作业', subject: '' };
            expect(State.normalizeAsg(raw1).subject).toBe('英语');

            const raw2 = { id: 124, name: '数学作业', subject: '' };
            expect(State.normalizeAsg(raw2).subject).toBe('其他');
        });

        it('无效ID应该标记为_invalidId', () => {
            const raw = { id: 'invalid', name: '测试' };
            const normalized = State.normalizeAsg(raw);
            expect(normalized._invalidId).toBe(true);
        });
    });

    describe('任务索引管理', () => {
        it('应该能够重建任务索引', () => {
            State.addAsg('任务1');
            State.addAsg('任务2');

            // 清除索引
            State.asgMap = new Map();
            expect(State.asgMap.size).toBe(0);

            State.rebuildAsgIndex();
            expect(State.asgMap.size).toBe(2);
        });

        it('应该自动确保索引存在', () => {
            State.addAsg('任务1');
            State.asgMap = new Map(); // 清除索引

            State._ensureAsgIndex();
            expect(State.asgMap.size).toBe(1);
        });
    });

    describe('当前任务获取', () => {
        it('应该返回当前选中的任务', () => {
            State.addAsg('任务1');
            expect(State.cur).toBeDefined();
            expect(State.cur.name).toBe('任务1');
        });

        it('没有选中任务时应该返回第一个任务', () => {
            State.addAsg('任务1');
            State.addAsg('任务2');
            State.curId = null;

            expect(State.cur).toBe(State.data[0]);
        });

        it('没有任务时应该返回undefined', () => {
            expect(State.cur).toBeUndefined();
        });
    });

    describe('任务科目判断', () => {
        beforeEach(() => {
            State.addAsg('英语作业');
            State.addAsg('数学作业');
            State.data[1].subject = '数学';
        });

        it('应该正确获取任务科目', () => {
            expect(State.getAsgSubject(State.data[0])).toBe('英语');
            expect(State.getAsgSubject(State.data[1])).toBe('数学');
        });

        it('应该正确判断英语任务', () => {
            expect(State.isEnglishAsg(State.data[0])).toBe(true);
            expect(State.isEnglishAsg(State.data[1])).toBe(false);
        });

        it('应该正确判断学生是否包含在任务中', () => {
            const englishStu = State.roster[0]; // 普通学生
            const noEnglishStu = { id: '99', name: '测试', noEnglish: true };

            expect(State.isStuIncluded(State.data[0], englishStu)).toBe(true);
            expect(State.isStuIncluded(State.data[0], noEnglishStu)).toBe(false);
            expect(State.isStuIncluded(State.data[1], noEnglishStu)).toBe(true);
        });
    });

    describe('任务统计', () => {
        beforeEach(() => {
            State.addAsg('任务1');
            State.data[0].records = {
                '01': { score: '85', done: true },
                '02': { score: '90', done: true },
                '03': { score: '', done: false }
            };
        });

        it('应该正确计算任务指标', () => {
            const metrics = State.getAsgMetrics(State.data[0]);

            expect(metrics.total).toBe(3);
            expect(metrics.done).toBe(2);
        });

        it('应该缓存任务指标', () => {
            const metrics1 = State.getAsgMetrics(State.data[0]);
            const metrics2 = State.getAsgMetrics(State.data[0]);

            expect(metrics1).toBe(metrics2); // 同一对象引用
        });

        it('缓存失效后应该重新计算', () => {
            State.getAsgMetrics(State.data[0]);
            const oldVersion = State._cacheVersion;
            State.invalidateDerived();

            // invalidateDerived 会增加 _cacheVersion
            expect(State._cacheVersion).toBeGreaterThan(oldVersion);
        });
    });

    describe('保存功能', () => {
        it('save 应该触发持久化队列', () => {
            vi.spyOn(State, '_queuePersist').mockImplementation(() => {});
            State.save();

            expect(State._queuePersist).toHaveBeenCalled();
        });

        it('immediate 为 true 应该立即持久化', () => {
            vi.spyOn(State, '_flushPersist').mockImplementation(() => {});
            State.save({ immediate: true });

            expect(State._flushPersist).toHaveBeenCalled();
        });

        it('应该标记脏数据', () => {
            State._dirtyData = false;
            State.save({ dirtyData: true });

            expect(State._dirtyData).toBe(true);
        });
    });
});
