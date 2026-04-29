/**
 * 工具函数库
 * 统一的工具函数集合，从各模块提取整合
 *
 * 包含模块：
 * - DOM 操作
 * - 格式化
 * - 验证
 * - 存储
 * - 动画
 */

import { APP_CONFIG } from './constants.js'

// ============================================
// DOM 操作工具
// ============================================

/**
 * 通过 ID 获取元素
 * @param {string} id - 元素 ID
 * @returns {HTMLElement|null}
 */
const $ = id => document.getElementById(id)

/**
 * 通过选择器获取单个元素
 * @param {string} selector - CSS 选择器
 * @param {HTMLElement|Document} [parent=document] - 父元素
 * @returns {HTMLElement|null}
 */
const qs = (selector, parent = document) => parent.querySelector(selector)

/**
 * 通过选择器获取所有匹配元素
 * @param {string} selector - CSS 选择器
 * @param {HTMLElement|Document} [parent=document] - 父元素
 * @returns {NodeListOf<HTMLElement>}
 */
const qsa = (selector, parent = document) => parent.querySelectorAll(selector)

/**
 * 创建 DOM 元素
 * @param {string} tag - 标签名
 * @param {Object} [attrs={}] - 属性对象
 * @param {string} [text=''] - 文本内容
 * @returns {HTMLElement}
 */
const createEl = (tag, attrs = {}, text = '') => {
  const el = document.createElement(tag)
  Object.entries(attrs).forEach(([key, value]) => {
    if (key === 'className') {
      el.className = value
    } else if (key === 'dataset') {
      Object.assign(el.dataset, value)
    } else if (key.startsWith('on') && typeof value === 'function') {
      el.addEventListener(key.slice(2).toLowerCase(), value)
    } else {
      el.setAttribute(key, value)
    }
  })
  if (text) el.textContent = text
  return el
}

// ============================================
// 格式化工具
// ============================================

/**
 * 应用名称标识
 */
const APP_NAME_SLUG = 'assignmentcheck2'

/**
 * 默认颜色预设
 */
const CARD_COLOR_PRESETS = ['#68c490', '#8ecae6', '#f4a261', '#e9c46a', '#c084fc', '#f28482']

/**
 * 科目预设列表
 */
const SUBJECT_PRESETS = ['英语', '语文', '数学', '物理', '化学', '其他']

/**
 * 数值限制在范围内
 * @param {number} v - 值
 * @param {number} [min=0] - 最小值
 * @param {number} [max=255] - 最大值
 * @returns {number}
 */
const clamp = (v, min = 0, max = 255) => Math.max(min, Math.min(max, Math.round(v)))

/**
 * 生成备份文件名
 * @param {Date} [date=new Date()] - 日期对象
 * @returns {string}
 */
const formatBackupFileName = (date = new Date()) => {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  const hh = String(date.getHours()).padStart(2, '0')
  const mm = String(date.getMinutes()).padStart(2, '0')
  const ss = String(date.getSeconds()).padStart(2, '0')
  return `${APP_NAME_SLUG}_backup_${y}${m}${d}_${hh}${mm}${ss}.json`
}

/**
 * 颜色工具类
 */
const ColorUtil = {
  clamp(v, min = 0, max = 255) {
    return Math.max(min, Math.min(max, Math.round(v)))
  },

  normalizeHex(hex, fallback = '#68c490') {
    return this.rgbToHex(this.hexToRgb(hex, fallback))
  },

  hexToRgb(hex, fallback = '#68c490') {
    const raw = String(hex || '').trim().replace(/^#/, '').toLowerCase()
    let r, g, b
    if (raw.length === 3) {
      [r, g, b] = [0, 1, 2].map(i => parseInt(raw[i] + raw[i], 16))
    } else if (raw.length === 6) {
      [r, g, b] = [0, 2, 4].map(i => parseInt(raw.slice(i, i + 2), 16))
    } else {
      const fb = this.hexToRgb(fallback, '#68c490')
      return fb
    }
    return isNaN(r) || isNaN(g) || isNaN(b) ? this.hexToRgb(fallback, '#68c490') : { r, g, b }
  },

  rgbToHex({ r, g, b }) {
    return `#${[r, g, b].map(v => this.clamp(v).toString(16).padStart(2, '0')).join('')}`
  },

  mix(hexA, hexB, ratio) {
    const a = this.hexToRgb(hexA), b = this.hexToRgb(hexB)
    const t = Math.max(0, Math.min(1, Number(ratio) || 0))
    return this.rgbToHex({
      r: a.r + (b.r - a.r) * t,
      g: a.g + (b.g - a.g) * t,
      b: a.b + (b.b - a.b) * t
    })
  },

  withAlpha(hex, alpha) {
    const { r, g, b } = this.hexToRgb(hex)
    return `rgba(${r}, ${g}, ${b}, ${Math.max(0, Math.min(1, Number(alpha) || 0))})`
  },

  luminance(hex) {
    const { r, g, b } = this.hexToRgb(hex)
    const toLinear = c => {
      const v = c / 255
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)
    }
    return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b)
  }
}

