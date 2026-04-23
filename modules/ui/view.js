/**
 * 主视图模块
 * 整合渲染器和交互处理器，提供统一的视图接口
 */

import { Events } from '../core/constants.js';
import { appEvents } from '../core/events.js';
import { state } from '../data/state.js';
import { GridRenderer, SelectRenderer, CounterRenderer } from './renderer.js';
import { GridInteraction, MenuInteraction, GlobalClickHandler } from './interactions.js';

/**
 * 主视图类
 */
export class AppView {
    constructor() {
        this._initialized = false;
        this._elements = {};
        this._renderers = {};
        this._interactions = {};
    }

    /**
     * 初始化视图
     */
    init() {
        if (this._initialized) return;
        
        this._cacheElements();
        this._initRenderers();
        this._initInteractions();
        this._bindEvents();
        this._applyPreferences();
        
        this._initialized = true;
        
        // 延迟标记就绪
        setTimeout(() => {
            appEvents.emit(Events.VIEW_READY, { view: this });
        }, 200);
    }

    /**
     * 缓存 DOM 元素
     * @private
     */
    _cacheElements() {
        const $ = id => document.getElementById(id);
        
        this._elements = {
            grid: $('grid'),
            counter: $('counter'),
            customSelect: $('customSelect'),
            customSelectDropdown: $('customSelectDropdown'),
            customSelectText: $('customSelect')?.querySelector('.custom-select-text'),
            menu: $('menu'),
            btnScore: $('btnScore'),
            btnMenu: $('btnMenu'),
            statusView: $('statusView'),
            statusAnim: $('statusAnim'),
            btnView: $('btnView'),
            btnAnim: $('btnAnim')
        };
    }

    /**
     * 初始化渲染器
     * @private
     */
    _initRenderers() {
        this._renderers.grid = new GridRenderer(this._elements.grid);
        this._renderers.select = new SelectRenderer(
            this._elements.customSelect,
            this._elements.customSelectDropdown,
            this._elements.customSelectText
        );
        this._renderers.counter = new CounterRenderer(this._elements.counter);
    }

    /**
     * 初始化交互处理器
     * @private
     */
    _initInteractions() {
        // 网格交互
        this._interactions.grid = new GridInteraction(this._elements.grid, {
            onToggle: (id, name) => this._onStudentToggle(id, name),
            onScore: (id, name) => this._onStudentScore(id, name),
            isScoringMode: () => state.preferences.scoring
        });
        
        // 菜单交互
        this._interactions.menu = new MenuInteraction(this._elements.menu, {
            onAction: (act) => this._onMenuAction(act),
            closeDelay: 160
        });
        
        // 下拉选择器交互
        this._elements.customSelect.onclick = (e) => {
            e.stopPropagation();
            this._renderers.select.toggle();
        };
        
        this._elements.customSelectDropdown.onclick = (e) => {
            e.stopPropagation();
            const option = e.target.closest('.custom-select-option');
            if (option) {
                const value = option.dataset.value;
                state.selectAssignment(value);
                this._renderers.select.close();
            }
        };
        
        // 全局点击
        this._interactions.global = new GlobalClickHandler({
            selectors: ['#btnMenu', '#menu', '.custom-select-wrapper'],
            onOutsideClick: () => {
                this._renderers.select.close();
                this._interactions.menu.close();
            }
        });
        
        // 按钮事件
        this._elements.btnScore.onclick = () => this._toggleScoring();
        this._elements.btnMenu.onclick = (e) => {
            e.stopPropagation();
            this._interactions.menu.toggle();
        };
    }

    /**
     * 绑定状态事件
     * @private
     */
    _bindEvents() {
        // 状态初始化完成
        appEvents.on(Events.STATE_INITIALIZED, () => {
            this.render();
        });
        
        // 任务选择
        appEvents.on(Events.ASG_SELECTED, () => {
            this.render();
        });
        
        // 记录更新
        appEvents.on(Events.RECORD_UPDATED, ({ studentId }) => {
            this.renderStudent(studentId);
            this._updateCounter();
        });
        
        // 任务列表变化
        appEvents.on(Events.ASG_CREATED, () => this.render());
        appEvents.on(Events.ASG_DELETED, () => this.render());
        appEvents.on(Events.ASG_UPDATED, () => this._updateSelect());
    }

