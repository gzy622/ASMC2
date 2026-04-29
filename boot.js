import { State, UI } from './app.js'
import { Actions } from './actions.js'
import { ActionViews } from './action-views.js'
import { Modal } from './modal.js'
import { ScorePad } from './scorepad.js'

export function bootstrapApp() {
  const Toast = globalThis.Toast

  if (Toast && Toast.init) Toast.init()
  Modal.init()
  ScorePad.init()

  State.init()
  UI.init()

  setTimeout(() => {
    const versionEl = document.getElementById('menuVersion')
    if (versionEl) {
      const versionText = versionEl.textContent
      if (versionText && Toast) {
        Toast.show(versionText)
      }
    }
  }, 500)
}

bootstrapApp()