/**
 * ID 生成器工具类
 */
const IdGenerator = {
  _lastId: 0,

  generate() {
    const now = Date.now()
    this._lastId = Math.max(now, this._lastId + 1)
    return this._lastId
  },

  generateUnique(existsCheck) {
    let id = this.generate()
    while (existsCheck(id)) {
      id = this.generate()
    }
    return id
  },

  reset() {
    this._lastId = 0
  },

  peek() {
    return Math.max(Date.now(), this._lastId + 1)
  }
}

// ============================================
// 验证工具
// ============================================

/**
 * 验证是否为有效的对象
 * @param {*} value - 要验证的值
 * @returns {boolean}
 */
const isValidObject = (value) => value !== null && typeof value === 'object'

/**
 * 验证是否为有效的数组
 * @param {*} value - 要验证的值
 * @returns {boolean}
 */
const isValidArray = (value) => Array.isArray(value)

/**
 * 验证是否为非空字符串
 * @param {*} value - 要验证的值
 * @returns {boolean}
 */
const isNonEmptyString = (value) => typeof value === 'string' && value.trim().length > 0

/**
 * 验证是否为有效的数字
 * @param {*} value - 要验证的值
 * @returns {boolean}
 */
const isValidNumber = (value) => typeof value === 'number' && Number.isFinite(value)

/**
 * 验证存储数据的基本结构
 * @param {*} data - 要验证的数据
 * @param {string[]} [requiredArrays=[]] - 必需的数组字段名
 * @returns {boolean}
 */
const validateStorageData = (data, requiredArrays = []) => {
  if (!isValidObject(data)) return false
  for (const key of requiredArrays) {
    if (!isValidArray(data[key])) return false
  }
  return true
}

/**
 * 验证导入/恢复数据格式
 * @param {*} data - 要验证的数据
 * @returns {boolean}
 */
const isValidImportData = (data) => validateStorageData(data, ['list', 'data'])

/**
 * 验证恢复草稿数据格式
 * @param {*} draft - 要验证的草稿数据
 * @returns {boolean}
 */
const isValidRecoveryDraft = (draft) => validateStorageData(draft, ['list', 'data'])

/**
 * 验证学生ID格式（两位数字）
 * @param {*} id - 要验证的ID
 * @returns {boolean}
 */
const isValidStudentId = (id) => isNonEmptyString(id) && /^\d{2}$/.test(id)

/**
 * 验证任务对象的基本结构
 * @param {*} asg - 要验证的任务对象
 * @returns {boolean}
 */
const isValidAssignment = (asg) => isValidObject(asg) && isValidNumber(asg.id) && isNonEmptyString(asg.name)

/**
 * 验证器对象
 */
const Validator = {
  isValidObject,
  isValidArray,
  isNonEmptyString,
  isValidNumber,
  validateStorageData,
  isValidImportData,
  isValidRecoveryDraft,
  isValidStudentId,
  isValidAssignment
}

// ============================================
// 存储工具
// ============================================

/**
 * 存储键名常量
 */
const KEYS = {
  DATA: 'tracker_db',
  LIST: 'tracker_roster',
  ANIM: 'tracker_anim',
  PREFS: 'tracker_prefs',
  DRAFT: 'tracker_recovery_draft',
  SCOREPAD_FAST_TEN: 'tracker_scorepad_fast_ten'
}

/**
 * localStorage 封装对象
 */
const LS = {
  _log(action, key, err) {
    const msg = `[LS.${action}] key=${key}${err ? ` error=${err.message}` : ''}`
    if (err || action === 'get') console.warn(msg)
  },

  get(k, d) {
    const raw = localStorage.getItem(k)
    if (raw == null) return d
    try {
      return JSON.parse(raw)
    } catch (err) {
      this._log('get', k, err)
      return d
    }
  },

  set(k, v) {
    try {
      const nextRaw = JSON.stringify(v)
      if (localStorage.getItem(k) === nextRaw) return
      localStorage.setItem(k, nextRaw)
    } catch (err) {
      this._log('set', k, err)
    }
  },

  remove(k) {
    try {
      localStorage.removeItem(k)
    } catch (err) {
      this._log('remove', k, err)
    }
  }
}

