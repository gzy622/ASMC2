/**
 * 渲染器模块
 * 负责 UI 渲染和更新
 */

import { GRID, VIRTUAL_SCROLL } from '../core/constants.js';
import { appEvents, Events } from '../core/events.js';

/**
 * 网格渲染器
 */
export class GridRenderer {
    constructor(container, options = {}) {
        this.container = container;
        this.options = {
            virtualThreshold: VIRTUAL_SCROLL.THRESHOLD,
            batchSize: VIRTUAL_SCROLL.BATCH_SIZE,
            ...options
        };
        
        this._token = 0;
        this._isRendering = false;
        this._lastMetricsKey = '';
        this._paddingX = 0;
        this._paddingY = 0;
        
        this._init();
    }

    _init() {
        this._refreshPadding();
        this._setupResizeObserver();
    }

    _refreshPadding() {
        const style = getComputedStyle(this.container);
        this._paddingX = parseFloat(style.paddingLeft) + parseFloat(style.paddingRight);
        this._paddingY = parseFloat(style.paddingTop) + parseFloat(style.paddingBottom);
    }

    _setupResizeObserver() {
        this._resizeObserver = new ResizeObserver(() => {
            this._refreshPadding();
            this._scheduleLayout();
        });
        this._resizeObserver.observe(this.container);
    }

    /**
     * 计算网格布局
     * @param {number} count
     * @param {number} width
     * @param {number} height
     * @returns {Object}
     */
    calculateLayout(count, width, height) {
        const cols = GRID.COLS;
        const rows = Math.ceil(Math.max(1, count) / cols);
        const baseGap = Math.max(GRID.BASE_GAP, Math.min(GRID.MAX_GAP, Math.round(Math.min(width, height) / 95)));
        
        const calc = (g) => ({
            w: (width - g * (cols - 1)) / cols,
            h: (height - g * (rows - 1)) / rows
        });
        
        let gap = baseGap;
        let size = calc(gap);
        let base = Math.min(size.w, size.h);
        
        if (base < 24) {
            gap = 2;
            size = calc(gap);
            base = Math.min(size.w, size.h);
        }
        
        base = Math.max(GRID.MIN_CELL_SIZE, base);
        
        return {
            cols,
            rows,
            gap,
            w: Math.max(GRID.MIN_CELL_SIZE, size.w),
            h: Math.max(GRID.MIN_CELL_SIZE, size.h),
            idSize: Math.max(12, Math.min(44, base * 0.34)),
            idCornerSize: Math.max(9, Math.min(16, base * 0.2)),
            nameSize: Math.max(9, Math.min(20, base * 0.18)),
            tagSize: Math.max(8, Math.min(13, base * 0.12)),
            pad: Math.max(3, Math.min(8, base * 0.08)),
            radius: Math.max(8, Math.min(16, base * 0.15))
        };
    }

    /**
     * 更新网格样式
     */
    _scheduleLayout() {
        cancelAnimationFrame(this._layoutRaf || 0);
        this._layoutRaf = requestAnimationFrame(() => this._updateLayout());
    }

    _updateLayout() {
        const count = this.container.children.length;
        const w = this.container.clientWidth - this._paddingX;
        const h = this.container.clientHeight - this._paddingY;
        
        if (!w || !h) return;
        
        const m = this.calculateLayout(count, w, h);
        const key = `${count}|${m.cols}|${m.rows}|${m.gap}|${m.w.toFixed(2)}|${m.h.toFixed(2)}`;
        
        if (key === this._lastMetricsKey) return;
        this._lastMetricsKey = key;
        
        const style = this.container.style;
        style.setProperty('--grid-cols', m.cols);
        style.setProperty('--grid-rows', m.rows);
        style.setProperty('--grid-gap', `${m.gap}px`);
        style.setProperty('--cell-w', `${m.w}px`);
        style.setProperty('--cell-h', `${m.h}px`);
        style.setProperty('--id-size', `${m.idSize}px`);
        style.setProperty('--id-corner-size', `${m.idCornerSize}px`);
        style.setProperty('--name-size', `${m.nameSize}px`);
        style.setProperty('--tag-size', `${m.tagSize}px`);
        style.setProperty('--card-pad', `${m.pad}px`);
        style.setProperty('--card-radius', `${m.radius}px`);
    }

    /**
     * 创建卡片元素
     * @returns {HTMLElement}
     */
    createCard() {
        const card = document.createElement('button');
        card.type = 'button';
        card.className = 'student-card';
        card.innerHTML = `
            <span class="card-id"></span>
            <span class="card-name"></span>
            <span class="card-score" hidden></span>
        `;
        return card;
    }