    /**
     * 应用偏好设置
     * @private
     */
    _applyPreferences() {
        const prefs = state.preferences;
        
        // 动画
        document.body.classList.toggle('no-animations', !prefs.animations);
        if (this._elements.statusAnim) {
            this._elements.statusAnim.textContent = prefs.animations ? '开' : '关';
        }
        
        // 显示姓名
        document.body.classList.toggle('mode-names', prefs.showNames);
        if (this._elements.statusView) {
            this._elements.statusView.textContent = prefs.showNames ? '开' : '关';
        }
    }

    // ============ 事件处理 ============

    _onStudentToggle(id, name) {
        state.toggleDone(id);
    }

    _onStudentScore(id, name) {
        // 触发打分事件，由外部处理
        appEvents.emit('ui:score:request', { studentId: id, studentName: name });
    }

    _onMenuAction(act) {
        appEvents.emit('ui:menu:action', { action: act });
    }

    _toggleScoring() {
        state.preferences.scoring = !state.preferences.scoring;
        this._elements.btnScore.classList.toggle('active', state.preferences.scoring);
    }

    // ============ 渲染方法 ============

    /**
     * 完整渲染
     */
    render() {
        if (!state.initialized) return;
        
        const asg = state.currentAssignment;
        if (!asg) return;
        
        const students = state.students;
        const useVirtual = students.length > 50;
        
        // 更新下拉选项
        this._updateSelect();
        
        // 渲染网格
        if (useVirtual) {
            this._renderers.grid.syncCardPoolChunked(students.length, () => {
                this._renderCards(asg, students);
            });
        } else {
            this._renderers.grid.syncCardPool(students.length);
            this._renderCards(asg, students);
        }
        
        // 更新计数器
        this._updateCounter();
        
        appEvents.emit(Events.VIEW_RENDERED, { view: this });
    }

    /**
     * 渲染卡片
     * @private
     */
    _renderCards(asg, students) {
        const cards = this._elements.grid.children;
        
        students.forEach((student, i) => {
            const record = asg.getRecord(student.id);
            const excluded = !asg.includesStudent(student);
            this._renderers.grid.renderCard(cards[i], student, record, excluded);
        });
        
        this._renderers.grid._scheduleLayout();
    }

    /**
     * 渲染单个学生
     * @param {string} studentId
     */
    renderStudent(studentId) {
        const asg = state.currentAssignment;
        if (!asg) return;
        
        const students = state.students;
        const index = students.findIndex(s => s.id === studentId);
        if (index === -1) return;
        
        const cards = this._elements.grid.children;
        const student = students[index];
        const record = asg.getRecord(student.id);
        const excluded = !asg.includesStudent(student);
        
        this._renderers.grid.renderCard(cards[index], student, record, excluded);
    }

    /**
     * 更新下拉选择器
     * @private
     */
    _updateSelect() {
        this._renderers.select.updateOptions(
            state.assignments,
            state.currentId,
            state.assignmentCount // 使用计数作为版本
        );
    }

    /**
     * 更新计数器
     * @private
     */
    _updateCounter() {
        const asg = state.currentAssignment;
        if (!asg) return;
        
        const metrics = state.getMetrics(asg);
        this._renderers.counter.update(metrics.done, metrics.total);
    }

    // ============ 公共方法 ============

    /**
     * 更新偏好设置 UI
     */
    updatePreferences() {
        this._applyPreferences();
    }

    /**
     * 销毁视图
     */
    destroy() {
        Object.values(this._interactions).forEach(i => i.destroy?.());
        Object.values(this._renderers).forEach(r => r.destroy?.());
        this._interactions = {};
        this._renderers = {};
    }
}

// 单例实例
export const view = new AppView();

export default AppView;