// ============================================
// 动画工具
// ============================================

/**
 * 设备检测工具
 */
const Device = {
  isAndroid() {
    return /Android/i.test(navigator.userAgent)
  },
  isFirefox() {
    return /Firefox/i.test(navigator.userAgent)
  },
  isCoarsePointer() {
    if (typeof window.matchMedia === 'function') {
      return window.matchMedia('(pointer: coarse)').matches
    }
    return 'ontouchstart' in window || Number(navigator.maxTouchPoints) > 0
  }
}

/**
 * 是否为 Android Firefox 浏览器
 */
const IS_ANDROID_FIREFOX = Device.isAndroid() && Device.isFirefox()

/**
 * 下一帧执行
 * @param {Function} callback - 回调函数
 * @returns {number} requestAnimationFrame ID
 */
const nextFrame = callback => requestAnimationFrame(callback)

/**
 * 取消帧请求
 * @param {number} id - requestAnimationFrame ID
 */
const cancelFrame = id => cancelAnimationFrame(id)

// ============================================
// Toast 通知
// ============================================

const Toast = {
  el: null,
  timer: 0,

  init() {
    this.el = $('toast')
  },

  show(msg, ms = 1500) {
    if (!this.el) return
    this.el.textContent = msg
    this.el.classList.add('show')
    clearTimeout(this.timer)
    this.timer = setTimeout(() => this.el.classList.remove('show'), ms)
  }
}

// ============================================
// 默认名单数据
// ============================================

const PLACEHOLDER_NAME_PREFIXES = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸']
const PLACEHOLDER_NAME_SUFFIXES = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十', '子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉']
const PLACEHOLDER_NAME_TAILS = ['东', '南', '西', '北', '中']

const createPlaceholderStudentName = index => {
  const safeIndex = Math.max(0, Number(index) || 0)
  const prefix = PLACEHOLDER_NAME_PREFIXES[safeIndex % PLACEHOLDER_NAME_PREFIXES.length]
  const suffix = PLACEHOLDER_NAME_SUFFIXES[Math.floor(safeIndex / PLACEHOLDER_NAME_PREFIXES.length) % PLACEHOLDER_NAME_SUFFIXES.length]
  const block = Math.floor(safeIndex / (PLACEHOLDER_NAME_PREFIXES.length * PLACEHOLDER_NAME_SUFFIXES.length))
  return block ? `${prefix}${suffix}${PLACEHOLDER_NAME_TAILS[(block - 1) % PLACEHOLDER_NAME_TAILS.length]}` : `${prefix}${suffix}`
}

const DEFAULT_ROSTER_SIZE = 50
const DEFAULT_ROSTER = Array.from({ length: DEFAULT_ROSTER_SIZE }, (_, index) => {
  const id = String(index + 1).padStart(2, '0')
  return `${id} ${createPlaceholderStudentName(index)}`
})

// ============================================
// 导出和全局兼容桥
// ============================================

export {
  $, qs, qsa, createEl,
  APP_NAME_SLUG, CARD_COLOR_PRESETS, SUBJECT_PRESETS, clamp,
  formatBackupFileName, ColorUtil, IdGenerator,
  isValidObject, isValidArray, isNonEmptyString, isValidNumber,
  validateStorageData, isValidImportData, isValidRecoveryDraft,
  isValidStudentId, isValidAssignment, Validator,
  KEYS, LS,
  Device, IS_ANDROID_FIREFOX, nextFrame, cancelFrame,
  Toast, DEFAULT_ROSTER, createPlaceholderStudentName
}

// 兼容桥：同步到 globalThis
if (typeof globalThis !== 'undefined') {
  Object.assign(globalThis, {
    $, qs, qsa, createEl,
    APP_NAME_SLUG, CARD_COLOR_PRESETS, SUBJECT_PRESETS, clamp,
    formatBackupFileName, ColorUtil, IdGenerator,
    isValidObject, isValidArray, isNonEmptyString, isValidNumber,
    validateStorageData, isValidImportData, isValidRecoveryDraft,
    isValidStudentId, isValidAssignment, Validator,
    KEYS, LS,
    Device, IS_ANDROID_FIREFOX, nextFrame, cancelFrame,
    Toast, DEFAULT_ROSTER, createPlaceholderStudentName
  })
}
