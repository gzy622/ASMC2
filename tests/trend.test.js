import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('Trend (趋势分析)', () => {
    beforeEach(() => {
        // 重置 State
        State.data = [];
        State.asgMap = new Map();
        State._cacheVersion = 0;
        State._metricsCache = new Map();
        State._asgListVersion = 0;
        State._rosterVersion = 0;

        // 设置默认名单
        State.list = ['01 张三', '02 李四', '03 王五'];
        State.parseRoster();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('分数解析', () => {
        it('应该正确解析数字分数', () => {
            expect(State.parseNumericScore(85)).toBe(85);
            expect(State.parseNumericScore(85.5)).toBe(85.5);
        });

        it('应该正确解析字符串分数', () => {
            expect(State.parseNumericScore('85')).toBe(85);
            expect(State.parseNumericScore('85.5')).toBe(85.5);
            expect(State.parseNumericScore('-10')).toBe(-10);
        });

        it('空字符串应该返回null', () => {
            expect(State.parseNumericScore('')).toBeNull();
            expect(State.parseNumericScore('   ')).toBeNull();
        });

        it('非数字字符串应该返回null', () => {
            expect(State.parseNumericScore('abc')).toBeNull();
            expect(State.parseNumericScore('85a')).toBeNull();
        });

        it('null/undefined应该返回null', () => {
            expect(State.parseNumericScore(null)).toBeNull();
            expect(State.parseNumericScore(undefined)).toBeNull();
        });
    });

    describe('趋势分类', () => {
        it('空数组应该返回"暂无成绩"', () => {
            expect(State.classifyScoreTrend([])).toBe('暂无成绩');
        });

        it('单条记录应该返回"单次记录"', () => {
            expect(State.classifyScoreTrend([{ score: 85 }])).toBe('单次记录');
        });

        it('稳定趋势判断', () => {
            const entries = [
                { score: 80 },
                { score: 81 },
                { score: 82 }
            ];
            expect(State.classifyScoreTrend(entries)).toBe('稳定');
        });

        it('上升趋势判断', () => {
            const entries = [
                { score: 70 },
                { score: 75 },
                { score: 80 }
            ];
            expect(State.classifyScoreTrend(entries)).toBe('上升');
        });

        it('下降趋势判断', () => {
            const entries = [
                { score: 90 },
                { score: 80 },
                { score: 70 }
            ];
            expect(State.classifyScoreTrend(entries)).toBe('下降');
        });

        it('波动趋势判断', () => {
            const entries = [
                { score: 80 },
                { score: 90 },
                { score: 82 }
            ];
            expect(State.classifyScoreTrend(entries)).toBe('波动');
        });
    });

    describe('任务范围获取', () => {
        beforeEach(() => {
            State.data = [
                { id: 1, name: '任务1', subject: '英语', records: {} },
                { id: 2, name: '任务2', subject: '数学', records: {} },
                { id: 3, name: '任务3', subject: '英语', records: {} },
                { id: 4, name: '任务4', subject: '语文', records: {} },
                { id: 5, name: '任务5', subject: '英语', records: {} }
            ];
            State.rebuildAsgIndex();
        });

        it('应该返回指定范围内的任务', () => {
            const range = State.getAsgRange(2, 4);
            expect(range.length).toBe(3);
            expect(range[0].id).toBe(2);
            expect(range[2].id).toBe(4);
        });

        it('顺序无关，应该返回正确范围', () => {
            const range = State.getAsgRange(4, 2);
            expect(range.length).toBe(3);
            expect(range[0].id).toBe(2);
            expect(range[2].id).toBe(4);
        });

        it('无效ID应该返回全部任务', () => {
            const range = State.getAsgRange(999, 888);
            expect(range.length).toBe(5);
        });

        it('部分无效ID应该使用边界', () => {
            const range = State.getAsgRange(999, 3);
            expect(range[0].id).toBe(1);
            expect(range[range.length - 1].id).toBe(3);
        });

        it('空数据源应该返回空数组', () => {
            const range = State.getAsgRange(1, 2, []);
            expect(range).toEqual([]);
        });
    });

    describe('小测任务获取', () => {
        beforeEach(() => {
            State.data = [
                { id: 1, name: '英语小测1', subject: '英语', records: {} },
                { id: 2, name: '数学作业', subject: '数学', records: {} },
                { id: 3, name: '英语小测2', subject: '英语', records: {} },
                { id: 4, name: '语文作业', subject: '语文', records: {} }
            ];
        });

        it('应该返回包含"小测"的任务', () => {
            const quizzes = State.getQuizTrendAssignments();
            expect(quizzes.length).toBe(2);
            expect(quizzes[0].name).toContain('小测');
            expect(quizzes[1].name).toContain('小测');
        });

        it('没有小测时应该返回全部任务', () => {
            State.data = [
                { id: 1, name: '英语作业', subject: '英语', records: {} },
                { id: 2, name: '数学作业', subject: '数学', records: {} }
            ];
            const quizzes = State.getQuizTrendAssignments();
            expect(quizzes.length).toBe(2);
        });
    });

    describe('时间线键生成', () => {
        it('应该正确生成时间线键', () => {
            const timeline = [
                { asgId: 1, label: '任务1', score: 85, included: true },
                { asgId: 2, label: '任务2', score: null, included: false }
            ];
            const key = State.buildTrendTimelineKey(timeline);
            expect(key).toBe('1:任务1:85:1;2:任务2::0');
        });

        it('空时间线应该返回空字符串', () => {
            const key = State.buildTrendTimelineKey([]);
            expect(key).toBe('');
        });
    });

    describe('统一缓存适配器', () => {
        it('应该统一本地缓存读写并在超限时淘汰最早条目', () => {
            const metricsCache = new Map();
            const adapter = globalThis.__AC2_INTERNALS__.stateTrend.createMetricsCacheAdapter({
                useCacheService: false,
                metricsCache,
                cacheVersion: 3,
                maxMetricsCacheSize: 2
            });
            const metrics = { total: 3, done: 2 };
            const report = { assignments: [], students: [], scoredStudentCount: 0 };
            const nextReport = { assignments: [{ id: 2, name: '任务2' }], students: [], scoredStudentCount: 0 };

            adapter.set('asg:1', metrics);
            adapter.set('range:1', report);

            expect(adapter.get('asg:1')).toBe(metrics);
            expect(adapter.get('range:1')).toBe(report);
            expect(metricsCache.get('asg:1')).toEqual({ version: 3, value: metrics });
            expect(metricsCache.get('range:1')).toEqual({ version: 3, value: report });

            adapter.set('range:2', nextReport);

            expect(metricsCache.has('asg:1')).toBe(false);
            expect(adapter.get('range:1')).toBe(report);
            expect(adapter.get('range:2')).toBe(nextReport);
        });

        it('应该统一转调 CacheService 缓存接口', () => {
            const store = new Map();
            const cacheService = {
                CacheNames: { METRICS: 'metrics' },
                getVersion: vi.fn(() => 7),
                get: vi.fn((name, key) => store.get(`${name}:${key}`)),
                set: vi.fn((name, key, value) => store.set(`${name}:${key}`, value))
            };
            const adapter = globalThis.__AC2_INTERNALS__.stateTrend.createMetricsCacheAdapter({
                useCacheService: true,
                cacheService,
                metricsCache: new Map(),
                cacheVersion: 1,
                maxMetricsCacheSize: 2
            });
            const metrics = { total: 1, done: 1 };

            expect(adapter.get('asg:1')).toBeNull();

            adapter.set('asg:1', metrics);

            expect(adapter.get('asg:1')).toBe(metrics);
            expect(cacheService.set).toHaveBeenCalledWith('metrics', 'asg:1', { version: 7, value: metrics });
            expect(cacheService.get).toHaveBeenCalledWith('metrics', 'asg:1');
        });
    });

    describe('趋势运行时构建器', () => {
        it('应该复用同一组上下文完成指标、报告与学生统计计算', () => {
            const metricsCache = new Map();
            const runtime = globalThis.__AC2_INTERNALS__.stateTrend.createTrendRuntime({
                roster: State.roster,
                getAsgSubject: asg => asg.subject,
                isStuIncluded: (asg, stu) => !(asg.subject === '英语' && stu.noEnglish),
                parseScore: value => Number(value),
                classifyTrend: entries => entries.length > 1 ? '自定义趋势' : '单次记录',
                buildKey: timeline => `k:${timeline.length}`,
                cache: globalThis.__AC2_INTERNALS__.stateTrend.createMetricsCacheAdapter({
                    useCacheService: false,
                    metricsCache,
                    cacheVersion: 5,
                    maxMetricsCacheSize: 10
                })
            });
            const assignments = [
                { id: 1, name: '任务1', subject: '英语', records: { '01': { score: '80', done: true } } },
                { id: 2, name: '任务2', subject: '数学', records: { '01': { score: '90', done: true }, '02': { score: '70', done: true } } }
            ];

            const metrics = runtime.getAsgMetrics(assignments[1]);
            const stats = runtime.calculateStudentStats(State.roster[0], assignments);
            const report = runtime.getScoreRangeReport({
                startId: 1,
                endId: 2,
                source: assignments,
                rosterVersion: 2,
                asgListVersion: 3
            });

            expect(metrics).toEqual({ total: 3, done: 2 });
            expect(stats.stats.trend).toBe('自定义趋势');
            expect(stats.timelineKey).toBe('k:2');
            expect(report.students[0].stats.trend).toBe('自定义趋势');
            expect(metricsCache.get(2)).toEqual({ version: 5, value: metrics });
            expect(metricsCache.get('range:5|2|3|1,2')).toEqual({ version: 5, value: report });
        });
    });

    describe('分数范围报告', () => {
        beforeEach(() => {
            State.data = [
                { id: 1, name: '任务1', subject: '英语', records: { '01': { score: '80' }, '02': { score: '90' } } },
                { id: 2, name: '任务2', subject: '数学', records: { '01': { score: '85' }, '02': { score: '85' } } },
                { id: 3, name: '任务3', subject: '英语', records: { '01': { score: '90' }, '02': { score: '80' } } }
            ];
            State.rebuildAsgIndex();
            State._cacheVersion = 1;
            State._rosterVersion = 1;
            State._asgListVersion = 1;
        });

        it('应该生成正确的报告结构', () => {
            const report = State.getScoreRangeReport(1, 3);

            expect(report.assignments).toBeDefined();
            expect(report.students).toBeDefined();
            expect(report.scoredStudentCount).toBeDefined();
        });

        it('应该包含正确的任务列表', () => {
            const report = State.getScoreRangeReport(1, 2);

            expect(report.assignments.length).toBe(2);
            expect(report.assignments[0].name).toBe('任务1');
            expect(report.assignments[1].name).toBe('任务2');
        });

        it('应该计算学生统计信息', () => {
            const report = State.getScoreRangeReport(1, 3);
            const student = report.students.find(s => s.id === '01');

            expect(student).toBeDefined();
            expect(student.stats.avg).toBe(85);
            expect(student.stats.best).toBe(90);
            expect(student.stats.worst).toBe(80);
            expect(student.stats.delta).toBe(10); // 90 - 80
        });

        it('应该正确计算覆盖率', () => {
            const report = State.getScoreRangeReport(1, 3);
            const student = report.students.find(s => s.id === '01');

            expect(student.stats.coverage).toBe('3/3');
        });

        it('应该生成时间线数据', () => {
            const report = State.getScoreRangeReport(1, 2);
            const student = report.students.find(s => s.id === '01');

            expect(student.timeline.length).toBe(2);
            expect(student.timeline[0].score).toBe(80);
            expect(student.timeline[1].score).toBe(85);
        });

        it('应该缓存报告结果', () => {
            const report1 = State.getScoreRangeReport(1, 2);
            const report2 = State.getScoreRangeReport(1, 2);

            // 应该是同一个对象引用（缓存）
            expect(report1).toBe(report2);
        });

        it('应该为非英语学生标记排除', () => {
            // 添加非英语学生
            State.roster.push({ id: '99', name: '非英语学生', noEnglish: true });

            const report = State.getScoreRangeReport(1, 1);
            const student = report.students.find(s => s.id === '99');

            expect(student.timeline[0].included).toBe(false);
        });
    });

    describe('记录更新', () => {
        beforeEach(() => {
            State.addAsg('测试任务');
            State.data[0].records = { '01': { score: '80', done: true } };
            vi.spyOn(State.view, 'renderStudent').mockImplementation(() => {});
            vi.spyOn(State.view, 'renderProgress').mockImplementation(() => {});
        });

        it('应该能够更新记录', () => {
            State.updRec('01', { score: '90', done: true });

            expect(State.data[0].records['01'].score).toBe('90');
        });

        it('应该能够添加新记录', () => {
            State.updRec('02', { score: '85', done: true });

            expect(State.data[0].records['02']).toBeDefined();
            expect(State.data[0].records['02'].score).toBe('85');
        });

        it('空分数且未完成应该删除记录', () => {
            State.updRec('01', { score: '', done: false });

            expect(State.data[0].records['01']).toBeUndefined();
        });

        it('更新后应该使派生数据失效', () => {
            const initialVersion = State._cacheVersion;
            State.updRec('01', { score: '95' });

            expect(State._cacheVersion).toBeGreaterThan(initialVersion);
        });

        it('完成状态变化时应该更新进度', () => {
            State.updRec('01', { score: '80', done: false });

            expect(State.view.renderProgress).toHaveBeenCalled();
        });
    });

    describe('学生分析报告', () => {
        beforeEach(() => {
            State.data = [
                { id: 1, name: '英语小测1', subject: '英语', records: { '01': { score: '80', done: true }, '02': { score: '70', done: true } } },
                { id: 2, name: '数学作业1', subject: '数学', records: { '01': { score: '90', done: true }, '02': { score: '', done: false } } },
                { id: 3, name: '数学小测2', subject: '数学', records: { '01': { score: '88', done: true }, '02': { score: '75', done: true } } }
            ];
            State.rebuildAsgIndex();
        });

        it('scope=quiz 时仅统计小测', () => {
            const report = State.getStudentAnalysisReport({ scope: 'quiz' });
            expect(report.assignments.map(item => item.id)).toEqual([1, 3]);
        });

        it('search 仅过滤学生列表，不影响 summary 口径', () => {
            const report = State.getStudentAnalysisReport({ scope: 'all', search: '张三' });
            expect(report.summary.totalStudents).toBe(3);
            expect(report.students.length).toBe(1);
        });

        it('sort=delta 时按变化值降序', () => {
            const report = State.getStudentAnalysisReport({ scope: 'all', sort: 'delta' });
            expect(report.students[0].id).toBe('01');
        });
    });
});
