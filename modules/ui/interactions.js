/**
 * 交互模块
 * 处理用户输入和交互逻辑
 */

import { INTERACTION_THRESHOLD, Events } from '../core/constants.js';
import { appEvents } from '../core/events.js';

/**
 * 网格交互处理器
 */
export class GridInteraction {
    constructor(container, options = {}) {
        this.container = container;
        this.options = {
            onToggle: () => {},
            onScore: () => {},
            isScoringMode: () => false,
            ...options
        };
        
        this._timer = null;
        this._pressCard = null;
        this._longPressed = false;
        this._moved = false;
        this._suppressClickUntil = 0;
        this._startPos = { x: 0, y: 0 };
        
        this._bindEvents();
    }

    _bindEvents() {
        this.container.onpointerdown = (e) => this._onPointerDown(e);
        this.container.onpointerup = (e) => this._onPointerUp(e);
        this.container.onpointermove = (e) => this._onPointerMove(e);
        this.container.onpointercancel = () => this._resetState();
        this.container.onpointerleave = () => this._resetState();
        this.container.onclick = (e) => this._onClick(e);
    }

    _onPointerDown(e) {
        const card = e.target.closest('.student-card');
        if (!card) return;
        
        this._pressCard = card;
        this._longPressed = false;
        this._moved = false;
        this._startPos = { x: e.clientX, y: e.clientY };
        
        card.classList.add('pressing');
        this._cancelTimer();
        
        this._timer = setTimeout(() => {
            this._timer = null;
            this._longPressed = true;
            this._suppressClickUntil = Date.now() + INTERACTION_THRESHOLD.CLICK_SUPPRESS;
            card.classList.remove('pressing');
            this._handle(card, true);
            this._resetState();
        }, INTERACTION_THRESHOLD.LONG_PRESS);
    }

    _onPointerUp(e) {
        const card = e.target.closest('.student-card');
        if (card && this._pressCard === card) {
            card.classList.remove('pressing');
        }
        this._resetState();
    }

    _onPointerMove(e) {
        if (!this._pressCard) return;
        
        const dx = Math.abs(e.clientX - this._startPos.x);
        const dy = Math.abs(e.clientY - this._startPos.y);
        
        if (dx > INTERACTION_THRESHOLD.MOVE_THRESHOLD_X || 
            dy > INTERACTION_THRESHOLD.MOVE_THRESHOLD_Y) {
            this._moved = true;
            this._pressCard.classList.remove('pressing');
            this._cancelTimer();
        }
    }

    _onClick(e) {
        if (this._shouldSuppressClick()) return;
        
        const card = e.target.closest('.student-card');
        if (!card) return;
        
        this._handle(card, false);
    }

    _handle(card, isLongPress) {
        if (card.dataset.excluded === '1') return;
        
        const { id, name } = card.dataset;
        
        if (isLongPress || this.options.isScoringMode()) {
            this.options.onScore(id, name);
        } else {
            this.options.onToggle(id, name);
        }
    }

    _shouldSuppressClick() {
        if (Date.now() < this._suppressClickUntil) return true;
        this._suppressClickUntil = 0;
        return false;
    }

    _cancelTimer() {
        if (this._timer) {
            clearTimeout(this._timer);
            this._timer = null;
        }
    }

    _resetState() {
        if (this._pressCard) {
            this._pressCard.classList.remove('pressing');
        }
        this._cancelTimer();
        this._pressCard = null;
        this._longPressed = false;
        this._moved = false;
    }

    /**
     * 销毁
     */
    destroy() {
        this._cancelTimer();
        this.container.onpointerdown = null;
        this.container.onpointerup = null;
        this.container.onpointermove = null;
        this.container.onpointercancel = null;
        this.container.onpointerleave = null;
        this.container.onclick = null;
    }
}

/**
 * 菜单交互处理器
 */
export class MenuInteraction {
    constructor(menuEl, options = {}) {
        this.menu = menuEl;
        this.options = {
            onAction: () => {},
            closeDelay: 160,
            ...options
        };
        
        this._timer = null;
        this._isOpen = false;
        
        this._bindEvents();
    }

    _bindEvents() {
        this.menu.onclick = (e) => {
            e.stopPropagation();
            const act = e.target.closest('[act]')?.getAttribute('act');
            if (act) {
                this.close();
                this.options.onAction(act);
            }
        };
    }

    /**
     * 打开菜单
     */
    open() {
        clearTimeout(this._timer);
        this._timer = 0;
        this.menu.classList.remove('closing');
        this.menu.classList.add('show');
        this._isOpen = true;
    }

    /**
     * 关闭菜单
     * @param {boolean} immediate
     */
    close(immediate = false) {
        clearTimeout(this._timer);
        this._timer = 0;
        
        if (immediate) {
            this.menu.classList.remove('show', 'closing');
            this._isOpen = false;
            return;
        }
        
        if (!this.menu.classList.contains('show')) {
            this.menu.classList.remove('closing');
            this._isOpen = false;
            return;
        }
        
        this.menu.classList.remove('show');
        this.menu.classList.add('closing');
        
        this._timer = setTimeout(() => {
            this._timer = 0;
            this.menu?.classList.remove('closing');
            this._isOpen = false;
        }, this.options.closeDelay);
    }

    /**
     * 切换菜单
     */
    toggle() {
        if (this._isOpen) {
            this.close();
        } else {
            this.open();
        }
    }

    /**
     * 销毁
     */
    destroy() {
        clearTimeout(this._timer);
        this.menu.onclick = null;
    }
}

/**
 * 全局点击处理器
 */
export class GlobalClickHandler {
    constructor(options = {}) {
        this.options = {
            selectors: [],
            onOutsideClick: () => {},
            ...options
        };
        
        this._handler = (e) => this._onClick(e);
        document.addEventListener('click', this._handler);
    }

    _onClick(e) {
        const isInside = this.options.selectors.some(selector => 
            e.target.closest(selector)
        );
        
        if (!isInside) {
            this.options.onOutsideClick(e);
        }
    }

    /**
     * 销毁
     */
    destroy() {
        document.removeEventListener('click', this._handler);
    }
}

/**
 * 键盘处理器
 */
export class KeyboardHandler {
    constructor(options = {}) {
        this.options = {
            onEscape: () => {},
            onEnter: () => {},
            ...options
        };
        
        this._handler = (e) => this._onKeyDown(e);
        document.addEventListener('keydown', this._handler);
    }

    _onKeyDown(e) {
        switch (e.key) {
            case 'Escape':
                this.options.onEscape(e);
                break;
            case 'Enter':
                if (!e.repeat) {
                    this.options.onEnter(e);
                }
                break;
        }
    }

    /**
     * 销毁
     */
    destroy() {
        document.removeEventListener('keydown', this._handler);
    }
}

export default {
    GridInteraction,
    MenuInteraction,
    GlobalClickHandler,
    KeyboardHandler
};
