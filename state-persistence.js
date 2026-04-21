(() => {
    const root = globalThis.__AC2_INTERNALS__ || (globalThis.__AC2_INTERNALS__ = {});

    const queuePersist = ({ usePersistenceService, persistenceService, persistTimer, setPersistTimer, flushPersist, delay = 300 }) => {
        if (usePersistenceService) {
            persistenceService.queuePersist();
            return;
        }
        clearTimeout(persistTimer());
        setPersistTimer(setTimeout(() => flushPersist(), delay));
    };

    const flushPersist = ({
        usePersistenceService,
        persistenceService,
        persistTimer,
        setPersistTimer,
        dirtyData,
        dirtyList,
        setDirtyData,
        setDirtyList,
        LS,
        KEYS,
        data,
        list,
        includeDraft = false,
        flushRecoveryDraft
    }) => {
        if (usePersistenceService) {
            persistenceService.markDirtyData(dirtyData());
            persistenceService.markDirtyList(dirtyList());
            persistenceService.flushPersist({ includeDraft });
            setDirtyData(false);
            setDirtyList(false);
            return;
        }
        clearTimeout(persistTimer());
        setPersistTimer(0);
        if (dirtyData()) {
            LS.set(KEYS.DATA, data());
            setDirtyData(false);
        }
        if (dirtyList()) {
            LS.set(KEYS.LIST, list());
            setDirtyList(false);
        }
        if (includeDraft) flushRecoveryDraft();
    };

    const save = ({
        normalizeMode = 'all',
        targetAsgId = null,
        sanitizeAsgIds,
        ensureAsgIndex,
        findAsgById,
        normalizeAsgInPlace,
        invalidateDerived = true,
        runInvalidateDerived,
        dirtyData = true,
        dirtyList = false,
        markDirtyData,
        markDirtyList,
        asgListChanged = false,
        onAsgListChanged,
        queueRecoveryDraft,
        immediate = false,
        flushPersist,
        queuePersist,
        render = true,
        isViewReady,
        renderView
    }) => {
        if (normalizeMode === 'all') {
            sanitizeAsgIds();
            ensureAsgIndex();
        } else if (normalizeMode === 'target' && targetAsgId != null) {
            const asg = findAsgById(targetAsgId);
            if (asg) normalizeAsgInPlace(asg);
        } else if (normalizeMode === 'none') {
            ensureAsgIndex();
        }

        if (invalidateDerived) runInvalidateDerived();
        if (dirtyData) markDirtyData(true);
        if (dirtyList) markDirtyList(true);
        if (asgListChanged) onAsgListChanged();
        if (dirtyData || dirtyList) queueRecoveryDraft();
        if (immediate) flushPersist({ includeDraft: true });
        else queuePersist();
        if (render && isViewReady()) renderView();
    };

    const saveAnim = ({ LS, KEYS, animations, applyAnim }) => {
        LS.set(KEYS.ANIM, animations);
        applyAnim();
    };

    const savePrefs = ({ normalizePrefs, prefs, setPrefs, queueRecoveryDraft, LS, KEYS, applyCardColor }) => {
        const nextPrefs = normalizePrefs(prefs);
        setPrefs(nextPrefs);
        queueRecoveryDraft();
        LS.set(KEYS.PREFS, nextPrefs);
        applyCardColor();
    };

    const createPersistenceRuntime = ({
        usePersistenceService,
        persistenceService,
        persistTimer,
        setPersistTimer,
        dirtyData,
        dirtyList,
        setDirtyData,
        setDirtyList,
        LS,
        KEYS,
        data,
        list,
        flushRecoveryDraft,
        normalizePrefs,
        prefs,
        setPrefs,
        queueRecoveryDraft,
        applyCardColor,
        animations,
        applyAnim,
        sanitizeAsgIds,
        ensureAsgIndex,
        findAsgById,
        normalizeAsgInPlace,
        runInvalidateDerived,
        onAsgListChanged,
        isViewReady,
        renderView
    }) => ({
        queuePersist(delay = 300) {
            return queuePersist({
                usePersistenceService,
                persistenceService,
                persistTimer,
                setPersistTimer,
                flushPersist: () => this.flushPersist(),
                delay
            });
        },
        flushPersist({ includeDraft = false } = {}) {
            return flushPersist({
                usePersistenceService,
                persistenceService,
                persistTimer,
                setPersistTimer,
                dirtyData,
                dirtyList,
                setDirtyData,
                setDirtyList,
                LS,
                KEYS,
                data,
                list,
                includeDraft,
                flushRecoveryDraft
            });
        },
        save(options = {}) {
            const {
                normalizeMode = 'all',
                targetAsgId = null,
                invalidateDerived = true,
                dirtyData: shouldDirtyData = true,
                dirtyList: shouldDirtyList = false,
                asgListChanged = false,
                immediate = false,
                render = true,
                flushPersist: flushPersistOverride = null,
                queuePersist: queuePersistOverride = null
            } = options;
            return save({
                ...options,
                normalizeMode,
                targetAsgId,
                sanitizeAsgIds,
                ensureAsgIndex,
                findAsgById,
                normalizeAsgInPlace,
                invalidateDerived,
                runInvalidateDerived,
                dirtyData: shouldDirtyData,
                dirtyList: shouldDirtyList,
                markDirtyData: setDirtyData,
                markDirtyList: setDirtyList,
                asgListChanged,
                onAsgListChanged,
                queueRecoveryDraft,
                immediate,
                flushPersist: flushPersistOverride || (flushOptions => this.flushPersist(flushOptions)),
                queuePersist: queuePersistOverride || (() => this.queuePersist()),
                render,
                isViewReady,
                renderView
            });
        },
        saveAnim() {
            return saveAnim({
                LS,
                KEYS,
                animations: animations(),
                applyAnim
            });
        },
        savePrefs() {
            return savePrefs({
                normalizePrefs,
                prefs: prefs(),
                setPrefs,
                queueRecoveryDraft,
                LS,
                KEYS,
                applyCardColor
            });
        }
    });

    root.statePersistence = {
        queuePersist,
        flushPersist,
        save,
        saveAnim,
        savePrefs,
        createPersistenceRuntime
    };
})();
