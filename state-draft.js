(() => {
    const root = globalThis.__AC2_INTERNALS__ || (globalThis.__AC2_INTERNALS__ = {});

    const cloneRecoveryRecords = (records) => {
        const source = records && typeof records === 'object' ? records : {};
        return Object.fromEntries(
            Object.entries(source).map(([id, entry]) => [id, entry && typeof entry === 'object' ? { ...entry } : entry])
        );
    };

    const cloneRecoveryData = ({ data, normalizeAsg }) => (Array.isArray(data) ? data : [])
        .map(item => normalizeAsg(item))
        .filter(Boolean)
        .map(asg => ({ id: asg.id, name: asg.name, subject: asg.subject, records: cloneRecoveryRecords(asg.records) }));

    const cloneRecoveryState = ({ state, normalizeAsg, normalizePrefs }) => {
        const source = state && typeof state === 'object' ? state : {};
        const curId = source.curId == null || source.curId === '' ? null : Number(source.curId);
        return {
            list: Array.isArray(source.list) ? source.list.map(v => String(v ?? '').trim()).filter(Boolean) : [],
            data: cloneRecoveryData({ data: source.data, normalizeAsg }),
            prefs: normalizePrefs(source.prefs),
            curId: Number.isFinite(curId) ? curId : null
        };
    };

    const isSameRecoveryValue = (a, b) => a === b || (a == null && b == null);

    const isSameRecoveryEntry = (a, b) => {
        if (a === b) return true;
        const objA = a && typeof a === 'object' ? a : null;
        const objB = b && typeof b === 'object' ? b : null;
        if (!objA || !objB) return objA === objB;
        const keysA = Object.keys(objA);
        const keysB = Object.keys(objB);
        if (keysA.length !== keysB.length) return false;
        return keysA.every(key => isSameRecoveryValue(objA[key], objB[key]));
    };

    const isSameRecoveryRecords = (a, b) => {
        const recA = a && typeof a === 'object' ? a : {};
        const recB = b && typeof b === 'object' ? b : {};
        const idsA = Object.keys(recA);
        const idsB = Object.keys(recB);
        if (idsA.length !== idsB.length) return false;
        return idsA.every(id => isSameRecoveryEntry(recA[id], recB[id]));
    };

    const isSameRecoveryData = (a, b) => {
        if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) return false;
        for (let i = 0; i < a.length; i++) {
            const left = a[i];
            const right = b[i];
            if (!left || !right) return false;
            if (left.id !== right.id || left.name !== right.name || left.subject !== right.subject) return false;
            if (!isSameRecoveryRecords(left.records, right.records)) return false;
        }
        return true;
    };

    const isSameRecoveryState = ({ a, b, normalizePrefs }) => {
        if (!a || !b) return false;
        if (!Array.isArray(a.list) || !Array.isArray(b.list) || a.list.length !== b.list.length) return false;
        if (a.list.some((item, index) => item !== b.list[index])) return false;
        if (!isSameRecoveryData(a.data, b.data)) return false;
        const curA = Number.isFinite(a.curId) ? a.curId : null;
        const curB = Number.isFinite(b.curId) ? b.curId : null;
        return curA === curB && normalizePrefs(a.prefs).cardDoneColor === normalizePrefs(b.prefs).cardDoneColor;
    };

    const getRecoveryDraft = ({ usePersistenceService, persistenceService, LS, KEYS, Validator, normalizeAsg, normalizePrefs }) => {
        if (usePersistenceService) return persistenceService.getRecoveryDraft();
        const draft = LS.get(KEYS.DRAFT, null);
        if (!Validator.isValidRecoveryDraft(draft)) return null;
        return cloneRecoveryState({
            state: {
                list: draft.list.map(v => String(v ?? '').trim()).filter(Boolean),
                data: draft.data.map(a => normalizeAsg(a)).filter(Boolean),
                prefs: normalizePrefs(draft.prefs),
                curId: Number(draft.curId)
            },
            normalizeAsg,
            normalizePrefs
        });
    };

    const getRecoverySnapshot = ({ usePersistenceService, persistenceService, state, normalizeAsg, normalizePrefs }) => {
        if (usePersistenceService) return persistenceService.getRecoverySnapshot();
        return cloneRecoveryState({ state, normalizeAsg, normalizePrefs });
    };

    const applyRecoveryDraft = ({
        usePersistenceService,
        persistenceService,
        useRosterService,
        rosterService,
        useAssignmentService,
        assignmentService,
        usePreferenceService,
        preferenceService,
        getRecoveryDraft,
        currentState,
        setState,
        isSameRecoveryState,
        normalizePrefs
    }) => {
        if (usePersistenceService) {
            const success = persistenceService.applyRecoveryDraft();
            if (success) {
                const nextState = {};
                if (useRosterService) nextState.list = rosterService.getRawList();
                if (useAssignmentService) {
                    nextState.data = assignmentService.getAll();
                    nextState.curId = assignmentService.getCurrentId();
                }
                if (usePreferenceService) {
                    nextState.prefs = preferenceService.getPrefs();
                    nextState.animations = preferenceService.getAnimations();
                }
                setState(nextState);
            }
            return success;
        }

        const draft = getRecoveryDraft();
        if (!draft) return false;
        if (isSameRecoveryState({ a: draft, b: currentState(), normalizePrefs })) return false;
        setState({
            list: draft.list,
            data: draft.data,
            prefs: draft.prefs,
            curId: Number.isFinite(draft.curId) ? draft.curId : currentState().curId
        });
        return true;
    };

    const saveRecoveryDraft = ({
        usePersistenceService,
        persistenceService,
        clearDraftTimer,
        getRecoverySnapshot,
        lastDraftSnapshot,
        setLastDraftSnapshot,
        isSameRecoveryState,
        normalizePrefs,
        cloneRecoveryState,
        LS,
        KEYS
    }) => {
        if (usePersistenceService) return persistenceService.saveDraft();
        clearDraftTimer();
        const snapshot = getRecoverySnapshot();
        if (lastDraftSnapshot() && isSameRecoveryState({ a: snapshot, b: lastDraftSnapshot(), normalizePrefs })) return false;
        setLastDraftSnapshot(cloneRecoveryState(snapshot));
        LS.set(KEYS.DRAFT, { version: 1, updatedAt: Date.now(), ...snapshot });
        return true;
    };

    const createDraftRuntime = ({
        usePersistenceService,
        persistenceService,
        useRosterService,
        rosterService,
        useAssignmentService,
        assignmentService,
        usePreferenceService,
        preferenceService,
        LS,
        KEYS,
        Validator,
        normalizeAsg,
        normalizePrefs,
        getState,
        setState,
        getLastDraftSnapshot,
        setLastDraftSnapshot,
        clearDraftTimer
    }) => ({
        cloneRecoveryRecords,
        cloneRecoveryData(data) {
            return cloneRecoveryData({ data, normalizeAsg });
        },
        cloneRecoveryState(state) {
            return cloneRecoveryState({ state, normalizeAsg, normalizePrefs });
        },
        isSameRecoveryValue,
        isSameRecoveryEntry,
        isSameRecoveryRecords,
        isSameRecoveryData,
        isSameRecoveryState(a, b) {
            return isSameRecoveryState({ a, b, normalizePrefs });
        },
        getRecoveryDraft() {
            return getRecoveryDraft({
                usePersistenceService,
                persistenceService,
                LS,
                KEYS,
                Validator,
                normalizeAsg,
                normalizePrefs
            });
        },
        getRecoverySnapshot() {
            return getRecoverySnapshot({
                usePersistenceService,
                persistenceService,
                state: getState(),
                normalizeAsg,
                normalizePrefs
            });
        },
        applyRecoveryDraft() {
            return applyRecoveryDraft({
                usePersistenceService,
                persistenceService,
                useRosterService,
                rosterService,
                useAssignmentService,
                assignmentService,
                usePreferenceService,
                preferenceService,
                getRecoveryDraft: () => this.getRecoveryDraft(),
                currentState: getState,
                setState,
                isSameRecoveryState,
                normalizePrefs
            });
        },
        saveRecoveryDraft() {
            return saveRecoveryDraft({
                usePersistenceService,
                persistenceService,
                clearDraftTimer,
                getRecoverySnapshot: () => this.getRecoverySnapshot(),
                lastDraftSnapshot: getLastDraftSnapshot,
                setLastDraftSnapshot,
                isSameRecoveryState,
                normalizePrefs,
                cloneRecoveryState: snapshot => this.cloneRecoveryState(snapshot),
                LS,
                KEYS
            });
        }
    });

    root.stateDraft = {
        cloneRecoveryRecords,
        cloneRecoveryData,
        cloneRecoveryState,
        isSameRecoveryValue,
        isSameRecoveryEntry,
        isSameRecoveryRecords,
        isSameRecoveryData,
        isSameRecoveryState,
        getRecoveryDraft,
        getRecoverySnapshot,
        applyRecoveryDraft,
        saveRecoveryDraft,
        createDraftRuntime
    };
})();
