(() => {
    const root = globalThis.__AC2_INTERNALS__ || (globalThis.__AC2_INTERNALS__ = {});

    const normalizePrefs = ({ raw, ColorUtil, defaultColor = '#68c490' }) => {
        const prefs = raw && typeof raw === 'object' ? raw : {};
        return { cardDoneColor: ColorUtil.normalizeHex(prefs.cardDoneColor, defaultColor) };
    };

    const ensureAsgIndex = ({ asgMap, data }) => {
        if (!asgMap.size || asgMap.size !== data.length) {
            return new Map(data.map(a => [a.id, a]));
        }
        return asgMap;
    };

    const rebuildAsgIndex = (data) => new Map(data.map(a => [a.id, a]));

    const resolveCurId = ({ candidate, asgMap, data }) => {
        if (asgMap.has(candidate)) return candidate;
        return data[data.length - 1]?.id ?? null;
    };

    const normalizeAsg = (asg) => {
        if (!asg || typeof asg !== 'object') return null;
        const name = String(asg.name || '').trim();
        const subject = String(asg.subject || '').trim() || (/英语/.test(name) ? '英语' : '其他');
        const id = Number(asg.id);
        const invalidId = !Number.isFinite(id);
        const normalized = {
            id: invalidId ? null : id,
            name: name || '未命名任务',
            subject,
            records: asg.records && typeof asg.records === 'object' ? asg.records : {}
        };
        if (invalidId) normalized._invalidId = true;
        return normalized;
    };

    const normalizeAsgInPlace = (asg) => {
        const normalized = normalizeAsg(asg);
        if (!normalized) return null;
        if (asg && typeof asg === 'object') Object.assign(asg, normalized);
        return normalized;
    };

    const sanitizeAsgIds = ({ data, normalizeAsg, createUniqueId }) => {
        const used = new Set();
        const cleaned = [];
        let repaired = false;
        data.forEach(item => {
            const asg = normalizeAsg(item);
            if (!asg || asg._invalidId) {
                repaired = true;
                return;
            }
            if (used.has(asg.id)) {
                repaired = true;
                asg.id = createUniqueId(id => used.has(id));
            }
            used.add(asg.id);
            cleaned.push(asg);
        });
        return { repaired, data: cleaned };
    };

    const invalidateDerived = ({ useCacheService, cacheService, cacheVersion, metricsCache }) => {
        if (useCacheService) {
            cacheService.invalidateAll();
            return { cacheVersion, metricsCache };
        }
        return { cacheVersion: cacheVersion + 1, metricsCache: new Map() };
    };

    const markGridDirty = ({ currentFull, currentIds, full = false, ids = [] }) => {
        if (full) return { full: true, ids: new Set() };
        if (currentFull) return { full: true, ids: new Set() };
        const nextIds = new Set(currentIds);
        ids.forEach(id => {
            const key = String(id || '').trim();
            if (key) nextIds.add(key);
        });
        return { full: false, ids: nextIds };
    };

    const consumeGridDirty = ({ full, ids }) => ({
        dirty: { full, ids: full ? [] : Array.from(ids) },
        next: { full: false, ids: new Set() }
    });

    root.stateCore = {
        normalizePrefs,
        ensureAsgIndex,
        rebuildAsgIndex,
        resolveCurId,
        normalizeAsg,
        normalizeAsgInPlace,
        sanitizeAsgIds,
        invalidateDerived,
        markGridDirty,
        consumeGridDirty
    };
})();
