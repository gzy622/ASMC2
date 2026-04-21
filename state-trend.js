(() => {
    const root = globalThis.__AC2_INTERNALS__ || (globalThis.__AC2_INTERNALS__ = {});

    const parseNumericScore = (value) => {
        if (typeof value === 'number') return Number.isFinite(value) ? value : null;
        const text = String(value ?? '').trim();
        if (!text) return null;
        return /^-?\d+(?:\.\d+)?$/.test(text) ? Number(text) : null;
    };

    const buildTrendTimelineKey = (timeline) => timeline.map(item => `${item.asgId}:${item.label}:${item.score ?? ''}:${item.included ? 1 : 0}`).join(';');

    const classifyScoreTrend = (entries) => {
        if (!entries.length) return '暂无成绩';
        if (entries.length === 1) return '单次记录';
        const first = entries[0].score;
        const latest = entries[entries.length - 1].score;
        let min = first;
        let max = first;
        for (let i = 1; i < entries.length; i++) {
            const score = entries[i].score;
            if (score < min) min = score;
            if (score > max) max = score;
        }
        const delta = latest - first;
        const span = max - min;
        if (Math.abs(delta) <= 2 && span <= 4) return '稳定';
        if (delta >= 5) return '上升';
        if (delta <= -5) return '下降';
        return '波动';
    };

    const getQuizTrendAssignments = (data) => {
        const source = Array.isArray(data) ? data : [];
        const quizzes = source.filter(asg => /小测/.test(String(asg?.name || '')));
        return quizzes.length ? quizzes : source.slice();
    };

    const getAsgRange = ({ startId, endId, source }) => {
        const list = Array.isArray(source) ? source : [];
        if (!list.length) return [];
        const startIndex = list.findIndex(asg => asg.id === startId);
        const endIndex = list.findIndex(asg => asg.id === endId);
        if (startIndex === -1 && endIndex === -1) return list.slice();
        const safeStart = startIndex === -1 ? 0 : startIndex;
        const safeEnd = endIndex === -1 ? list.length - 1 : endIndex;
        const [from, to] = safeStart <= safeEnd ? [safeStart, safeEnd] : [safeEnd, safeStart];
        return list.slice(from, to + 1);
    };

    const calculateStudentStats = ({ stu, assignments, isStuIncluded, getAsgSubject, parseScore = parseNumericScore, classifyTrend = classifyScoreTrend, buildKey = buildTrendTimelineKey }) => {
        const timeline = [];
        const entries = [];
        let includedCount = 0;
        let totalScore = 0;
        let first = null;
        let latest = null;
        let best = null;
        let worst = null;

        assignments.forEach(asg => {
            if (!isStuIncluded(asg, stu, getAsgSubject)) {
                timeline.push({ asgId: asg.id, label: asg.name, score: null, rawScore: '', included: false });
                return;
            }
            includedCount++;
            const rawScore = asg.records?.[stu.id]?.score ?? '';
            const score = parseScore(rawScore);
            const item = { asgId: asg.id, label: asg.name, score, rawScore, included: true };
            timeline.push(item);
            if (score == null) return;
            entries.push(item);
            totalScore += score;
            if (first == null) first = score;
            latest = score;
            best = best == null ? score : Math.max(best, score);
            worst = worst == null ? score : Math.min(worst, score);
        });

        const stats = {
            avg: entries.length ? Number((totalScore / entries.length).toFixed(1)) : null,
            latest,
            best,
            worst,
            delta: entries.length >= 2 ? Number((latest - first).toFixed(1)) : null,
            coverage: `${entries.length}/${includedCount}`,
            trend: classifyTrend(entries),
            entries
        };
        const timelineKey = buildKey(timeline);

        return {
            entries,
            timeline,
            stats,
            searchText: `${stu.id} ${stu.name}`,
            timelineKey,
            renderKey: `${stu.id}|${stu.name}|${stats.coverage}|${stats.avg ?? ''}|${stats.latest ?? ''}|${stats.best ?? ''}|${stats.delta ?? ''}|${stats.trend}|${timelineKey}`
        };
    };

    const readCachedValue = (entry) => {
        if (!entry || typeof entry !== 'object') return null;
        if ('value' in entry) return entry.value;
        if ('metrics' in entry) return entry.metrics;
        if ('report' in entry) return entry.report;
        return null;
    };

    const createMetricsCacheAdapter = ({
        useCacheService,
        cacheService,
        metricsCache,
        cacheVersion,
        maxMetricsCacheSize = 50
    }) => {
        const useService = !!useCacheService && !!cacheService;
        const cacheName = cacheService?.CacheNames?.METRICS || 'metrics';
        const getVersion = () => useService ? cacheService.getVersion() : cacheVersion;
        const getEntry = (key) => useService ? cacheService.get(cacheName, key) : metricsCache.get(key);
        const setEntry = (key, entry) => {
            if (useService) {
                cacheService.set(cacheName, key, entry);
                return;
            }
            if (!metricsCache.has(key) && metricsCache.size >= maxMetricsCacheSize) {
                const firstKey = metricsCache.keys().next().value;
                metricsCache.delete(firstKey);
            }
            metricsCache.set(key, entry);
        };

        return {
            getVersion,
            get(key) {
                const cached = getEntry(key);
                if (!cached || cached.version !== getVersion()) return null;
                return readCachedValue(cached);
            },
            set(key, value) {
                setEntry(key, { version: getVersion(), value });
                return value;
            }
        };
    };

    const createTrendRuntime = ({
        roster = [],
        getAsgSubject,
        isStuIncluded,
        parseScore = parseNumericScore,
        classifyTrend = classifyScoreTrend,
        buildKey = buildTrendTimelineKey,
        cache = null
    }) => ({
        roster,
        getAsgSubject,
        isStuIncluded,
        parseScore,
        classifyTrend,
        buildKey,
        cache,
        calculateStudentStats(stu, assignments) {
            return calculateStudentStats({
                stu,
                assignments,
                isStuIncluded,
                getAsgSubject,
                parseScore,
                classifyTrend,
                buildKey
            });
        },
        getAsgMetrics(asg) {
            return getAsgMetrics({
                asg,
                roster,
                isStuIncluded,
                getAsgSubject,
                cache
            });
        },
        getScoreRangeReport({ startId, endId, source, rosterVersion, asgListVersion }) {
            return getScoreRangeReport({
                startId,
                endId,
                source,
                roster,
                getAsgSubject,
                isStuIncluded,
                parseScore,
                classifyTrend,
                buildKey,
                cache,
                rosterVersion,
                asgListVersion
            });
        }
    });

    const getAsgMetrics = ({ asg, roster, isStuIncluded, getAsgSubject, cache }) => {
        if (!asg) return { total: 0, done: 0 };

        const cached = cache?.get(asg.id);
        if (cached) return cached;
        let total = 0;
        let done = 0;
        for (const stu of roster) {
            if (!isStuIncluded(asg, stu, getAsgSubject)) continue;
            total++;
            if (asg.records?.[stu.id]?.done) done++;
        }
        const metrics = { total, done };
        return cache ? cache.set(asg.id, metrics) : metrics;
    };

    const getScoreRangeReport = ({
        startId,
        endId,
        source,
        roster,
        getAsgSubject,
        isStuIncluded,
        parseScore = parseNumericScore,
        classifyTrend = classifyScoreTrend,
        buildKey = buildTrendTimelineKey,
        cache,
        rosterVersion,
        asgListVersion
    }) => {
        const assignments = getAsgRange({ startId, endId, source });
        const cacheKey = `range:${cache?.getVersion?.() ?? 0}|${rosterVersion}|${asgListVersion}|${assignments.map(asg => asg.id).join(',')}`;
        const cached = cache?.get(cacheKey);
        if (cached) return cached;

        let scoredStudentCount = 0;
        const students = roster.map(stu => {
            const studentStats = calculateStudentStats({
                stu,
                assignments,
                isStuIncluded,
                getAsgSubject,
                parseScore,
                classifyTrend,
                buildKey
            });
            if (studentStats.stats.entries.length) scoredStudentCount++;
            return { id: stu.id, name: stu.name, ...studentStats };
        });
        const report = {
            assignments: assignments.map(asg => ({ id: asg.id, name: asg.name, subject: getAsgSubject(asg) })),
            students,
            scoredStudentCount
        };
        return cache ? cache.set(cacheKey, report) : report;
    };

    root.stateTrend = {
        parseNumericScore,
        buildTrendTimelineKey,
        classifyScoreTrend,
        getQuizTrendAssignments,
        getAsgRange,
        calculateStudentStats,
        createMetricsCacheAdapter,
        createTrendRuntime,
        getAsgMetrics,
        getScoreRangeReport
    };
})();
