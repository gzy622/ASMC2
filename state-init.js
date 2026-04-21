(() => {
    const root = globalThis.__AC2_INTERNALS__ || (globalThis.__AC2_INTERNALS__ = {});

    const createServicesBridge = ({
        getServicesInitialized,
        setServicesInitialized,
        getState,
        rosterService,
        assignmentService,
        preferenceService,
        persistenceService,
        warn
    }) => ({
        init() {
            if (getServicesInitialized()) return;
            try {
                rosterService?.init?.();
                assignmentService?.init?.();
                preferenceService?.init?.();
                persistenceService?.init?.();
                setServicesInitialized(true);
            } catch (error) {
                warn('init', error);
            }
        },
        syncFromLegacy() {
            const state = getState();
            try {
                rosterService?.parse?.(state.list);
                assignmentService?.init?.(state.data);
                assignmentService?.setCurrentId?.(state.curId);
            } catch (error) {
                warn('syncFromLegacy', error);
            }
        },
        syncToLegacy() {
            const state = getState();
            try {
                if (rosterService) {
                    state.list = rosterService.getRawList?.() || state.list;
                    state.roster = rosterService.getAllStudents?.() || state.roster;
                    state.rosterIndexMap = new Map((rosterService.getAllStudents?.() || []).map((stu, idx) => [stu.id, idx]));
                    state.noEnglishIds = state.roster.filter(stu => stu.noEnglish).map(stu => stu.id);
                }
                if (assignmentService) {
                    state.data = assignmentService.getAll?.() || state.data;
                    state.curId = assignmentService.getCurrentId?.() || state.curId;
                    state.asgMap = new Map(state.data.map(a => [a.id, a]));
                }
                if (preferenceService) {
                    state.animations = preferenceService.getAnimations?.() ?? state.animations;
                    state.prefs = preferenceService.getPrefs?.() || state.prefs;
                }
            } catch (error) {
                warn('syncToLegacy', error);
            }
        }
    });

    const initState = ({
        state,
        servicesBridge,
        LS,
        KEYS,
        DEFAULT_ROSTER,
        APP_CONFIG,
        assignmentService,
        persistenceService,
        toast,
        alertFn,
        beforeUnloadTarget
    }) => {
        const initAsync = async () => {
            servicesBridge.init();

            state.list = LS.get(KEYS.LIST, DEFAULT_ROSTER);
            state.animations = LS.get(KEYS.ANIM, true);
            state.prefs = state.normalizePrefs(LS.get(KEYS.PREFS, state.prefs));

            servicesBridge.syncFromLegacy();

            setTimeout(() => {
                try {
                    state.data = LS.get(KEYS.DATA, []).map(a => state.normalizeAsg(a)).filter(Boolean);

                    if (state._useAssignmentService && assignmentService) {
                        assignmentService.init(state.data);
                        state.curId = assignmentService.getCurrentId();
                    }

                    const recovered = state.applyRecoveryDraft();

                    try {
                        state.parseRoster();
                    } catch (error) {
                        alertFn(`名单数据异常：${error.message}\n请先修复本地名单后再使用。`);
                        throw error;
                    }

                    if (!state.data.length) state.addAsg('任务 1');

                    const repairedIds = state.sanitizeAsgIds();
                    state._ensureAsgIndex();
                    if (repairedIds) toast.show('已自动修复异常任务 ID');

                    state.curId = state.resolveCurId(state.curId);
                    state.applyAnim();
                    state.applyCardColor();
                    beforeUnloadTarget.addEventListener('beforeunload', () => state._flushPersist({ includeDraft: true }));
                    state.view.init();

                    if (state._usePersistenceService && persistenceService) persistenceService.init();

                    state._lastDraftSnapshot = state.getRecoverySnapshot();
                    if (recovered) toast.show('已恢复上次未完成的临时登记数据');

                    servicesBridge.syncFromLegacy();
                } catch (error) {
                    console.error('初始化失败:', error);
                    toast.show('初始化失败: ' + (error?.message || '未知错误'));
                    state.data = [];
                    state.list = DEFAULT_ROSTER;
                    state.addAsg('任务 1');
                }
            }, APP_CONFIG.INIT_DELAY_MS || 100);
        };

        initAsync();
    };

    root.stateInit = {
        createServicesBridge,
        initState
    };
})();
