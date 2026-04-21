        const App = (function() {
            // 服务层集成 - 渐进式迁移
            let servicesInitialized = false;
            const ServicesBridge = {
                init() {
                    if (servicesInitialized) return;
                    try {
                        if (typeof RosterService !== 'undefined') RosterService.init?.();
                        if (typeof AssignmentService !== 'undefined') AssignmentService.init?.();
                        if (typeof PreferenceService !== 'undefined') PreferenceService.init?.();
                        if (typeof PersistenceService !== 'undefined') PersistenceService.init?.();
                        servicesInitialized = true;
                    } catch (e) {
                        console.warn('Services initialization failed, falling back to legacy mode', e);
                    }
                },
                syncFromLegacy() {
                    // 保持传统系统和服务系统同步
                    try {
                        if (typeof RosterService !== 'undefined') {
                            RosterService.parse?.(State.list);
                        }
                        if (typeof AssignmentService !== 'undefined') {
                            AssignmentService.init?.(State.data);
                            AssignmentService.setCurrentId?.(State.curId);
                        }
                    } catch (e) {
                        // 静默失败，不影响传统功能
                    }
                },
                syncToLegacy() {
                    // 从服务系统同步到传统系统
                    try {
                        if (typeof RosterService !== 'undefined') {
                            State.list = RosterService.getRawList?.() || State.list;
                            State.roster = RosterService.getAllStudents?.() || State.roster;
                            State.rosterIndexMap = new Map(RosterService.getAllStudents?.().map((stu, idx) => [stu.id, idx]) || State.rosterIndexMap);
                            State.noEnglishIds = State.roster.filter(stu => stu.noEnglish).map(stu => stu.id);
                        }
                        if (typeof AssignmentService !== 'undefined') {
                            State.data = AssignmentService.getAll?.() || State.data;
                            State.curId = AssignmentService.getCurrentId?.() || State.curId;
                            State.asgMap = new Map(State.data.map(a => [a.id, a]));
                        }
                        if (typeof PreferenceService !== 'undefined') {
                            State.animations = PreferenceService.getAnimations?.() ?? State.animations;
                            State.prefs = PreferenceService.getPrefs?.() || State.prefs;
                        }
                    } catch (e) {
                        // 静默失败，不影响传统功能
                    }
                }
            };

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
                    const initAsync = async () => {
                        // 初始化服务层
                        ServicesBridge.init();

                        this.list = LS.get(KEYS.LIST, DEFAULT_ROSTER);
                        this.animations = LS.get(KEYS.ANIM, true);
                        this.prefs = this.normalizePrefs(LS.get(KEYS.PREFS, this.prefs));

                        // 初始化服务层数据
                        ServicesBridge.syncFromLegacy();

                        setTimeout(() => {
                            try {
                                this.data = LS.get(KEYS.DATA, []).map(a => this.normalizeAsg(a)).filter(Boolean);
                                
                                // 初始化 AssignmentService
                                if (this._useAssignmentService) {
                                    AssignmentService.init(this.data);
                                    this.curId = AssignmentService.getCurrentId();
                                }
                                
                                const recovered = this.applyRecoveryDraft();

                                try {
                                    this.parseRoster();
                                } catch (err) {
                                    window.alert(`名单数据异常：${err.message}\n请先修复本地名单后再使用。`);
                                    throw err;
                                }

                                if (!this.data.length) {
                                    this.addAsg('任务 1');
                                }

                                const repairedIds = this.sanitizeAsgIds();
                                this._ensureAsgIndex();
                                if (repairedIds) Toast.show('已自动修复异常任务 ID');

                                this.curId = this.resolveCurId(this.curId);
                                this.applyAnim();
                                this.applyCardColor();
                                window.addEventListener('beforeunload', () => this._flushPersist({ includeDraft: true }));
                                this.view.init();
                                // 初始化 PersistenceService
                                if (this._usePersistenceService) {
                                    PersistenceService.init();
                                }
                                this._lastDraftSnapshot = this.getRecoverySnapshot();
                                if (recovered) Toast.show('已恢复上次未完成的临时登记数据');

                                // 再次同步到服务层
                                ServicesBridge.syncFromLegacy();
                            } catch (err) {
                                console.error('初始化失败:', err);
                                Toast.show('初始化失败: ' + (err?.message || '未知错误'));
                                this.data = [];
                                this.list = DEFAULT_ROSTER;
                                this.addAsg('任务 1');
                            }
                        }, APP_CONFIG.INIT_DELAY_MS || 100);
                    };

                    initAsync();
                },

            /**
             * 规范化用户偏好设置
             * @param {Object} raw - 原始偏好设置
             * @returns {Object} 规范化后的偏好设置
             */
            normalizePrefs(raw) {
                const prefs = raw && typeof raw === 'object' ? raw : {};
                return { cardDoneColor: ColorUtil.normalizeHex(prefs.cardDoneColor, '#68c490') };
            },

            /**
             * 确保任务索引映射已构建
             * @private
             */
            _ensureAsgIndex() {
                if (!this.asgMap.size || this.asgMap.size !== this.data.length) {
                    this.asgMap = new Map(this.data.map(a => [a.id, a]));
                }
            },

            /**
             * 重建任务索引映射
             */
            rebuildAsgIndex() { this.asgMap = new Map(this.data.map(a => [a.id, a])); },

            /**
             * 解析当前任务ID
             * @param {number} candidate - 候选ID
             * @returns {number|null} 有效的任务ID或null
             */
            resolveCurId(candidate) {
                if (this.asgMap.has(candidate)) return candidate;
                return this.data[this.data.length - 1]?.id ?? null;
            },

            /**
             * 获取恢复草稿数据
             * @returns {Object|null} 恢复状态对象或null
             */
            getRecoveryDraft() {
                if (this._usePersistenceService) {
                    return PersistenceService.getRecoveryDraft();
                }
                const draft = LS.get(KEYS.DRAFT, null);
                if (!Validator.isValidRecoveryDraft(draft)) return null;
                return this.cloneRecoveryState({
                    list: draft.list.map(v => String(v ?? '').trim()).filter(Boolean),
                    data: draft.data.map(a => this.normalizeAsg(a)).filter(Boolean),
                    prefs: this.normalizePrefs(draft.prefs),
                    curId: Number(draft.curId)
                });
            },

            /**
             * 克隆恢复记录
             * @param {Object} records - 记录对象
             * @returns {Object} 克隆后的记录
             */
            cloneRecoveryRecords(records) {
                const source = records && typeof records === 'object' ? records : {};
                return Object.fromEntries(
                    Object.entries(source).map(([id, entry]) => [id, entry && typeof entry === 'object' ? { ...entry } : entry])
                );
            },

            /**
             * 克隆恢复数据
             * @param {Array} data - 任务数据数组
             * @returns {Array} 克隆后的任务数据
             */
            cloneRecoveryData(data) {
                return (Array.isArray(data) ? data : [])
                    .map(item => this.normalizeAsg(item))
                    .filter(Boolean)
                    .map(asg => ({ id: asg.id, name: asg.name, subject: asg.subject, records: this.cloneRecoveryRecords(asg.records) }));
            },

            /**
             * 克隆恢复状态
             * @param {Object} state - 状态对象
             * @returns {Object} 克隆后的状态
             */
            cloneRecoveryState(state) {
                const source = state && typeof state === 'object' ? state : {};
                const curId = source.curId == null || source.curId === '' ? null : Number(source.curId);
                return {
                    list: Array.isArray(source.list) ? source.list.map(v => String(v ?? '').trim()).filter(Boolean) : [],
                    data: this.cloneRecoveryData(source.data),
                    prefs: this.normalizePrefs(source.prefs),
                    curId: Number.isFinite(curId) ? curId : null
                };
            },

            /**
             * 获取当前恢复快照
             * @returns {Object} 当前状态快照
             */
            getRecoverySnapshot() {
                if (this._usePersistenceService) {
                    return PersistenceService.getRecoverySnapshot();
                }
                return this.cloneRecoveryState({
                    list: this.list,
                    data: this.data,
                    prefs: this.prefs,
                    curId: this.curId
                });
            },

            /**
             * 比较两个恢复值是否相同
             * @param {*} a - 值A
             * @param {*} b - 值B
             * @returns {boolean}
             */
            isSameRecoveryValue(a, b) {
                return a === b || (a == null && b == null);
            },

            /**
             * 比较两个恢复条目是否相同
             * @param {*} a - 条目A
             * @param {*} b - 条目B
             * @returns {boolean}
             */
            isSameRecoveryEntry(a, b) {
                if (a === b) return true;
                const objA = a && typeof a === 'object' ? a : null;
                const objB = b && typeof b === 'object' ? b : null;
                if (!objA || !objB) return objA === objB;
                const keysA = Object.keys(objA);
                const keysB = Object.keys(objB);
                if (keysA.length !== keysB.length) return false;
                return keysA.every(key => this.isSameRecoveryValue(objA[key], objB[key]));
            },

            /**
             * 比较两组恢复记录是否相同
             * @param {Object} a - 记录A
             * @param {Object} b - 记录B
             * @returns {boolean}
             */
            isSameRecoveryRecords(a, b) {
                const recA = a && typeof a === 'object' ? a : {};
                const recB = b && typeof b === 'object' ? b : {};
                const idsA = Object.keys(recA);
                const idsB = Object.keys(recB);
                if (idsA.length !== idsB.length) return false;
                return idsA.every(id => this.isSameRecoveryEntry(recA[id], recB[id]));
            },

            /**
             * 比较两组恢复数据是否相同
             * @param {Array} a - 数据A
             * @param {Array} b - 数据B
             * @returns {boolean}
             */
            isSameRecoveryData(a, b) {
                if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) return false;
                for (let i = 0; i < a.length; i++) {
                    const left = a[i];
                    const right = b[i];
                    if (!left || !right) return false;
                    if (left.id !== right.id || left.name !== right.name || left.subject !== right.subject) return false;
                    if (!this.isSameRecoveryRecords(left.records, right.records)) return false;
                }
                return true;
            },

            /**
             * 比较两个恢复状态是否相同
             * @param {Object} a - 状态A
             * @param {Object} b - 状态B
             * @returns {boolean}
             */
            isSameRecoveryState(a, b) {
                if (!a || !b) return false;
                if (!Array.isArray(a.list) || !Array.isArray(b.list) || a.list.length !== b.list.length) return false;
                if (a.list.some((item, index) => item !== b.list[index])) return false;
                if (!this.isSameRecoveryData(a.data, b.data)) return false;
                const curA = Number.isFinite(a.curId) ? a.curId : null;
                const curB = Number.isFinite(b.curId) ? b.curId : null;
                return curA === curB && this.normalizePrefs(a.prefs).cardDoneColor === this.normalizePrefs(b.prefs).cardDoneColor;
            },

            /**
             * 应用恢复草稿
             * @returns {boolean} 是否成功应用
             */
            applyRecoveryDraft() {
                if (this._usePersistenceService) {
                    const success = PersistenceService.applyRecoveryDraft();
                    if (success) {
                        // 同步服务层数据回 State
                        if (this._useRosterService) this.list = RosterService.getRawList();
                        if (this._useAssignmentService) {
                            this.data = AssignmentService.getAll();
                            this.curId = AssignmentService.getCurrentId();
                        }
                        if (this._usePreferenceService) {
                            this.prefs = PreferenceService.getPrefs();
                            this.animations = PreferenceService.getAnimations();
                        }
                    }
                    return success;
                } else {
                    const draft = this.getRecoveryDraft();
                    if (!draft) return false;
                    const current = { list: this.list, data: this.data, prefs: this.prefs, curId: this.curId };
                    if (this.isSameRecoveryState(draft, current)) return false;
                    Object.assign(this, { list: draft.list, data: draft.data, prefs: draft.prefs, curId: Number.isFinite(draft.curId) ? draft.curId : this.curId });
                    return true;
                }
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
                if (this._usePersistenceService) {
                    return PersistenceService.saveDraft();
                } else {
                    clearTimeout(this._draftTimer);
                    this._draftTimer = 0;
                    this._draftDirty = false;
                    const snapshot = this.getRecoverySnapshot();
                    if (this._lastDraftSnapshot && this.isSameRecoveryState(snapshot, this._lastDraftSnapshot)) return false;
                    this._lastDraftSnapshot = this.cloneRecoveryState(snapshot);
                    LS.set(KEYS.DRAFT, { version: 1, updatedAt: Date.now(), ...snapshot });
                    return true;
                }
            },

            sanitizeAsgIds() {
                const used = new Set(), cleaned = [];
                let repaired = false;
                this.data.forEach(item => {
                    const asg = this.normalizeAsg(item);
                    if (!asg || asg._invalidId) { repaired = true; return; }
                    if (used.has(asg.id)) {
                        repaired = true;
                        asg.id = IdGenerator.generateUnique(id => used.has(id));
                    }
                    used.add(asg.id);
                    cleaned.push(asg);
                });
                this.data = cleaned;
                return repaired;
            },

            /**
             * 规范化任务对象
             * @param {Object} asg - 原始任务对象
             * @returns {Object|null} 规范化后的任务对象
             */
            normalizeAsg(asg) {
                if (!asg || typeof asg !== 'object') return null;
                const name = String(asg.name || '').trim();
                const subject = String(asg.subject || '').trim() || (/英语/.test(name) ? '英语' : '其他');
                const id = Number(asg.id);
                const invalidId = !Number.isFinite(id);
                const normalized = { id: invalidId ? null : id, name: name || '未命名任务', subject, records: asg.records && typeof asg.records === 'object' ? asg.records : {} };
                if (invalidId) normalized._invalidId = true;
                return normalized;
            },

            /**
             * 原地规范化任务对象
             * @param {Object} asg - 任务对象
             * @returns {Object|null} 规范化后的任务对象
             */
            normalizeAsgInPlace(asg) {
                const n = this.normalizeAsg(asg);
                if (!n) return null;
                if (asg && typeof asg === 'object') Object.assign(asg, n);
                return n;
            },

            /**
             * 使派生数据失效，清除缓存
             */
            invalidateDerived() {
                if (this._useCacheService) {
                    CacheService.invalidateAll();
                } else {
                    this._cacheVersion++;
                    this._metricsCache.clear();
                }
            },

            /**
             * 标记网格需要重绘
             * @param {Object} options - 选项
             * @param {boolean} options.full - 是否完全重绘
             * @param {string[]} options.ids - 需要重绘的学生ID列表
             */
            markGridDirty({ full = false, ids = [] } = {}) {
                if (full) { this._gridDirtyFull = true; this._gridDirtyStudentIds.clear(); return; }
                if (this._gridDirtyFull) return;
                ids.forEach(id => { const key = String(id || '').trim(); if (key) this._gridDirtyStudentIds.add(key); });
            },

            /**
             * 获取并清除网格脏标记
             * @returns {Object} 脏标记状态
             */
            consumeGridDirty() {
                const dirty = { full: this._gridDirtyFull, ids: this._gridDirtyFull ? [] : Array.from(this._gridDirtyStudentIds) };
                this._gridDirtyFull = false;
                this._gridDirtyStudentIds.clear();
                return dirty;
            },

            _queuePersist() { 
                if (this._usePersistenceService) {
                    PersistenceService.queuePersist();
                } else {
                    clearTimeout(this._persistTimer); 
                    this._persistTimer = setTimeout(() => this._flushPersist(), 300); 
                }
            },
            queuePersist() { this._queuePersist(); }, // Maintain API

            _flushPersist({ includeDraft = false } = {}) {
                if (this._usePersistenceService) {
                    PersistenceService.markDirtyData(this._dirtyData);
                    PersistenceService.markDirtyList(this._dirtyList);
                    PersistenceService.flushPersist({ includeDraft });
                    this._dirtyData = false;
                    this._dirtyList = false;
                } else {
                    clearTimeout(this._persistTimer);
                    this._persistTimer = 0;
                    if (this._dirtyData) { LS.set(KEYS.DATA, this.data); this._dirtyData = false; }
                    if (this._dirtyList) { LS.set(KEYS.LIST, this.list); this._dirtyList = false; }
                    if (includeDraft) this.flushRecoveryDraft();
                }
            },
            flushPersist(options) { this._flushPersist(options); }, // Maintain API

            /**
             * 解析名单行
             * @param {string} rawLine - 原始行文本
             * @returns {Object} 解析后的学生对象 {id, name, noEnglish}
             */
            parseRosterLine(rawLine) {
                if (this._useRosterService) {
                    return RosterService.parseLine(rawLine);
                }
                const lineText = String(rawLine ?? '').trim();
                const noEnRegex = /\s*#(?:非英语|非英|no-en|noeng|not-en)\s*$/i;
                const noEnglish = noEnRegex.test(lineText);
                const line = lineText.replace(noEnRegex, '').trim();
                const i = line.indexOf(' ');
                return i === -1 ? { id: line, name: '', noEnglish } : { id: line.slice(0, i), name: line.slice(i + 1), noEnglish };
            },

            /**
             * 获取重复的ID列表
             * @param {string[]} ids - ID列表
             * @returns {string[]} 重复的ID列表
             */
            getDuplicateIds(ids) {
                if (this._useRosterService) {
                    return RosterService.getDuplicateIds?.(ids) ?? [];
                }
                const seen = new Set(), dup = new Set();
                ids.forEach(id => { const key = String(id || '').trim(); if (!key) return; if (seen.has(key)) dup.add(key); seen.add(key); });
                return Array.from(dup);
            },

            /**
             * 断言名单ID唯一
             * @param {string[]} ids - ID列表
             * @param {string} sourceLabel - 来源标签
             * @throws {Error} 存在重复ID时抛出错误
             */
            assertUniqueRosterIds(ids, sourceLabel = '名单') {
                if (this._useRosterService) {
                    RosterService.assertUniqueIds?.(ids, sourceLabel);
                    return;
                }
                const dup = this.getDuplicateIds(ids);
                if (dup.length) throw new Error(`${sourceLabel}存在重复学号: ${dup.join('、')}`);
            },

            /**
             * 解析名单数据，将原始名单列表转换为结构化的学生对象数组
             * 并构建索引映射，用于快速查找学生信息
             * @returns {void}
             */
            parseRoster() {
                if (this._useRosterService) {
                    const result = RosterService.parse(this.list);
                    this.roster = RosterService.getAllStudents();
                    this.rosterIndexMap = new Map(this.roster.map((stu, index) => [stu.id, index]));
                    this.noEnglishIds = this.roster.filter(stu => stu.noEnglish).map(stu => stu.id);
                    this._rosterVersion = RosterService.getVersion();
                } else {
                    this.roster = this.list.map(l => this.parseRosterLine(l)).filter(s => s.id);
                    this.assertUniqueRosterIds(this.roster.map(stu => stu.id), '名单');
                    this.rosterIndexMap = new Map(this.roster.map((stu, index) => [stu.id, index]));
                    this.noEnglishIds = this.roster.filter(stu => stu.noEnglish).map(stu => stu.id);
                    this._rosterVersion++;
                }
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
                if (normalizeMode === 'all') { this.sanitizeAsgIds(); this._ensureAsgIndex(); }
                else if (normalizeMode === 'target' && targetAsgId != null) {
                    const asg = this.asgMap.get(targetAsgId) || this.data.find(item => item.id === targetAsgId);
                    if (asg) this.normalizeAsgInPlace(asg);
                } else if (normalizeMode === 'none') { this._ensureAsgIndex(); }

                if (invalidateDerived) this.invalidateDerived();
                if (dirtyData) this._dirtyData = true;
                if (dirtyList) this._dirtyList = true;
                if (asgListChanged) {
                    this._asgListVersion++;
                    this._metricsCache.clear();
                }
                if (dirtyData || dirtyList) this.queueRecoveryDraft();
                if (immediate) this._flushPersist({ includeDraft: true }); else this._queuePersist();
                if (render && this.view.isReady()) this.view.render();
            },

            saveAnim() { LS.set(KEYS.ANIM, this.animations); this.applyAnim(); },
            savePrefs() {
                this.prefs = this.normalizePrefs(this.prefs);
                this.queueRecoveryDraft();
                LS.set(KEYS.PREFS, this.prefs);
                this.applyCardColor();
            },

            applyAnim() {
                document.body.classList.toggle('no-animations', !this.animations);
                const sAnim = $('statusAnim'); if (sAnim) sAnim.textContent = this.animations ? '开' : '关';
            },

            applyCardColor() {
                const base = ColorUtil.normalizeHex(this.prefs?.cardDoneColor, '#68c490');
                const [s, e, b] = [0.08, 0.14, 0.2].map(r => ColorUtil.mix(base, r === 0.08 ? '#ffffff' : '#10261a', r));
                const lum = ColorUtil.luminance(base);
                const badgeBg = lum > 0.35 ? ColorUtil.mix('#111111', '#ffffff', 0.12) : ColorUtil.mix('#ffffff', '#111111', 0.08);
                const badgeText = lum > 0.35 ? 'rgba(255,255,255,0.95)' : 'rgba(17,17,17,0.92)';
                const d = document.documentElement.style;
                d.setProperty('--done-card-start', s); d.setProperty('--done-card-end', e); d.setProperty('--done-card-border', b);
                d.setProperty('--done-card-shadow', ColorUtil.withAlpha(base, 0.22));
                d.setProperty('--done-card-press-shadow', ColorUtil.withAlpha(base, 0.32));
                d.setProperty('--done-card-badge', badgeBg);
                d.setProperty('--done-card-badge-text', badgeText);
            },

            applyScoring() {
                const sScore = $('statusScore'); if (sScore) sScore.textContent = this.scoring ? '开' : '关';
                const btnScore = $('btnScore'); if (btnScore) btnScore.classList.toggle('active', !!this.scoring);
            },

            applyViewMode() {
                const showNames = this.mode === 'name';
                document.body.classList.toggle('mode-names', showNames);
                const sView = $('statusView'); if (sView) sView.textContent = showNames ? '开' : '关';
                const btnView = $('btnView'); if (btnView) btnView.classList.toggle('active', showNames);
            },

            toggleViewMode() {
                this.mode = this.mode === 'id' ? 'name' : 'id';
                this.applyViewMode();
            },

            invertCurrentSelection() {
                const asg = this.cur;
                if (!asg) return;
                const records = asg.records || (asg.records = {});
                for (const stu of this.roster) {
                    if (!this.isStuIncluded(asg, stu)) continue;
                    const id = stu.id;
                    const nextDone = !records[id]?.done;
                    records[id] = { ...(records[id] || {}), done: nextDone };
                    if (!records[id].done && (records[id].score == null || records[id].score === '')) delete records[id];
                }
                this.invalidateDerived();
                this.markGridDirty({ full: true });
                this.queueRecoveryDraft();
                this._queuePersist();
                this.view.render();
            },

            get cur() { return this.asgMap.get(this.curId) || this.data[0]; },

            addAsg(n) {
                if (this._useAssignmentService) {
                    const newAsg = AssignmentService.create(n);
                    this.data = AssignmentService.getAll();
                    this._ensureAsgIndex();
                    this.curId = AssignmentService.getCurrentId();
                    this.markGridDirty({ full: true });
                    this.save({ asgListChanged: true, normalizeMode: 'none', invalidateDerived: false });
                } else {
                    const id = IdGenerator.generateUnique(id => this.asgMap.has(id));
                    this.data.push(this.normalizeAsg({ id, name: (n || '').trim() || '未命名任务', subject: '英语', records: {} }));
                    this._ensureAsgIndex();
                    this.curId = id;
                    this.markGridDirty({ full: true });
                    this.save({ asgListChanged: true, normalizeMode: 'none', invalidateDerived: false });
                }
            },

            selectAsg(id) {
                if (this._useAssignmentService) {
                    if (!AssignmentService.has(id)) {
                        return;
                    }
                    AssignmentService.select(id);
                    this.curId = AssignmentService.getCurrentId();
                } else {
                    if (!this.asgMap.has(id)) {
                        return;
                    }
                    this.curId = id;
                }
                this.markGridDirty({ full: true });
                this.view.render();
            },

            renameAsg(id, name) {
                if (this._useAssignmentService) {
                    const success = AssignmentService.rename(id, name);
                    if (success) {
                        this.data = AssignmentService.getAll();
                        this._ensureAsgIndex();
                        this.save({ asgListChanged: true, normalizeMode: 'target', targetAsgId: id, invalidateDerived: false });
                    }
                    return success;
                } else {
                    const asg = this.asgMap.get(id);
                    if (!asg || !(name || '').trim()) return false;
                    asg.name = name.trim();
                    this.save({ asgListChanged: true, normalizeMode: 'target', targetAsgId: id, invalidateDerived: false });
                    return true;
                }
            },

            updateAsgMeta(id, payload = {}) {
                if (this._useAssignmentService) {
                    const success = AssignmentService.updateMeta(id, payload);
                    if (success) {
                        this.data = AssignmentService.getAll();
                        this._ensureAsgIndex();
                        const asg = this.asgMap.get(id);
                        const prevSub = this.getAsgSubject(asg);
                        if (id === this.curId && prevSub !== (payload.subject ?? asg?.subject)) this.markGridDirty({ full: true });
                        this.save({ asgListChanged: true, normalizeMode: 'target', targetAsgId: id, invalidateDerived: true });
                    }
                    return success;
                } else {
                    const asg = this.asgMap.get(id);
                    if (!asg) return false;
                    const safeName = String(payload.name ?? asg.name).trim();
                    const safeSubject = String(payload.subject ?? asg.subject ?? '').trim() || '英语';
                    if (!safeName) return false;
                    const prevSub = this.getAsgSubject(asg);
                    Object.assign(asg, { name: safeName, subject: safeSubject });
                    if (id === this.curId && prevSub !== safeSubject) this.markGridDirty({ full: true });
                    this.save({ asgListChanged: true, normalizeMode: 'target', targetAsgId: id, invalidateDerived: prevSub !== safeSubject });
                    return true;
                }
            },

            removeAsg(id) {
                if (this.data.length <= 1) return false;
                if (this._useAssignmentService) {
                    const success = AssignmentService.remove(id);
                    if (success) {
                        this.data = AssignmentService.getAll();
                        this._ensureAsgIndex();
                        this.curId = AssignmentService.getCurrentId();
                        this.markGridDirty({ full: true });
                        this.save({ asgListChanged: true, normalizeMode: 'none', invalidateDerived: false });
                    }
                    return success;
                } else {
                    const idx = this.data.findIndex(a => a.id === id);
                    if (idx === -1) {
                        return false;
                    }
                    this.data.splice(idx, 1);
                    if (this.curId === id) this.curId = (this.data[Math.max(0, idx - 1)] || this.data[0]).id;
                    this._ensureAsgIndex();
                    this.markGridDirty({ full: true });
                    this.save({ asgListChanged: true, normalizeMode: 'none', invalidateDerived: false });
                    return true;
                }
            },

            getAsgSubject(asg) { 
                if (this._useAssignmentService && asg) {
                    return AssignmentService.getSubject(asg);
                }
                return String(asg?.subject || '').trim() || (/英语/.test(asg?.name || '') ? '英语' : '其他'); 
            },
            isEnglishAsg(asg) { 
                if (this._useAssignmentService && asg) {
                    return AssignmentService.isEnglish(asg);
                }
                return this.getAsgSubject(asg) === '英语'; 
            },
            isStuIncluded(asg, stu) { return !(this.isEnglishAsg(asg) && stu.noEnglish); },

            getAsgMetrics(asg) {
                if (!asg) return { total: 0, done: 0 };
                
                if (this._useCacheService) {
                    const cached = CacheService.get(CacheService.CacheNames?.METRICS || 'metrics', asg.id);
                    if (cached && cached.version === CacheService.getVersion()) return cached.metrics;
                    
                    let total = 0, done = 0;
                    for (const stu of this.roster) {
                        if (!this.isStuIncluded(asg, stu)) continue;
                        total++; if (asg.records?.[stu.id]?.done) done++;
                    }
                    const metrics = { total, done };
                    CacheService.set(CacheService.CacheNames?.METRICS || 'metrics', asg.id, { version: CacheService.getVersion(), metrics });
                    return metrics;
                } else {
                    const cached = this._metricsCache.get(asg.id);
                    if (cached && cached.version === this._cacheVersion) return cached.metrics;
                    let total = 0, done = 0;
                    for (const stu of this.roster) {
                        if (!this.isStuIncluded(asg, stu)) continue;
                        total++; if (asg.records?.[stu.id]?.done) done++;
                    }
                    const metrics = { total, done };
                    this._metricsCache.set(asg.id, { version: this._cacheVersion, metrics });
                    return metrics;
                }
            },

            getAsgTotalCount(asg) { return this.getAsgMetrics(asg).total; },
            getAsgDoneCount(asg) { return this.getAsgMetrics(asg).done; },

            parseNumericScore(value) {
                if (typeof value === 'number') return Number.isFinite(value) ? value : null;
                const text = String(value ?? '').trim();
                if (!text) return null;
                return /^-?\d+(?:\.\d+)?$/.test(text) ? Number(text) : null;
            },

            buildTrendTimelineKey(timeline) {
                return timeline.map(item => `${item.asgId}:${item.label}:${item.score ?? ''}:${item.included ? 1 : 0}`).join(';');
            },

            getQuizTrendAssignments() {
                const quizzes = this.data.filter(asg => /小测/.test(String(asg?.name || '')));
                return quizzes.length ? quizzes : this.data.slice();
            },

            getAsgRange(startId, endId, source = this.data) {
                if (!source.length) return [];
                const startIndex = source.findIndex(asg => asg.id === startId);
                const endIndex = source.findIndex(asg => asg.id === endId);
                if (startIndex === -1 && endIndex === -1) return source.slice();
                const safeStart = startIndex === -1 ? 0 : startIndex;
                const safeEnd = endIndex === -1 ? source.length - 1 : endIndex;
                const [from, to] = safeStart <= safeEnd ? [safeStart, safeEnd] : [safeEnd, safeStart];
                return source.slice(from, to + 1);
            },

            classifyScoreTrend(entries) {
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
            },

            getScoreRangeReport(startId, endId, source = this.data) {
                const assignments = this.getAsgRange(startId, endId, source);
                
                if (this._useCacheService) {
                    const cacheKey = `range:${CacheService.getVersion()}|${this._rosterVersion}|${this._asgListVersion}|${assignments.map(asg => asg.id).join(',')}`;
                    const cached = CacheService.get(CacheService.CacheNames?.METRICS || 'metrics', cacheKey);
                    if (cached && cached.version === CacheService.getVersion()) return cached.report;

                    let scoredStudentCount = 0;
                    const students = this.roster.map(stu => {
                        const studentStats = this._calculateStudentStats(stu, assignments);
                        if (studentStats.stats.entries.length) scoredStudentCount++;
                        return {
                            id: stu.id,
                            name: stu.name,
                            ...studentStats
                        };
                    });
                    const report = {
                        assignments: assignments.map(asg => ({ id: asg.id, name: asg.name, subject: this.getAsgSubject(asg) })),
                        students,
                        scoredStudentCount
                    };
                    CacheService.set(CacheService.CacheNames?.METRICS || 'metrics', cacheKey, { version: CacheService.getVersion(), report });
                    return report;
                } else {
                    const cacheKey = `range:${this._cacheVersion}|${this._rosterVersion}|${this._asgListVersion}|${assignments.map(asg => asg.id).join(',')}`;
                    const cached = this._metricsCache.get(cacheKey);
                    if (cached && cached.version === this._cacheVersion) return cached.report;

                    let scoredStudentCount = 0;
                    const students = this.roster.map(stu => {
                        const studentStats = this._calculateStudentStats(stu, assignments);
                        if (studentStats.stats.entries.length) scoredStudentCount++;
                        return {
                            id: stu.id,
                            name: stu.name,
                            ...studentStats
                        };
                    });
                    const report = {
                        assignments: assignments.map(asg => ({ id: asg.id, name: asg.name, subject: this.getAsgSubject(asg) })),
                        students,
                        scoredStudentCount
                    };
                    this._setMetricsCache(cacheKey, report);
                    return report;
                }
            },

            _calculateStudentStats(stu, assignments) {
                const timeline = [];
                const entries = [];
                let includedCount = 0;
                let totalScore = 0;
                let first = null;
                let latest = null;
                let best = null;
                let worst = null;

                assignments.forEach(asg => {
                    if (!this.isStuIncluded(asg, stu)) {
                        timeline.push({ asgId: asg.id, label: asg.name, score: null, rawScore: '', included: false });
                        return;
                    }
                    includedCount++;
                    const rawScore = asg.records?.[stu.id]?.score ?? '';
                    const score = this.parseNumericScore(rawScore);
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
                    trend: this.classifyScoreTrend(entries),
                    entries
                };
                const timelineKey = this.buildTrendTimelineKey(timeline);
                return {
                    entries,
                    timeline,
                    stats,
                    searchText: `${stu.id} ${stu.name}`,
                    timelineKey,
                    renderKey: `${stu.id}|${stu.name}|${stats.coverage}|${stats.avg ?? ''}|${stats.latest ?? ''}|${stats.best ?? ''}|${stats.delta ?? ''}|${stats.trend}|${timelineKey}`
                };
            },

            _setMetricsCache(key, report) {
                if (this._useCacheService) {
                    CacheService.set(CacheService.CacheNames?.METRICS || 'metrics', key, { version: CacheService.getVersion(), report });
                } else {
                    if (this._metricsCache.size >= (CACHE_CONFIG.MAX_METRICS_CACHE_SIZE || 50)) {
                        const firstKey = this._metricsCache.keys().next().value;
                        this._metricsCache.delete(firstKey);
                    }
                    this._metricsCache.set(key, { version: this._cacheVersion, report });
                }
            },

            updRec(id, val, meta = {}) {
                const asg = this.cur; if (!asg) return;
                const prevRecord = asg.records[id] ? { ...asg.records[id] } : null;
                const prevDone = !!prevRecord?.done;
                const r = asg.records;
                r[id] = { ...r[id], ...val };
                if (!r[id].done && (r[id].score == null || r[id].score === '')) delete r[id];
                const nextRecord = r[id] ? { ...r[id] } : null;
                this.invalidateDerived();
                this.markGridDirty({ ids: [id] });
                this.queueRecoveryDraft();
                this._queuePersist();
                this.view.renderStudent(id);
                if (prevDone !== !!asg.records[id]?.done) this.view.renderProgress(this.getAsgDoneCount(asg), this.getAsgTotalCount(asg));
            }
        };

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
                if (window.visualViewport) window.visualViewport.addEventListener('resize', refresh, { passive: true });
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
