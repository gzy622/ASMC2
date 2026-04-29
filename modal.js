import { $, Toast, IS_ANDROID_FIREFOX } from './utils.js'
import { ANIMATION_DURATION } from './constants.js'
import { BackHandler } from './back-handler.js'

const Modal = {
  _el: null,
  _card: null,
  _title: null,
  _body: null,
  _footer: null,
  _closeBtn: null,
  _header: null,
  get el() {
    if (!this._el) this._el = $('modal')
    return this._el
  },
  get card() {
    if (!this._card) this._card = this.el.querySelector('.modal-card')
    return this._card
  },
  get title() {
    if (!this._title) this._title = this.el.querySelector('.modal-title')
    return this._title
  },
  get body() {
    if (!this._body) this._body = this.el.querySelector('.modal-body')
    return this._body
  },
  get footer() {
    if (!this._footer) this._footer = this.el.querySelector('.modal-footer')
    return this._footer
  },
  get closeBtn() {
    if (!this._closeBtn) this._closeBtn = this.el.querySelector('.modal-close')
    return this._closeBtn
  },
  get header() {
    if (!this._header) this._header = this.el.querySelector('.modal-header')
    return this._header
  },
  isOpen: false, isClosing: false, isFull: false, isAnimating: false, resolve: null,
  _scrollY: 0, _layoutRaf: 0, _enterRafA: 0, _enterRafB: 0, _viewportHandler: null, _focusHandler: null, _focusTimer: 0, _pointerGuardTimer: 0, _stableFocusMode: false, _lastLayout: null, _progressiveRoot: null, _progressiveController: null, _loadingMask: null, _loadingContentReady: false, _loadingTransitionReady: false, _loadingTransitionTimer: 0,

  init() {
    this.closeBtn.onclick = () => { this.close(false) }
    document.addEventListener('keydown', e => { if (e.key === 'Escape') this.isOpen ? this.close(false) : BackHandler.closeOverlayLikeEsc() })
  },

  lockBody() {
    this._scrollY = window.scrollY || 0
    document.body.style.setProperty('--locked-body-height', `${window.innerHeight}px`)
    document.body.classList.add('modal-open')
    document.body.style.top = `-${this._scrollY}px`
  },

  unlockBody() {
    document.body.classList.remove('modal-open')
    document.body.style.top = ''
    document.body.style.removeProperty('--locked-body-height')
    window.scrollTo(0, this._scrollY || 0)
  },

  releaseActiveInput() {
    const a = document.activeElement
    if (a && a !== document.body && a.matches?.('input, textarea, select, [contenteditable="true"]')) a.blur()
  },

  scheduleFocus(el) {
    clearTimeout(this._focusTimer)
    if (!el) return
    this._focusTimer = setTimeout(() => {
      this._focusTimer = 0
      if (this.isOpen) el.focus({ preventScroll: true })
    }, IS_ANDROID_FIREFOX && el.matches?.('input, textarea, [contenteditable="true"]') ? ANIMATION_DURATION.FOCUS_DELAY_INPUT : ANIMATION_DURATION.FOCUS_DELAY_DEFAULT)
  },

  armPointerGuard(ms = ANIMATION_DURATION.POINTER_GUARD_DEFAULT) {
    clearTimeout(this._pointerGuardTimer)
    this.el.style.pointerEvents = 'none'
    this._pointerGuardTimer = setTimeout(() => {
      this._pointerGuardTimer = 0
      if (this.isOpen && !this.isClosing) this.el.style.pointerEvents = ''
    }, ms)
  },

  buildPagePanel(title, content, btns = []) {
    const root = document.createElement('div')
    root.className = 'st-layout'
    root.style.cssText = 'display:flex;flex-direction:column;flex:1;min-height:0;position:relative'
    root.appendChild((ActionViews || globalThis.ActionViews).createNav(title, () => this.close(false)))

    const scroll = document.createElement('div')
    scroll.className = 'st-scroll-area'
    const section = document.createElement('section')
    section.className = 'modal-page-section'
    if (typeof content === 'string') {
      const t = document.createElement('div'); t.className = 'modal-page-text'; t.textContent = content; section.appendChild(t)
    } else section.appendChild(content)

    if (btns.length) {
      const actions = document.createElement('div')
      actions.className = 'modal-page-actions'
      btns.forEach(b => {
        const btn = document.createElement('button')
        btn.className = `btn ${b.type || 'btn-c'}`
        btn.textContent = b.text
        btn.onclick = () => b.onClick ? b.onClick() : this.close(b.val)
        actions.appendChild(btn)
      })
      section.appendChild(actions)
    }
    scroll.appendChild(section)
    root.appendChild(scroll)

    // 添加回到顶部按钮
    const backToTop = document.createElement('button')
    backToTop.className = 'modal-back-to-top'
    backToTop.innerHTML = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="18 15 12 9 6 15"></polyline></svg>'
    backToTop.onclick = () => scroll.scrollTo({ top: 0, behavior: 'smooth' })
    root.appendChild(backToTop)

    // 监听滚动显示/隐藏按钮
    const toggleBtn = () => {
      if (scroll.scrollTop > 100) {
        backToTop.classList.add('is-visible')
      } else {
        backToTop.classList.remove('is-visible')
      }
    }
    scroll.addEventListener('scroll', toggleBtn, { passive: true })
    toggleBtn()

    return root
  },

  bindViewport() {
    this.unbindViewport()
    this._viewportHandler = () => this.scheduleLayout()
    this._focusHandler = () => { if (!this._stableFocusMode) this.scheduleLayout() }
    window.addEventListener('resize', this._viewportHandler, { passive: true })
    if (window.visualViewport) window.visualViewport.addEventListener('resize', this._viewportHandler, { passive: true })
    if (!this._stableFocusMode) document.addEventListener('focusin', this._focusHandler)
  },

  unbindViewport() {
    if (this._viewportHandler) {
      window.removeEventListener('resize', this._viewportHandler)
      if (window.visualViewport) window.visualViewport.removeEventListener('resize', this._viewportHandler)
      this._viewportHandler = null
    }
    if (this._focusHandler) { document.removeEventListener('focusin', this._focusHandler); this._focusHandler = null }
    cancelAnimationFrame(this._layoutRaf || 0); this._layoutRaf = 0
    clearTimeout(this._focusTimer); this._focusTimer = 0
  },

  cancelEnterTransition() {
    cancelAnimationFrame(this._enterRafA || 0)
    cancelAnimationFrame(this._enterRafB || 0)
    this._enterRafA = 0
    this._enterRafB = 0
    clearTimeout(this._loadingTransitionTimer)
    this._loadingTransitionTimer = 0
  },

  cancelProgressiveWork({ preserveLoadingMask = false } = {}) {
    if (!this._progressiveController) {
      this._progressiveRoot = null
      if (!preserveLoadingMask) this.hideLoadingMask({ force: true })
      return
    }
    this._progressiveController.cancel()
    this._progressiveController = null
    this._progressiveRoot = null
    if (!preserveLoadingMask) this.hideLoadingMask({ force: true })
  },

  showLoadingMask() {
    if (this._loadingMask || !this.isFull || !this.card) return this._loadingMask
    this._loadingContentReady = false
    this._loadingTransitionReady = !this.animationsEnabled()
    const mask = document.createElement('div')
    mask.className = 'modal-loading-mask'
    this.card.appendChild(mask)
    this._loadingMask = mask
    return mask
  },

  markLoadingContentReady() {
    this._loadingContentReady = true
    this.hideLoadingMask()
  },

  markLoadingTransitionReady() {
    this._loadingTransitionReady = true
    this.hideLoadingMask()
  },

  hideLoadingMask({ force = false } = {}) {
    if (!this._loadingMask) return
    if (!force && (!this._loadingContentReady || !this._loadingTransitionReady)) return
    const mask = this._loadingMask
    if (!force) {
      mask.classList.add('is-hiding')
      setTimeout(() => {
        if (this._loadingMask === mask) {
          mask.remove()
          this._loadingMask = null
        }
      }, ANIMATION_DURATION.LOADING_MASK_FADE)
    } else {
      mask.remove()
      this._loadingMask = null
    }
    this._loadingContentReady = false
    this._loadingTransitionReady = false
    clearTimeout(this._loadingTransitionTimer)
    this._loadingTransitionTimer = 0
  },

  /**
   * 创建渐进式渲染控制器，用于分阶段渲染复杂弹窗内容
   * 支持按优先级分阶段渲染（shell/aboveFold/heavy），优化首屏体验
   * @param {Element} root - 弹窗内容的根元素
   * @param {Object} options - 配置选项
   * @param {boolean} [options.animated=true] - 是否启用动画，影响各阶段的延迟时间
   * @returns {Object} 控制器API对象，包含调度、取消、清理等方法
   */
  createProgressiveController(root, { animated = this.animationsEnabled() } = {}) {
    const timers = new Set()
    const rafs = new Set()
    const cleanups = new Set()
    let pending = 0
    let idleNotified = false
    let idleTimer = 0
    const stageOffsets = animated
      ? { shell: 0, aboveFold: ANIMATION_DURATION.FULL_ENTER, heavy: ANIMATION_DURATION.FULL_ENTER + 72 }
      : { shell: 0, aboveFold: 0, heavy: 0 }
    const state = { cancelled: false }
    const captureCleanup = result => {
      if (typeof result === 'function') cleanups.add(result)
      return result
    }
    const acquirePending = () => {
      let released = false
      pending++
      return () => {
        if (released) return
        released = true
        pending = Math.max(0, pending - 1)
        settleIdle()
      }
    }
    const settleIdle = () => {
      if (state.cancelled || pending > 0 || idleNotified || typeof api.onIdle !== 'function') return
      if (idleTimer) return
      idleTimer = setTimeout(() => {
        idleTimer = 0
        if (state.cancelled || pending > 0 || idleNotified || typeof api.onIdle !== 'function') return
        idleNotified = true
        api.onIdle()
      }, 0)
    }
    const runTask = (task, release = acquirePending()) => {
      try {
        return captureCleanup(task(api))
      } finally {
        release()
      }
    }
    const api = {
      root,
      animated,
      stageOffsets,
      onIdle: null,
      kickIdle: () => settleIdle(),
      isActive: () => !state.cancelled && this.isOpen && !this.isClosing && this.body.contains(root),
      registerCleanup: fn => {
        if (typeof fn === 'function') cleanups.add(fn)
        return fn
      },
      after: (task, delay = 0, { frame = false, frames = 1 } = {}) => {
        if (typeof task !== 'function') return 0
        const invoke = () => {
          if (!api.isActive()) {
            release()
            return 0
          }
          if (frame) return api.frame(task, frames, release)
          return runTask(task, release)
        }
        const ms = Math.max(0, Number(delay) || 0)
        if (!animated && ms <= 0) {
          runTask(task)
          return 0
        }
        const release = acquirePending()
        const timerId = setTimeout(() => {
          timers.delete(timerId)
          invoke()
        }, ms)
        timers.add(timerId)
        return timerId
      },
      frame: (task, frames = 1, release = null) => {
        if (typeof task !== 'function') return 0
        const ownRelease = release || acquirePending()
        if (!api.isActive()) {
          ownRelease()
          return 0
        }
        const totalFrames = Math.max(1, Number(frames) || 1)
        if (!animated) {
          runTask(task, ownRelease)
          return 0
        }
        let remaining = totalFrames
        const step = () => {
          if (!api.isActive()) return
          if (remaining > 1) {
            remaining--
            const nextId = requestAnimationFrame(() => {
              rafs.delete(nextId)
              step()
            })
            rafs.add(nextId)
            return
          }
          runTask(task, ownRelease)
        }
        const rafId = requestAnimationFrame(() => {
          rafs.delete(rafId)
          step()
        })
        rafs.add(rafId)
        return rafId
      },
      schedule: (task, { phase = 'shell', delay = 0, frame = true, frames = 1 } = {}) => {
        if (typeof task !== 'function') return 0
        if (!animated) {
          const d = Math.max(0, Number(delay) || 0)
          if (d === 0) {
            const release = acquirePending()
            if (api.isActive()) runTask(task, release)
            else release()
            return 0
          }
          const release = acquirePending()
          const timerId = setTimeout(() => {
            timers.delete(timerId)
            if (!api.isActive()) {
              release()
              return
            }
            runTask(task, release)
          }, d)
          timers.add(timerId)
          return timerId
        }
        const baseDelay = animated ? (stageOffsets[phase] ?? stageOffsets.heavy) : 0
        return api.after(task, baseDelay + Math.max(0, Number(delay) || 0), { frame, frames })
      },
      cancel: () => {
        if (state.cancelled) return
        state.cancelled = true
        clearTimeout(idleTimer)
        idleTimer = 0
        timers.forEach(timerId => clearTimeout(timerId))
        timers.clear()
        rafs.forEach(rafId => cancelAnimationFrame(rafId))
        rafs.clear()
        cleanups.forEach(fn => {
          try { fn() } catch (err) { }
        })
        cleanups.clear()
        pending = 0
      }
    }
    return api
  },

  registerProgressiveRoot(root, animated) {
    this.cancelProgressiveWork({ preserveLoadingMask: true })
    if (!this.isFull || !(root instanceof Element)) return null
    this._progressiveRoot = root
    this._progressiveController = this.createProgressiveController(root, { animated })
    this._progressiveController.onIdle = () => this.markLoadingContentReady()
    this._progressiveController.kickIdle()
    return this._progressiveController
  },

  getProgressiveController(root = null) {
    if (!this._progressiveController) return null
    if (!root || root === this._progressiveRoot) return this._progressiveController
    return null
  },

  animationsEnabled() {
    return !globalThis.State || State.animations !== false
  },

  stageOpenTransition() {
    this.cancelEnterTransition()
    this.isAnimating = true
    this.el.classList.add('is-preopen')
    // 单层 rAF 足够确保浏览器已应用 is-preopen 状态
    this._enterRafA = requestAnimationFrame(() => {
      this._enterRafA = 0
      if (!this.isOpen || this.isClosing) { this.isAnimating = false; return }
      this.el.classList.remove('is-preopen')
      this.el.classList.add('is-open')
      this._loadingTransitionTimer = setTimeout(() => {
        this._loadingTransitionTimer = 0
        this.isAnimating = false
        if (!this.isOpen || this.isClosing || !this.isFull) return
        this.markLoadingTransitionReady()
      }, ANIMATION_DURATION.FULL_ENTER)
    })
  },

  scheduleLayout() { if (this.isOpen) { cancelAnimationFrame(this._layoutRaf || 0); this._layoutRaf = requestAnimationFrame(() => this.updateLayout()) } },

  updateLayout() {
    if (!this.isOpen) return
    const vv = window.visualViewport, vpH = Math.round(vv ? vv.height : window.innerHeight)
    let top, bot
    if (this._stableFocusMode) {
      top = bot = 0
    } else {
      const vpT = Math.round(vv ? vv.offsetTop : 0)
      const kbd = Math.max(0, Math.round(window.innerHeight - (vv ? vv.height + vv.offsetTop : window.innerHeight)))
      top = vpT; bot = kbd
    }
    if (this._lastLayout && this._lastLayout.vpH === vpH && this._lastLayout.top === top && this._lastLayout.bot === bot) return
    this._lastLayout = { vpH, top, bot }
    const s = this.el.style
    s.setProperty('--modal-vh', `${vpH}px`)
    s.setProperty('--modal-top-gap', `${top}px`)
    s.setProperty('--modal-bottom-gap', `${bot}px`)
  },

  /**
   * 显示弹窗，支持全屏和页面两种模式
   * @param {Object} options - 弹窗配置选项
   * @param {string} [options.title=''] - 弹窗标题
   * @param {string|Element} options.content - 弹窗内容，可以是HTML字符串或DOM元素
   * @param {string} [options.type='normal'] - 弹窗类型：'normal'普通弹窗、'full'全屏弹窗、'page'页面式弹窗
   * @param {Array<Object>} [options.btns=[]] - 底部按钮配置数组，每个按钮包含text、type、onClick/val属性
   * @param {Element|null} [options.autoFocusEl=null] - 弹窗打开后自动聚焦的元素
   * @param {boolean} [options.loadingMask=true] - 全屏模式下是否显示加载遮罩
   * @returns {Promise<*>} 返回Promise，弹窗关闭时解析为关闭值（通过close(val)传入）
   */
  show({ title, content, type = 'normal', btns = [], autoFocusEl = null, loadingMask = true }) {
    if (this.isOpen) this.forceClose(false)
    const UI = globalThis.UI
    if (UI) UI.setGridFrozen(true)
    this.releaseActiveInput()
    const usePage = type !== 'full'
    const isFullScreen = !usePage
    this.title.textContent = title || ''
    this.body.innerHTML = ''
    let mountedContent = usePage ? this.buildPagePanel(title, content, btns) : content
    if (!usePage && typeof content === 'string') {
      const wrap = document.createElement('div')
      wrap.innerHTML = content
      mountedContent = wrap.childElementCount === 1 ? wrap.firstElementChild : wrap
    }
    if (mountedContent instanceof Node) this.body.appendChild(mountedContent)

    this.isFull = isFullScreen
    this.el.className = `${isFullScreen ? 'full' : 'page'}`
    this._stableFocusMode = IS_ANDROID_FIREFOX && autoFocusEl?.matches?.('input, textarea, [contenteditable="true"]')
    if (this._stableFocusMode) this.el.classList.add('focus-stable')
    this.header.style.display = 'none'
    this.footer.innerHTML = ''
    this.footer.style.display = !usePage && btns.length ? 'flex' : 'none'

    if (!usePage) {
      btns.forEach(b => {
        const btn = document.createElement('button')
        btn.className = `btn ${b.type || 'btn-c'}`
        btn.textContent = b.text
        btn.onclick = () => b.onClick ? b.onClick() : this.close(b.val)
        this.footer.appendChild(btn)
      })
    }

    this.isClosing = false; this.isOpen = true; this._lastLayout = null
    if (isFullScreen && loadingMask) this.showLoadingMask()
    const animated = this.animationsEnabled()
    this.registerProgressiveRoot(mountedContent instanceof Element ? mountedContent : null, animated)
    if (animated) {
      this.stageOpenTransition()
      this.armPointerGuard(this.isFull ? ANIMATION_DURATION.POINTER_GUARD_FULL : ANIMATION_DURATION.POINTER_GUARD_PAGE)
    } else {
      this.cancelEnterTransition()
      this.el.classList.remove('is-preopen')
      this.el.classList.add('is-open')
      this.markLoadingTransitionReady()
    }
    this.lockBody(); this.bindViewport(); this.scheduleLayout(); this.scheduleFocus(autoFocusEl)
    return new Promise(r => this.resolve = r)
  },

  _cleanup(val) {
    this.cancelEnterTransition()
    this.cancelProgressiveWork()
    this.hideLoadingMask({ force: true })
    this.el.classList.remove('is-preopen', 'is-open', 'is-closing', 'full', 'page', 'focus-stable')
    this.isOpen = this.isClosing = this.isFull = this.isAnimating = this._stableFocusMode = false
    this._lastLayout = null
    clearTimeout(this._pointerGuardTimer); this.el.style.pointerEvents = ''
    const UI = globalThis.UI
    this.unbindViewport(); this.unlockBody(); if (UI) UI.setGridFrozen(false)
    const r = this.resolve; this.resolve = null; if (r) r(val)
  },

  close(val) {
    if (!this.isOpen || this.isClosing) return
    this.isClosing = true
    this.isAnimating = true
    this.el.classList.add('is-closing')
    this.el.classList.remove('is-open')
    if (!this.animationsEnabled()) return this._cleanup(val)
    setTimeout(() => this._cleanup(val), ANIMATION_DURATION.FULL_EXIT)
  },

  forceClose(val = false) { if (this.isOpen) this._cleanup(val) },

  alert(msg) { return this.show({ title: '提示', content: msg, btns: [{ text: '确定', type: 'btn-p', val: true }] }) },
  confirm(msg) { return this.show({ title: '确认', content: msg, btns: [{ text: '取消', type: 'btn-c', val: false }, { text: '确定', type: 'btn-p', val: true }] }) },
  prompt(title, val = '', type = 'text') {
    const input = document.createElement('input')
    input.className = 'input-ui'; input.value = val
    if (type === 'number') { input.type = 'number'; input.inputMode = 'numeric' }
    input.enterKeyHint = 'done'
    input.addEventListener('keydown', e => { if (e.key === 'Enter' && !e.isComposing) { e.preventDefault(); this.close(input.value) } })
    return this.show({ title, content: input, autoFocusEl: input, btns: [{ text: '取消', type: 'btn-c', val: false }, { text: '确定', type: 'btn-p', onClick: () => this.close(input.value) }] })
  }
}

export { Modal }

// 兼容桥：同步到 globalThis
if (typeof globalThis !== 'undefined') {
  globalThis.Modal = Modal
}
