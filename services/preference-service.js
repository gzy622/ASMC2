/**
 * 偏好设置服务模块
 * 管理用户偏好、卡片颜色、动画设置等
 */

const PreferenceService = (function() {
    'use strict';

    class PreferenceManager {
        constructor() {
            // 动画设置
            this._animations = true;
            // 用户偏好设置
            this._prefs = {
                cardDoneColor: APP_CONFIG?.DEFAULT_CARD_COLOR || '#68c490'
            };
            // 加载过的标记
            this._loaded = false;
        }

        /**
         * 规范化偏好设置
         * @param {Object} raw - 原始偏好设置
         * @returns {Object}
         */
        normalize(raw) {
            const prefs = raw && typeof raw === 'object' ? raw : {};
            return {
                cardDoneColor: ColorUtil?.normalizeHex?.(prefs.cardDoneColor, '#68c490') || '#68c490'
            };
        }

        /**
         * 初始化偏好设置
         */
        init() {
            if (this._loaded) return;

            // 从localStorage加载动画设置
            this._animations = LS?.get?.(KEYS?.ANIM, true) ?? true;

            // 从localStorage加载偏好设置
            const rawPrefs = LS?.get?.(KEYS?.PREFS, {});
            this._prefs = this.normalize(rawPrefs);

            this._loaded = true;
        }

        /**
         * 获取动画设置
         * @returns {boolean}
         */
        getAnimations() {
            return this._animations;
        }

        /**
         * 设置动画
         * @param {boolean} value
         */
        setAnimations(value) {
            this._animations = !!value;
            LS?.set?.(KEYS?.ANIM, this._animations);
        }

        /**
         * 切换动画
         * @returns {boolean} 新状态
         */
        toggleAnimations() {
            this.setAnimations(!this._animations);
            return this._animations;
        }

        /**
         * 获取偏好设置
         * @returns {Object}
         */
        getPrefs() {
            return { ...this._prefs };
        }

        /**
         * 设置偏好设置
         * @param {Object} prefs
         */
        setPrefs(prefs) {
            this._prefs = this.normalize(prefs);
            LS?.set?.(KEYS?.PREFS, this._prefs);
        }

        /**
         * 获取卡片完成颜色
         * @returns {string}
         */
        getCardDoneColor() {
            return this._prefs.cardDoneColor;
        }

        /**
         * 设置卡片完成颜色
         * @param {string} color
         */
        setCardDoneColor(color) {
            this._prefs.cardDoneColor = ColorUtil?.normalizeHex?.(color, '#68c490') || '#68c490';
            LS?.set?.(KEYS?.PREFS, this._prefs);
        }

        /**
         * 应用动画设置到页面
         */
        applyAnimations() {
            const html = document.documentElement;
            if (html) {
                html.classList.toggle('no-anim', !this._animations);
            }
        }

        /**
         * 应用卡片颜色到页面
         */
        applyCardColor() {
            const html = document.documentElement;
            if (html) {
                html.style.setProperty('--card-done-color', this._prefs.cardDoneColor);
            }
        }

        /**
         * 应用所有设置
         */
        applyAll() {
            this.applyAnimations();
            this.applyCardColor();
        }
    }

    // 单例实例
    const instance = new PreferenceManager();

    return {
        instance,
        // 便捷方法
        init: () => instance.init(),
        getAnimations: () => instance.getAnimations(),
        setAnimations: (value) => instance.setAnimations(value),
        toggleAnimations: () => instance.toggleAnimations(),
        getPrefs: () => instance.getPrefs(),
        setPrefs: (prefs) => instance.setPrefs(prefs),
        getCardDoneColor: () => instance.getCardDoneColor(),
        setCardDoneColor: (color) => instance.setCardDoneColor(color),
        applyAnimations: () => instance.applyAnimations(),
        applyCardColor: () => instance.applyCardColor(),
        applyAll: () => instance.applyAll(),
        normalize: (raw) => instance.normalize(raw)
    };
})();

// 导出到全局
if (typeof window !== 'undefined') {
    window.PreferenceService = PreferenceService;
}
