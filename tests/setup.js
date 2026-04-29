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

// 先加载基础 ESM 模块
await import(join(process.cwd(), 'constants.js'))
await import(join(process.cwd(), 'utils.js'))

// 加载 core.js（保留向后兼容）
const coreContent = readFileSync(join(process.cwd(), 'core.js'), 'utf8')
;(new Function(coreContent))()

// 加载 action-views.js（传统脚本，不依赖 Modal）
const actionViewsContent = readFileSync(join(process.cwd(), 'action-views.js'), 'utf8')
;(new Function(actionViewsContent))()

// 加载 ESM 组件模块（它们依赖上面的全局变量）
// 注意：ESM 模块会将对象同步到 globalThis
const backHandlerModule = await import(join(process.cwd(), 'back-handler.js'))
const modalModule = await import(join(process.cwd(), 'modal.js'))
const bottomSheetModule = await import(join(process.cwd(), 'bottom-sheet.js'))
const scorepadModule = await import(join(process.cwd(), 'scorepad.js'))

// 手动同步到 globalThis（确保测试环境可用）
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

// 加载剩余传统脚本模块（这些模块依赖 Modal 等全局变量）
const traditionalFiles = [
  'app.js',
  'actions.js',
  'boot.js'
]

traditionalFiles.forEach(file => {
  const content = readFileSync(join(process.cwd(), file), 'utf8')
  try {
    ;(new Function(content))()
  } catch (e) {
    console.error(`Error loading ${file}:`, e)
    throw e
  }
})

// 验证全局对象已设置
if (typeof globalThis.KEYS === 'undefined') {
  throw new Error('Failed to load utils.js - KEYS not found in globalThis')
}

// 为 Modal 对象添加测试所需的别名属性
if (typeof Modal !== 'undefined' && typeof ANIMATION_DURATION !== 'undefined') {
  Modal.FULL_ENTER_MS = ANIMATION_DURATION.FULL_ENTER
  Modal.FULL_EXIT_MS = ANIMATION_DURATION.FULL_EXIT
}