    /**
     * 渲染卡片内容
     * @param {HTMLElement} card
     * @param {Object} student
     * @param {Object} record
     * @param {boolean} excluded
     */
    renderCard(card, student, record = {}, excluded = false) {
        card.dataset.id = student.id;
        card.dataset.name = student.name;
        card.dataset.excluded = excluded ? '1' : '0';
        
        const [idEl, nameEl, scoreEl] = card.children;
        
        if (idEl.textContent !== student.id) {
            idEl.textContent = student.id;
        }
        if (nameEl.textContent !== student.name) {
            nameEl.textContent = student.name;
        }
        
        card.classList.toggle('done', !excluded && !!record.done);
        card.classList.toggle('excluded', excluded);
        
        if (!excluded && record.score != null && record.score !== '') {
            scoreEl.hidden = false;
            scoreEl.textContent = String(record.score);
        } else {
            scoreEl.hidden = true;
            scoreEl.textContent = '';
        }
    }

    /**
     * 同步卡片池
     * @param {number} targetCount
     */
    syncCardPool(targetCount) {
        while (this.container.children.length < targetCount) {
            this.container.appendChild(this.createCard());
        }
        while (this.container.children.length > targetCount) {
            this.container.lastElementChild.remove();
        }
    }

    /**
     * 分块同步卡片池
     * @param {number} targetCount
     * @param {Function} onComplete
     */
    syncCardPoolChunked(targetCount, onComplete) {
        const current = this.container.children.length;
        const token = ++this._token;
        
        if (current === targetCount) {
            onComplete?.();
            return;
        }
        
        this._isRendering = true;
        const batchSize = this.options.batchSize;
        let index = current;
        
        const processBatch = () => {
            if (token !== this._token) {
                this._isRendering = false;
                return;
            }
            
            const frag = document.createDocumentFragment();
            const end = Math.min(index + batchSize, targetCount);
            
            if (current < targetCount) {
                for (; index < end; index++) {
                    frag.appendChild(this.createCard());
                }
                this.container.appendChild(frag);
            } else {
                for (; index < end; index++) {
                    this.container.lastElementChild?.remove();
                }
            }
            
            if (index < targetCount) {
                requestAnimationFrame(processBatch);
            } else {
                this._isRendering = false;
                onComplete?.();
            }
        };
        
        requestAnimationFrame(processBatch);
    }

    /**
     * 销毁
     */
    destroy() {
        this._resizeObserver?.disconnect();
        cancelAnimationFrame(this._layoutRaf || 0);
    }
}

/**
 * 下拉选择器渲染器
 */
export class SelectRenderer {
    constructor(triggerEl, dropdownEl, textEl) {
        this.trigger = triggerEl;
        this.dropdown = dropdownEl;
        this.textEl = textEl;
        this._version = -1;
    }

    /**
     * 更新选项
     * @param {Array} assignments
     * @param {number} currentId
     * @param {number} version
     */
    updateOptions(assignments, currentId, version) {
        if (this._version === version) return;
        this._version = version;
        
        this.dropdown.innerHTML = assignments.map(a => `
            <div class="custom-select-option" data-value="${a.id}">
                <span>${a.name}</span>
            </div>
        `).join('');
        
        this.updateSelection(currentId);
    }

    /**
     * 更新选中状态
     * @param {number} currentId
     */
    updateSelection(currentId) {
        const current = this.dropdown.querySelector(`[data-value="${currentId}"]`);
        if (current) {
            this.textEl.textContent = current.querySelector('span')?.textContent || '';
        }
        
        this.dropdown.querySelectorAll('.custom-select-option').forEach(opt => {
            opt.classList.toggle('active', opt.dataset.value === String(currentId));
        });
    }

    /**
     * 打开
     */
    open() {
        this.trigger.classList.add('open');
        this.dropdown.classList.remove('closing');
        this.dropdown.classList.add('show');
    }

    /**
     * 关闭
     * @param {boolean} immediate
     */
    close(immediate = false) {
        if (immediate) {
            this.trigger.classList.remove('open');
            this.dropdown.classList.remove('show', 'closing');
            return;
        }
        
        if (!this.dropdown.classList.contains('show')) {
            this.trigger.classList.remove('open');
            return;
        }
        
        this.dropdown.classList.remove('show');
        this.dropdown.classList.add('closing');
        
        setTimeout(() => {
            this.trigger.classList.remove('open');
            this.dropdown?.classList.remove('closing');
        }, 160);
    }

    /**
     * 切换
     */
    toggle() {
        if (this.trigger.classList.contains('open')) {
            this.close();
        } else {
            this.open();
        }
    }
}

/**
 * 计数器渲染器
 */
export class CounterRenderer {
    constructor(element) {
        this.element = element;
    }

    /**
     * 更新计数
     * @param {number} done
     * @param {number} total
     */
    update(done, total) {
        if (this.element) {
            this.element.textContent = `${done}/${total}`;
        }
    }
}

export default {
    GridRenderer,
    SelectRenderer,
    CounterRenderer
};
