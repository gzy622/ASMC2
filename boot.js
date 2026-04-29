import { State, UI } from './app.js'
import { Actions } from './actions.js'

export function bootstrapApp() {
  const Toast = globalThis.Toast
  const Modal = globalThis.Modal
  const ScorePad = globalThis.ScorePad

  if (Toast && Toast.init) Toast.init()
  if (Modal && Modal.init) Modal.init()
  if (ScorePad && ScorePad.init) ScorePad.init()

  State.init()

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
