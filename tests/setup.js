import { readFileSync } from 'fs'
import { join } from 'path'
import { vi } from 'vitest'

const html = readFileSync(join(process.cwd(), 'index.html'), 'utf8')
document.documentElement.innerHTML = html

// Mocks
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  observe() {}
  unobserve() {}
  disconnect() {}
}

global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  observe() {}
  unobserve() {}
  disconnect() {}
}

global.alert = vi.fn()
global.confirm = vi.fn(() => true)
global.prompt = vi.fn()

// 加载 ESM 模块
const constantsModule = await import(join(process.cwd(), 'constants.js'))
const utilsModule = await import(join(process.cwd(), 'utils.js'))
const backHandlerModule = await import(join(process.cwd(), 'back-handler.js'))
const modalModule = await import(join(process.cwd(), 'modal.js'))
const bottomSheetModule = await import(join(process.cwd(), 'bottom-sheet.js'))
const scorepadModule = await import(join(process.cwd(), 'scorepad.js'))
const actionViewsModule = await import(join(process.cwd(), 'action-views.js'))
const appModule = await import(join(process.cwd(), 'app.js'))
const actionsModule = await import(join(process.cwd(), 'actions.js'))

// 同步到 globalThis（确保测试环境可用）
if (typeof globalThis.KEYS === 'undefined') {
  globalThis.KEYS = utilsModule.KEYS
}
if (typeof globalThis.Toast === 'undefined') {
  globalThis.Toast = utilsModule.Toast
}
if (typeof globalThis.ColorUtil === 'undefined') {
  globalThis.ColorUtil = utilsModule.ColorUtil
}
if (typeof globalThis.Validator === 'undefined') {
  globalThis.Validator = utilsModule.Validator
}
if (typeof globalThis.IdGenerator === 'undefined') {
  globalThis.IdGenerator = utilsModule.IdGenerator
}
if (typeof globalThis.BackHandler === 'undefined') {
  globalThis.BackHandler = backHandlerModule.BackHandler
}
if (typeof globalThis.Modal === 'undefined') {
  globalThis.Modal = modalModule.Modal
}
if (typeof globalThis.BottomSheet === 'undefined') {
  globalThis.BottomSheet = bottomSheetModule.BottomSheet
}
if (typeof globalThis.ScorePad === 'undefined') {
  globalThis.ScorePad = scorepadModule.ScorePad
}
if (typeof globalThis.ActionViews === 'undefined') {
  globalThis.ActionViews = actionViewsModule.ActionViews
}
if (typeof globalThis.State === 'undefined') {
  globalThis.State = appModule.State
}
if (typeof globalThis.UI === 'undefined') {
  globalThis.UI = appModule.UI
}
if (typeof globalThis.Actions === 'undefined') {
  globalThis.Actions = actionsModule.Actions
}

// 初始化组件
if (globalThis.Toast && globalThis.Toast.init) {
  globalThis.Toast.init()
}
if (globalThis.Modal && globalThis.Modal.init) {
  globalThis.Modal.init()
}
if (globalThis.ScorePad && globalThis.ScorePad.init) {
  globalThis.ScorePad.init()
}

// 验证全局对象已设置
if (typeof globalThis.KEYS === 'undefined') {
  throw new Error('Failed to load utils.js - KEYS not found in globalThis')
}

// 为 Modal 对象添加测试所需的别名属性
if (typeof Modal !== 'undefined' && typeof constantsModule.ANIMATION_DURATION !== 'undefined') {
  Modal.FULL_ENTER_MS = constantsModule.ANIMATION_DURATION.FULL_ENTER
  Modal.FULL_EXIT_MS = constantsModule.ANIMATION_DURATION.FULL_EXIT
}
