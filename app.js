        const App = (function() {
            // 服务层集成 - 渐进式迁移
            let servicesInitialized = false;
            const StateHelpers = globalThis.__AC2_INTERNALS__ || {};
            const StateTrend = StateHelpers.stateTrend;
            const StateDraft = StateHelpers.stateDraft;
            const StateRoster = StateHelpers.stateRoster;
            const StateAssignment = StateHelpers.stateAssignment;
            const StatePersistence = StateHelpers.statePersistence;
            const StateUi = StateHelpers.stateUi;
            const StateCore = StateHelpers.stateCore;
            const StateInit = StateHelpers.stateInit;
            const CacheServiceRef = globalThis.CacheService;
            const RosterServiceRef = globalThis.RosterService;
            const AssignmentServiceRef = globalThis.AssignmentService;
            const PreferenceServiceRef = globalThis.PreferenceService;
            const PersistenceServiceRef = globalThis.PersistenceService;
            let ServicesBridge;

            const State = {
                list: [], roster: [], data: [], curId: null, mode: 'name', scoring: false, animations: true, debug: false,
                prefs: { cardDoneColor: APP_CONFIG.DEFAULT_CARD_COLOR },
                asgMap: new Map(),
                rosterIndexMap: new Map(),
                noEnglishIds: [],
                view: { init() { }, render() { }, renderStudent() { }, renderProgress() { }, isReady() { return false; } },
                _persistTimer: 0,
                _draftTimer: 0,
                _draftDirty: false,
                _draftPersistMs: TIMER_DELAY.DRAFT_PERSIST || 1200,
                _lastDraftSnapshot: null,
                _cacheVersion: 0,
                _metricsCache: new Map(),
                _dirtyData: false,
                _dirtyList: false,
                _asgListVersion: 0,
                _rosterVersion: 0,
                _gridDirtyFull: true,
                _gridDirtyStudentIds: new Set(),
                _useCacheService: typeof CacheService !== 'undefined',
                _usePersistenceService: typeof PersistenceService !== 'undefined',
                _useRosterService: typeof RosterService !== 'undefined',
                _useAssignmentService: typeof AssignmentService !== 'undefined',
                _usePreferenceService: typeof PreferenceService !== 'undefined',

                init() {
                    StateInit.initState({
                        state: this,
                        servicesBridge: ServicesBridge,
                        LS,
                        KEYS,
                        DEFAULT_ROSTER,
                        APP_CONFIG,
                        assignmentService: AssignmentServiceRef,
                        persistenceService: PersistenceServiceRef,
                        toast: Toast,
                        alertFn: message => window.alert(message),
                        beforeUnloadTarget: window
                    });
                },

            /**
             * 规范化用户偏好设置
             * @param {Object} raw - 原始偏好设置
             * @returns {Object} 规范化后的偏好设置
             */
            normalizePrefs(raw) {
                return StateCore.normalizePrefs({
                    raw,
                    ColorUtil,
                    defaultColor: '#68c490'
                });
            },

            /**
             * 确保任务索引映射已构建
             * @private
             */
            _ensureAsgIndex() {
                this.asgMap = StateCore.ensureAsgIndex({
                    asgMap: this.asgMap,
                    data: this.data
                });
            },

            /**
             * 重建任务索引映射
             */
            rebuildAsgIndex() {
                this.asgMap = StateCore.rebuildAsgIndex(this.data);
            },

            /**
             * 解析当前任务ID
             * @param {number} candidate - 候选ID
             * @returns {number|null} 有效的任务ID或null
             */
            resolveCurId(candidate) {
                return StateCore.resolveCurId({
                    candidate,
                    asgMap: this.asgMap,
                    data: this.data
                });
            },

            _getDraftRuntime() {
                return StateDraft.createDraftRuntime({
                    usePersistenceService: this._usePersistenceService,
                    persistenceService: PersistenceServiceRef,
                    useRosterService: this._useRosterService,
                    rosterService: RosterServiceRef,
                    useAssignmentService: this._useAssignmentService,
                    assignmentService: AssignmentServiceRef,
                    usePreferenceService: this._usePreferenceService,
                    preferenceService: PreferenceServiceRef,
                    LS,
                    KEYS,
                    Validator,
                    normalizeAsg: value => this.normalizeAsg(value),
                    normalizePrefs: value => this.normalizePrefs(value),
                    getState: () => ({
                        list: this.list,
                        data: this.data,
                        prefs: this.prefs,
                        curId: this.curId
                    }),
                    setState: nextState => Object.assign(this, nextState),
                    getLastDraftSnapshot: () => this._lastDraftSnapshot,
                    setLastDraftSnapshot: snapshot => { this._lastDraftSnapshot = snapshot; },
                    clearDraftTimer: () => {
                        clearTimeout(this._draftTimer);
                        this._draftTimer = 0;
                        this._draftDirty = false;
                    }
                });
            },

            /**
             * 获取恢复草稿数据
             * @returns {Object|null} 恢复状态对象或null
             */
            getRecoveryDraft() {
                return this._getDraftRuntime().getRecoveryDraft();
            },

            /**
             * 克隆恢复记录
             * @param {Object} records - 记录对象
             * @returns {Object} 克隆后的记录
             */
            cloneRecoveryRecords(records) {
                return this._getDraftRuntime().cloneRecoveryRecords(records);
            },

            /**
             * 克隆恢复数据
             * @param {Array} data - 任务数据数组
             * @returns {Array} 克隆后的任务数据
             */
            cloneRecoveryData(data) {
                return this._getDraftRuntime().cloneRecoveryData(data);
            },

            /**
             * 克隆恢复状态
             * @param {Object} state - 状态对象
             * @returns {Object} 克隆后的状态
             */
            cloneRecoveryState(state) {
                return this._getDraftRuntime().cloneRecoveryState(state);
            },

            /**
             * 获取当前恢复快照
             * @returns {Object} 当前状态快照
             */
            getRecoverySnapshot() {
                return this._getDraftRuntime().getRecoverySnapshot();
            },

            /**
             * 比较两个恢复值是否相同
             * @param {*} a - 值A
             * @param {*} b - 值B
             * @returns {boolean}
             */
            isSameRecoveryValue(a, b) {
                return this._getDraftRuntime().isSameRecoveryValue(a, b);
            },

            /**
             * 比较两个恢复条目是否相同
             * @param {*} a - 条目A
             * @param {*} b - 条目B
             * @returns {boolean}
             */
            isSameRecoveryEntry(a, b) {
                return this._getDraftRuntime().isSameRecoveryEntry(a, b);
            },

            /**
             * 比较两组恢复记录是否相同
             * @param {Object} a - 记录A
             * @param {Object} b - 记录B
             * @returns {boolean}
             */
            isSameRecoveryRecords(a, b) {
                return this._getDraftRuntime().isSameRecoveryRecords(a, b);
            },

            /**
             * 比较两组恢复数据是否相同
             * @param {Array} a - 数据A
             * @param {Array} b - 数据B
             * @returns {boolean}
             */
            isSameRecoveryData(a, b) {
                return this._getDraftRuntime().isSameRecoveryData(a, b);
            },

            /**
             * 比较两个恢复状态是否相同
             * @param {Object} a - 状态A
             * @param {Object} b - 状态B
             * @returns {boolean}
             */
            isSameRecoveryState(a, b) {
                return this._getDraftRuntime().isSameRecoveryState(a, b);
            },

            /**
             * 应用恢复草稿
             * @returns {boolean} 是否成功应用
             */
            applyRecoveryDraft() {
                return this._getDraftRuntime().applyRecoveryDraft();
            },

            /**
             * 队列恢复草稿保存
             */
            queueRecoveryDraft() {
                if (this._usePersistenceService) {
                    PersistenceService.queueDraft();
                } else {
                    clearTimeout(this._draftTimer);
                    this._draftDirty = true;
                    this._draftTimer = setTimeout(() => this.flushRecoveryDraft(), this._draftPersistMs);
                }
            },

            flushRecoveryDraft() {
                if (this._usePersistenceService) {
                    PersistenceService.flushDraft();
                } else {
                    clearTimeout(this._draftTimer);
                    this._draftTimer = 0;
                    if (!this._draftDirty) return;
                    this._draftDirty = false;
                    this.saveRecoveryDraft();
                }
            },

            saveRecoveryDraft() {
                return this._getDraftRuntime().saveRecoveryDraft();
            },

            sanitizeAsgIds() {
                const result = StateCore.sanitizeAsgIds({
                    data: this.data,
                    normalizeAsg: value => this.normalizeAsg(value),
                    createUniqueId: exists => IdGenerator.generateUnique(exists)
                });
                this.data = result.data;
                return result.repaired;
            },

            /**
             * 规范化任务对象
             * @param {Object} asg - 原始任务对象
             * @returns {Object|null} 规范化后的任务对象
             */
            normalizeAsg(asg) {
                return StateCore.normalizeAsg(asg);
            },

            /**
             * 原地规范化任务对象
             * @param {Object} asg - 任务对象
             * @returns {Object|null} 规范化后的任务对象
             */
            normalizeAsgInPlace(asg) {
                return StateCore.normalizeAsgInPlace(asg);
            },

            /**
             * 使派生数据失效，清除缓存
             */
            invalidateDerived() {
                const next = StateCore.invalidateDerived({
                    useCacheService: this._useCacheService,
                    cacheService: CacheServiceRef,
                    cacheVersion: this._cacheVersion,
                    metricsCache: this._metricsCache
                });
                this._cacheVersion = next.cacheVersion;
                this._metricsCache = next.metricsCache;
            },

            /**
             * 标记网格需要重绘
             * @param {Object} options - 选项
             * @param {boolean} options.full - 是否完全重绘
             * @param {string[]} options.ids - 需要重绘的学生ID列表
             */
            markGridDirty({ full = false, ids = [] } = {}) {
                const next = StateCore.markGridDirty({
                    currentFull: this._gridDirtyFull,
                    currentIds: this._gridDirtyStudentIds,
                    full,
                    ids
                });
                this._gridDirtyFull = next.full;
                this._gridDirtyStudentIds = next.ids;
            },

            /**
             * 获取并清除网格脏标记
             * @returns {Object} 脏标记状态
             */
            consumeGridDirty() {
                const result = StateCore.consumeGridDirty({
                    full: this._gridDirtyFull,
                    ids: this._gridDirtyStudentIds
                });
                this._gridDirtyFull = result.next.full;
                this._gridDirtyStudentIds = result.next.ids;
                return result.dirty;
            },

            _getPersistenceRuntime() {
                return StatePersistence.createPersistenceRuntime({
                    usePersistenceService: this._usePersistenceService,
                    persistenceService: PersistenceServiceRef,
                    persistTimer: () => this._persistTimer,
                    setPersistTimer: value => { this._persistTimer = value; },
                    dirtyData: () => this._dirtyData,
                    dirtyList: () => this._dirtyList,
                    setDirtyData: value => { this._dirtyData = value; },
                    setDirtyList: value => { this._dirtyList = value; },
                    LS,
                    KEYS,
                    data: () => this.data,
                    list: () => this.list,
                    flushRecoveryDraft: () => this.flushRecoveryDraft(),
                    normalizePrefs: value => this.normalizePrefs(value),
                    prefs: () => this.prefs,
                    setPrefs: value => { this.prefs = value; },
                    queueRecoveryDraft: () => this.queueRecoveryDraft(),
                    applyCardColor: () => this.applyCardColor(),
                    animations: () => this.animations,
                    applyAnim: () => this.applyAnim(),
                    sanitizeAsgIds: () => this.sanitizeAsgIds(),
                    ensureAsgIndex: () => this._ensureAsgIndex(),
                    findAsgById: id => this.asgMap.get(id) || this.data.find(item => item.id === id),
                    normalizeAsgInPlace: asg => this.normalizeAsgInPlace(asg),
                    runInvalidateDerived: () => this.invalidateDerived(),
                    onAsgListChanged: () => {
                        this._asgListVersion++;
                        this._metricsCache.clear();
                    },
                    isViewReady: () => this.view.isReady(),
                    renderView: () => this.view.render()
                });
            },

            _queuePersist() { 
                this._getPersistenceRuntime().queuePersist(300);
            },
            queuePersist() { this._queuePersist(); }, // Maintain API

            _flushPersist({ includeDraft = false } = {}) {
                this._getPersistenceRuntime().flushPersist({ includeDraft });
            },
            flushPersist(options) { this._flushPersist(options); }, // Maintain API

            _getRosterRuntime() {
                return StateRoster.createRosterRuntime({
                    useRosterService: this._useRosterService,
                    rosterService: RosterServiceRef,
                    list: this.list,
                    previousRosterVersion: this._rosterVersion
                });
            },

            _getUiRuntime() {
                return StateUi.createUiRuntime({
                    documentRef: document,
                    getById: id => $(id),
                    ColorUtil,
                    mode: () => this.mode,
                    setMode: value => { this.mode = value; },
                    scoring: () => this.scoring,
                    animations: () => this.animations,
                    prefs: () => this.prefs
                });
            },

            /**
             * 解析名单行
             * @param {string} rawLine - 原始行文本
             * @returns {Object} 解析后的学生对象 {id, name, noEnglish}
             */
            parseRosterLine(rawLine) {
                return this._getRosterRuntime().parseRosterLine(rawLine);
            },

            /**
             * 获取重复的ID列表
             * @param {string[]} ids - ID列表
             * @returns {string[]} 重复的ID列表
             */
            getDuplicateIds(ids) {
                return this._getRosterRuntime().getDuplicateIds(ids);
            },

            /**
             * 断言名单ID唯一
             * @param {string[]} ids - ID列表
             * @param {string} sourceLabel - 来源标签
             * @throws {Error} 存在重复ID时抛出错误
             */
            assertUniqueRosterIds(ids, sourceLabel = '名单') {
                this._getRosterRuntime().assertUniqueRosterIds(ids, sourceLabel);
            },

            /**
             * 解析名单数据，将原始名单列表转换为结构化的学生对象数组
             * 并构建索引映射，用于快速查找学生信息
             * @returns {void}
             */
            parseRoster() {
                const parsed = this._getRosterRuntime().parseRoster();
                this.roster = parsed.roster;
                this.rosterIndexMap = parsed.rosterIndexMap;
                this.noEnglishIds = parsed.noEnglishIds;
                this._rosterVersion = parsed.rosterVersion;
                this.invalidateDerived();
                this.markGridDirty({ full: true });
            },

            /**
             * 保存应用状态，包括任务数据、名单数据和派生缓存
             * @param {Object} options - 保存选项
             * @param {boolean} [options.render=true] - 是否触发视图重新渲染
             * @param {boolean} [options.immediate=false] - 是否立即持久化到本地存储，否则加入队列延迟保存
             * @param {boolean} [options.dirtyData=true] - 是否标记任务数据为脏数据
             * @param {boolean} [options.dirtyList=false] - 是否标记名单数据为脏数据
             * @param {boolean} [options.asgListChanged=false] - 任务列表是否发生变化（增删排序）
             * @param {string} [options.normalizeMode='all'] - 规范化模式：'all'全部、'target'指定任务、'none'不处理
             * @param {number|null} [options.targetAsgId=null] - normalizeMode为'target'时指定的任务ID
             * @param {boolean} [options.invalidateDerived=true] - 是否使派生数据缓存失效
             * @returns {void}
             */
            save({ render = true, immediate = false, dirtyData = true, dirtyList = false, asgListChanged = false, normalizeMode = 'all', targetAsgId = null, invalidateDerived = true } = {}) {
                this._getPersistenceRuntime().save({
                    normalizeMode,
                    targetAsgId,
                    invalidateDerived,
                    dirtyData,
                    dirtyList,
                    asgListChanged,
                    immediate,
                    render,
                    flushPersist: options => this._flushPersist(options),
                    queuePersist: () => this._queuePersist()
                });
            },

            saveAnim() {
                this._getPersistenceRuntime().saveAnim();
            },
            savePrefs() {
                this._getPersistenceRuntime().savePrefs();
            },

            applyAnim() {
                this._getUiRuntime().applyAnim();
            },

            applyCardColor() {
                this._getUiRuntime().applyCardColor();
            },

            applyScoring() {
                this._getUiRuntime().applyScoring();
            },

            applyViewMode() {
                this._getUiRuntime().applyViewMode();
            },

            toggleViewMode() {
                this._getUiRuntime().toggleViewMode();
                this.applyViewMode();
            },

            invertCurrentSelection() {
                const changed = StateAssignment.invertCurrentSelection({
                    asg: this.cur,
                    roster: this.roster,
                    isStuIncluded: (asg, stu) => this.isStuIncluded(asg, stu)
                });
                if (!changed) return;
                this.invalidateDerived();
                this.markGridDirty({ full: true });
                this.queueRecoveryDraft();
                this._queuePersist();
                this.view.render();
            },

            get cur() { return this.asgMap.get(this.curId) || this.data[0]; },

            _getAssignmentRuntime() {
                return StateAssignment.createAssignmentRuntime({
                    useAssignmentService: this._useAssignmentService,
                    assignmentService: AssignmentServiceRef,
                    data: this.data,
                    asgMap: this.asgMap,
                    curId: this.curId,
                    normalizeAsg: value => this.normalizeAsg(value),
                    createUniqueId: exists => IdGenerator.generateUnique(exists)
                });
            },

            addAsg(n) {
                const result = this._getAssignmentRuntime().addAsg(n);
                if (!result.changed) return;
                this.data = result.data;
                this._ensureAsgIndex();
                this.curId = result.curId;
                this.markGridDirty({ full: true });
                this.save({ asgListChanged: true, normalizeMode: 'none', invalidateDerived: false });
            },

            selectAsg(id) {
                const result = this._getAssignmentRuntime().selectAsg(id);
                if (!result.changed) return;
                this.curId = result.curId;
                this.markGridDirty({ full: true });
                this.view.render();
            },

            renameAsg(id, name) {
                const result = this._getAssignmentRuntime().renameAsg(id, name);
                if (!result.changed) return false;
                this.data = result.data;
                this._ensureAsgIndex();
                this.save({ asgListChanged: true, normalizeMode: 'target', targetAsgId: id, invalidateDerived: false });
                return true;
            },

            updateAsgMeta(id, payload = {}) {
                const result = this._getAssignmentRuntime().updateAsgMeta(id, payload);
                if (!result.changed) return false;
                this.data = result.data;
                this._ensureAsgIndex();
                if (id === this.curId && result.prevSubject !== result.nextSubject) this.markGridDirty({ full: true });
                this.save({ asgListChanged: true, normalizeMode: 'target', targetAsgId: id, invalidateDerived: result.prevSubject !== result.nextSubject });
                return true;
            },

            removeAsg(id) {
                const result = this._getAssignmentRuntime().removeAsg(id);
                if (!result.changed) return false;
                this.data = result.data;
                this._ensureAsgIndex();
                this.curId = result.curId;
                this.markGridDirty({ full: true });
                this.save({ asgListChanged: true, normalizeMode: 'none', invalidateDerived: false });
                return true;
            },

            getAsgSubject(asg) { 
                return this._getAssignmentRuntime().getAsgSubject(asg);
            },
            isEnglishAsg(asg) { 
                return this._getAssignmentRuntime().isEnglishAsg(asg);
            },
            isStuIncluded(asg, stu) {
                return this._getAssignmentRuntime().isStuIncluded(asg, stu);
            },

            _getTrendRuntime() {
                const cache = StateTrend.createMetricsCacheAdapter({
                    useCacheService: this._useCacheService,
                    cacheService: CacheServiceRef,
                    metricsCache: this._metricsCache,
                    cacheVersion: this._cacheVersion,
                    maxMetricsCacheSize: CACHE_CONFIG.MAX_METRICS_CACHE_SIZE || 50
                });
                return StateTrend.createTrendRuntime({
                    roster: this.roster,
                    getAsgSubject: asg => this.getAsgSubject(asg),
                    isStuIncluded: (asg, stu) => this.isStuIncluded(asg, stu),
                    parseScore: value => this.parseNumericScore(value),
                    classifyTrend: entries => this.classifyScoreTrend(entries),
                    buildKey: timeline => this.buildTrendTimelineKey(timeline),
                    cache
                });
            },

            getAsgMetrics(asg) {
                return this._getTrendRuntime().getAsgMetrics(asg);
            },

            getAsgTotalCount(asg) { return this.getAsgMetrics(asg).total; },
            getAsgDoneCount(asg) { return this.getAsgMetrics(asg).done; },

            parseNumericScore(value) {
                return StateTrend.parseNumericScore(value);
            },

            buildTrendTimelineKey(timeline) {
                return StateTrend.buildTrendTimelineKey(timeline);
            },

            getQuizTrendAssignments() {
                return StateTrend.getQuizTrendAssignments(this.data);
            },

            getAsgRange(startId, endId, source = this.data) {
                return StateTrend.getAsgRange({ startId, endId, source });
            },

            classifyScoreTrend(entries) {
                return StateTrend.classifyScoreTrend(entries);
            },

            getScoreRangeReport(startId, endId, source = this.data) {
                return this._getTrendRuntime().getScoreRangeReport({
                    startId,
                    endId,
                    source,
                    rosterVersion: this._rosterVersion,
                    asgListVersion: this._asgListVersion
                });
            },

            getStudentAnalysisReport(options = {}) {
                const cache = StateTrend.createMetricsCacheAdapter({
                    useCacheService: this._useCacheService,
                    cacheService: CacheServiceRef,
                    metricsCache: this._metricsCache,
                    cacheVersion: this._cacheVersion,
                    maxMetricsCacheSize: CACHE_CONFIG.MAX_METRICS_CACHE_SIZE || 50
                });
                return StateTrend.getStudentAnalysisReport({
                    data: this.data,
                    roster: this.roster,
                    getAsgSubject: asg => this.getAsgSubject(asg),
                    isStuIncluded: (asg, stu) => this.isStuIncluded(asg, stu),
                    parseScore: value => this.parseNumericScore(value),
                    classifyTrend: entries => this.classifyScoreTrend(entries),
                    buildKey: timeline => this.buildTrendTimelineKey(timeline),
                    cache,
                    rosterVersion: this._rosterVersion,
                    asgListVersion: this._asgListVersion,
                    options
                });
            },

            _calculateStudentStats(stu, assignments) {
                return this._getTrendRuntime().calculateStudentStats(stu, assignments);
            },

            updRec(id, val, meta = {}) {
                const asg = this.cur;
                const result = this._getAssignmentRuntime().updRec(asg, id, val);
                if (!result.changed) return;
                this.invalidateDerived();
                this.markGridDirty({ ids: [id] });
                this.queueRecoveryDraft();
                this._queuePersist();
                this.view.renderStudent(id);
                if (result.prevDone !== result.nextDone) this.view.renderProgress(this.getAsgDoneCount(asg), this.getAsgTotalCount(asg));
            }
        };

            ServicesBridge = StateInit.createServicesBridge({
                getServicesInitialized: () => servicesInitialized,
                setServicesInitialized: value => { servicesInitialized = value; },
                getState: () => State,
                rosterService: RosterServiceRef,
                assignmentService: AssignmentServiceRef,
                preferenceService: PreferenceServiceRef,
                persistenceService: PersistenceServiceRef,
                warn: (stage, error) => {
                    console.warn(`Services bridge ${stage} failed, falling back to legacy state`, error);
                }
            });

            const UI = {
                isReady: false,
                actions: { has() { return false; }, run() { }, handleFile() { }, score() { } },
                MENU_CLOSE_MS: ANIMATION_DURATION.FULL_EXIT,
            _gridFrozen: false, _lastRenderAsgId: null, _lastRosterVersion: -1, _lastCardPoolSize: -1, _lastGridMetricsKey: '', _gridPaddingX: 0, _gridPaddingY: 0, _menuTimer: 0,
            init() {
                BackHandler.init();
                this.gridEl = $('grid'); this.counterEl = $('counter');
                this.customSelectEl = $('customSelect');
                this.customSelectDropdownEl = $('customSelectDropdown');
                this.customSelectTextEl = this.customSelectEl?.querySelector('.custom-select-text');
                
                // 初始化自定义下拉列表
                if (this.customSelectEl && this.customSelectDropdownEl) {
                    this.customSelectEl.onclick = (e) => {
                        e.stopPropagation();
                        this.toggleCustomSelect();
                    };
                    
                    this.customSelectDropdownEl.onclick = (e) => {
                        e.stopPropagation();
                        const option = e.target.closest('.custom-select-option');
                        if (option) {
                            const value = option.dataset.value;
                            State.selectAsg(+value);
                            this.closeCustomSelect();
                        }
                    };
                    
                    document.onclick = (e) => {
                        if (e.target.closest('#btnMenu, #menu, .custom-select-wrapper')) return;
                        this.closeCustomSelect();
                        this.closeMenu();
                    };
                }
                
                this.menuEl = $('menu');
                $('btnScore').onclick = () => this.actions.run('toggleScore');
                $('btnMenu').onclick = e => { e.stopPropagation(); this.toggleMenu(); };
                this.menuEl.onclick = e => {
                    e.stopPropagation();
                    const act = e.target.closest('[act]')?.getAttribute('act');
                    if (act && this.actions.has(act)) { this.closeMenu(); this.actions.run(act); }
                };
                this.setupGrid(); this.setupGridSizing(); State.applyViewMode(); State.applyScoring(); 
                
                // 延迟标记UI为就绪状态，确保State数据已加载
                setTimeout(() => {
                    this.isReady = true;
                    this.render();
                }, APP_CONFIG.UI_READY_DELAY_MS);
            },
            animationsEnabled() {
                return State.animations !== false;
            },
            ensureMenuEl() {
                if (!this.menuEl || !this.menuEl.isConnected) this.menuEl = $('menu');
                return this.menuEl;
            },
            openMenu() {
                clearTimeout(this._menuTimer);
                this._menuTimer = 0;
                if (!this.ensureMenuEl()) return;
                this.menuEl.classList.remove('closing');
                this.menuEl.classList.add('show');
            },
            closeMenu({ immediate = !this.animationsEnabled() } = {}) {
                clearTimeout(this._menuTimer);
                this._menuTimer = 0;
                if (!this.ensureMenuEl()) return;
                if (immediate) {
                    this.menuEl.classList.remove('show', 'closing');
                    return;
                }
                if (!this.menuEl.classList.contains('show')) {
                    this.menuEl.classList.remove('closing');
                    return;
                }
                this.menuEl.classList.remove('show');
                this.menuEl.classList.add('closing');
                this._menuTimer = setTimeout(() => {
                    this._menuTimer = 0;
                    this.menuEl?.classList.remove('closing');
                }, this.MENU_CLOSE_MS);
            },
            toggleMenu() {
                if (!this.ensureMenuEl()) return;
                if (this.menuEl.classList.contains('show')) {
                    this.closeMenu();
                    return;
                }
                this.openMenu();
            },
            setupGrid() {
                let timer = null, pressCard = null, longPressed = false, moved = false, suppressClickUntil = 0, startPos = { x: 0, y: 0 };
                const cancelTimer = () => { if (timer) clearTimeout(timer); timer = null; };
                const resetState = () => { if (pressCard) pressCard.classList.remove('pressing'); cancelTimer(); pressCard = null; longPressed = false; moved = false; };
                const shouldSuppressClick = () => {
                    if (Date.now() < suppressClickUntil) return true;
                    suppressClickUntil = 0;
                    return false;
                };
                const handle = (card, long) => {
                    if (card.dataset.excluded === '1') return;
                    const { id, name } = card.dataset;
                    if (long || State.scoring) this.actions.score(id, name);
                    else State.updRec(id, { done: !State.cur.records[id]?.done }, { source: 'grid', action: 'toggle-done', studentName: name });
                };
                this.gridEl.onpointerdown = e => {
                    const c = e.target.closest('.student-card'); if (!c) return;
                    pressCard = c; longPressed = false; moved = false; startPos = { x: e.clientX, y: e.clientY };
                    c.classList.add('pressing'); cancelTimer();
                    timer = setTimeout(() => {
                        timer = null;
                        longPressed = true;
                        suppressClickUntil = Date.now() + APP_CONFIG.SUPPRESS_CLICK_DURATION_MS;
                        c.classList.remove('pressing');
                        handle(c, true);
                        resetState();
                    }, APP_CONFIG.LONG_PRESS_DURATION_MS);
                };
                this.gridEl.onpointerup = e => {
                    const c = e.target.closest('.student-card');
                    if (c && pressCard === c) c.classList.remove('pressing');
                    resetState();
                };
                this.gridEl.onpointermove = e => {
                    if (!pressCard) return;
                    if (Math.abs(e.clientX - startPos.x) > 10 || Math.abs(e.clientY - startPos.y) > 8) { moved = true; pressCard.classList.remove('pressing'); cancelTimer(); }
                };
                this.gridEl.onpointercancel = this.gridEl.onpointerleave = resetState;
                this.gridEl.onclick = e => {
                    const c = e.target.closest('.student-card');
                    if (!c || shouldSuppressClick()) return;
                    handle(c, false);
                };
            },
            setupGridSizing() {
                this.refreshGridPadding();
                const refresh = () => { this.refreshGridPadding(); this.scheduleGridLayout(); };
                this._gridResizeObserver = new ResizeObserver(refresh); this._gridResizeObserver.observe(this.gridEl);
                window.addEventListener('resize', refresh, { passive: true });
                this.scheduleGridLayout();
            },
            refreshGridPadding() {
                const s = getComputedStyle(this.gridEl);
                this._gridPaddingX = parseFloat(s.paddingLeft) + parseFloat(s.paddingRight);
                this._gridPaddingY = parseFloat(s.paddingTop) + parseFloat(s.paddingBottom);
            },
            setGridFrozen(f) { this._gridFrozen = !!f; if (!f) this.scheduleGridLayout(); },
            scheduleGridLayout() {
                if (this._gridFrozen || !this.gridEl) return;
                cancelAnimationFrame(this._gridLayoutRaf || 0);
                this._gridLayoutRaf = requestAnimationFrame(() => this.updateGridMetrics());
            },
            calcGridLayout(count, width, height) {
                const cols = 5, rows = Math.ceil(Math.max(1, count) / cols);
                const baseGap = Math.max(4, Math.min(10, Math.round(Math.min(width, height) / 95)));
                const calc = g => ({ w: (width - g * (cols - 1)) / cols, h: (height - g * (rows - 1)) / rows });
                let g = baseGap, s = calc(g), b = Math.min(s.w, s.h);
                if (b < 24) { g = 2; s = calc(g); b = Math.min(s.w, s.h); }
                b = Math.max(18, b);
                return { cols, rows, gap: g, w: Math.max(18, s.w), h: Math.max(18, s.h), id: Math.max(12, Math.min(44, b * 0.34)), idC: Math.max(9, Math.min(16, b * 0.2)), name: Math.max(9, Math.min(20, b * 0.18)), tag: Math.max(8, Math.min(13, b * 0.12)), pad: Math.max(3, Math.min(8, b * 0.08)), rad: Math.max(8, Math.min(16, b * 0.15)) };
            },
            updateGridMetrics() {
                const grid = this.gridEl;
                if (!grid || !grid.isConnected) return;
                const count = State.roster.length;
                const w = grid.clientWidth - this._gridPaddingX;
                const h = grid.clientHeight - this._gridPaddingY;
                if (!w || !h) return;
                const m = this.calcGridLayout(count, w, h);
                const key = `${count}|${m.cols}|${m.rows}|${m.gap}|${m.w.toFixed(2)}|${m.h.toFixed(2)}|${m.id}|${m.name}|${m.tag}|${m.pad}|${m.rad}`;
                if (key === this._lastGridMetricsKey) return;
                this._lastGridMetricsKey = key;
                const d = grid.style;
                d.setProperty('--grid-cols', m.cols); d.setProperty('--grid-rows', m.rows); d.setProperty('--grid-gap', `${m.gap}px`);
                d.setProperty('--cell-w', `${m.w}px`); d.setProperty('--cell-h', `${m.h}px`); d.setProperty('--id-size', `${m.id}px`);
                d.setProperty('--id-corner-size', `${m.idC}px`); d.setProperty('--name-size', `${m.name}px`);
                d.setProperty('--tag-size', `${m.tag}px`); d.setProperty('--card-pad', `${m.pad}px`); d.setProperty('--card-radius', `${m.rad}px`);
            },
            createCard() { const c = document.createElement('button'); c.type = 'button'; c.className = 'student-card'; c.innerHTML = '<span class="card-id"></span><span class="card-name"></span><span class="card-score" hidden></span>'; return c; },
            getStudentCard(id) {
                const index = State.rosterIndexMap.get(String(id));
                if (index == null || !this.gridEl) return null;
                this.syncCardPool();
                return this.gridEl.children[index] || null;
            },
            // 虚拟列表配置
            VIRTUAL_SCROLL_THRESHOLD: GRID_CONFIG.VIRTUAL_SCROLL_THRESHOLD,
            _virtualRenderToken: 0,
            _isVirtualRendering: false,

            syncCardPool() {
                const grid = this.gridEl, target = State.roster.length;
                while (grid.children.length < target) grid.appendChild(this.createCard());
                while (grid.children.length > target) grid.lastElementChild.remove();
            },

            // 分块渲染卡片池，避免大数据量时阻塞主线程
            syncCardPoolChunked(onComplete) {
                const grid = this.gridEl;
                const target = State.roster.length;
                const current = grid.children.length;
                const token = ++this._virtualRenderToken;

                if (current === target) {
                    onComplete?.();
                    return;
                }

                this._isVirtualRendering = true;
                const batchSize = GRID_CONFIG.BATCH_SIZE;
                let index = current;

                const processBatch = () => {
                    if (token !== this._virtualRenderToken) {
                        this._isVirtualRendering = false;
                        return;
                    }

                    const frag = document.createDocumentFragment();
                    const end = Math.min(index + batchSize, target);

                    if (current < target) {
                        // 添加卡片
                        for (; index < end; index++) {
                            frag.appendChild(this.createCard());
                        }
                        grid.appendChild(frag);
                    } else {
                        // 移除多余卡片
                        for (; index < end; index++) {
                            grid.lastElementChild?.remove();
                        }
                    }

                    if (index < target) {
                        requestAnimationFrame(processBatch);
                    } else {
                        this._isVirtualRendering = false;
                        onComplete?.();
                    }
                };

                requestAnimationFrame(processBatch);
            },
            renderCard(card, stu, rec, excluded = false) {
                card.dataset.id = stu.id; card.dataset.name = stu.name; card.dataset.excluded = excluded ? '1' : '0';
                const [idEl, nameEl, scoreEl] = card.children;
                if (idEl.textContent !== stu.id) idEl.textContent = stu.id;
                if (nameEl.textContent !== stu.name) nameEl.textContent = stu.name;
                if (!globalThis.Modal || !Modal.isAnimating) {
                    card.classList.toggle('done', !excluded && !!rec.done);
                }
                card.classList.toggle('excluded', excluded);
                if (!excluded && rec.score != null && rec.score !== '') {
                    scoreEl.hidden = false; scoreEl.textContent = String(rec.score);
                } else { scoreEl.hidden = true; scoreEl.textContent = ''; }
            },
            renderStudent(id) {
                const asg = State.cur, index = State.rosterIndexMap.get(id);
                if (!asg || index == null) return;
                const card = this.getStudentCard(id);
                if (!card) return;
                this.renderCard(card, State.roster[index], asg.records[id] || {}, !State.isStuIncluded(asg, State.roster[index]));
            },
            renderProgress(done, total = State.roster.length) {
                if (!this.counterEl || !this.counterEl.isConnected) this.counterEl = $('counter');
                if (!this.counterEl) return;
                this.counterEl.textContent = `${done}/${total}`;
            },
            ensureTaskOptions() {
                this.ensureCustomSelectOptions();
            },
            
            ensureCustomSelectOptions() {
                if (!this.customSelectEl || !this.customSelectDropdownEl || !this.customSelectTextEl) {
                    this.customSelectEl = $('customSelect');
                    this.customSelectDropdownEl = $('customSelectDropdown');
                    this.customSelectTextEl = this.customSelectEl?.querySelector('.custom-select-text');
                }
                
                if (!this.customSelectEl || !this.customSelectDropdownEl) return;
                
                // 更新下拉选项
                if (this._customSelectVersion !== State._asgListVersion) {
                    this.customSelectDropdownEl.innerHTML = State.data.map(a => `
                        <div class="custom-select-option" data-value="${a.id}">
                            <span>${a.name}</span>
                        </div>
                    `).join('');
                    this._customSelectVersion = State._asgListVersion;
                }
                
                // 更新选中状态和显示文本
                const currentAsg = State.cur;
                if (currentAsg) {
                    this.customSelectTextEl.textContent = currentAsg.name;
                    const options = this.customSelectDropdownEl.querySelectorAll('.custom-select-option');
                    options.forEach(opt => {
                        opt.classList.toggle('active', opt.dataset.value === String(State.curId));
                    });
                }
            },
            
            toggleCustomSelect() {
                if (!this.customSelectEl || !this.customSelectDropdownEl) return;
                
                const isOpen = this.customSelectEl.classList.contains('open');
                if (isOpen) {
                    this.closeCustomSelect();
                } else {
                    this.openCustomSelect();
                }
            },
            
            openCustomSelect() {
                if (!this.customSelectEl || !this.customSelectDropdownEl) return;
                
                // 先关闭菜单
                this.closeMenu();
                
                this.customSelectEl.classList.add('open');
                this.customSelectDropdownEl.classList.remove('closing');
                this.customSelectDropdownEl.classList.add('show');
            },
            
            closeCustomSelect({ immediate = !this.animationsEnabled() } = {}) {
                if (!this.customSelectEl || !this.customSelectDropdownEl) return;
                
                if (immediate) {
                    this.customSelectEl.classList.remove('open');
                    this.customSelectDropdownEl.classList.remove('show', 'closing');
                    return;
                }
                
                if (!this.customSelectDropdownEl.classList.contains('show')) {
                    this.customSelectEl.classList.remove('open');
                    return;
                }
                
                this.customSelectDropdownEl.classList.remove('show');
                this.customSelectDropdownEl.classList.add('closing');
                
                setTimeout(() => {
                    this.customSelectEl.classList.remove('open');
                    this.customSelectDropdownEl?.classList.remove('closing');
                }, this.MENU_CLOSE_MS);
            },
            render() {
                // 确保State数据已加载
                if (!State.data.length || !State.roster.length) return;

                const asg = State.cur; if (!asg) return;
                const currentPoolSize = State.roster.length;
                const dirty = State.consumeGridDirty();
                const force = dirty.full || this._lastCardPoolSize !== currentPoolSize;
                const useVirtual = currentPoolSize > this.VIRTUAL_SCROLL_THRESHOLD;

                this.ensureTaskOptions();

                // 大数据量时使用分块渲染
                if (useVirtual && force) {
                    this.syncCardPoolChunked(() => {
                        this._renderCardsContent(asg, dirty, force);
                    });
                    return;
                }

                this.syncCardPool();
                this._renderCardsContent(asg, dirty, force);
            },

            // 分块渲染卡片内容，避免阻塞主线程
            _renderCardsContent(asg, dirty, force) {
                const cards = this.gridEl.children;
                const roster = State.roster;
                const token = ++this._virtualRenderToken;

                if (force) {
                    if (roster.length > this.VIRTUAL_SCROLL_THRESHOLD) {
                        // 大数据量：分块渲染内容
                        this._renderCardsChunked(asg, roster, cards, token);
                    } else {
                        // 小数据量：直接渲染
                        requestAnimationFrame(() => {
                            roster.forEach((stu, i) => this.renderCard(cards[i], stu, asg.records[stu.id] || {}, !State.isStuIncluded(asg, stu)));
                        });
                    }
                } else {
                    // 对单个卡片的更新
                    requestAnimationFrame(() => {
                        dirty.ids.forEach(id => {
                            const idx = State.rosterIndexMap.get(id);
                            if (idx != null) this.renderCard(cards[idx], State.roster[idx], asg.records[id] || {}, !State.isStuIncluded(asg, State.roster[idx]));
                        });
                    });
                }

                this.renderProgress(State.getAsgDoneCount(asg), State.getAsgTotalCount(asg));
                this._lastCardPoolSize = roster.length;
                this.scheduleGridLayout();
            },

            // 分块渲染卡片内容
            _renderCardsChunked(asg, roster, cards, token) {
                const batchSize = GRID_CONFIG.BATCH_SIZE;
                let index = 0;

                const processBatch = () => {
                    if (token !== this._virtualRenderToken) return;

                    const end = Math.min(index + batchSize, roster.length);
                    for (; index < end; index++) {
                        const stu = roster[index];
                        this.renderCard(cards[index], stu, asg.records[stu.id] || {}, !State.isStuIncluded(asg, stu));
                    }

                    if (index < roster.length) {
                        requestAnimationFrame(processBatch);
                    }
                };

                requestAnimationFrame(processBatch);
            }
        };

            State.view = {
                init: () => UI.init(), render: () => UI.render(),
                renderStudent: id => UI.renderStudent(id),
                renderProgress: (done, total) => UI.renderProgress(done, total),
                isReady: () => UI.isReady
            };

            return { State, UI };
        })();

        Object.assign(globalThis, { State: App.State, UI: App.UI });
