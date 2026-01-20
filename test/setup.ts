import { Window } from "happy-dom"

const window = new Window({ url: "http://localhost:3000" })

Object.assign(globalThis, {
  window,
  document: window.document,
  navigator: window.navigator,
  location: window.location,
  HTMLElement: window.HTMLElement,
  customElements: window.customElements,
})
