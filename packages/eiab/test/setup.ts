import { Window } from "happy-dom"

const window = new Window({ url: "http://localhost:3000" })

// happy-dom v20 omits built-in error constructors that its own querySelectorAll needs
// biome-ignore lint/suspicious/noExplicitAny: patching happy-dom internals
const w = window as any
if (!w.SyntaxError) {
  w.SyntaxError = SyntaxError
}
if (!w.TypeError) {
  w.TypeError = TypeError
}

Object.assign(globalThis, {
  window,
  document: window.document,
  navigator: window.navigator,
  location: window.location,
  HTMLElement: window.HTMLElement,
  customElements: window.customElements,
  // React 19 scheduler needs these globals
  // biome-ignore lint/suspicious/noExplicitAny: happy-dom Window lacks MessageChannel type
  MessageChannel: (window as any).MessageChannel ?? globalThis.MessageChannel,
  requestAnimationFrame:
    window.requestAnimationFrame?.bind(window) ??
    // biome-ignore lint/complexity/noBannedTypes: rAF polyfill fallback
    ((cb: Function) => setTimeout(cb, 0)),
  cancelAnimationFrame:
    window.cancelAnimationFrame?.bind(window) ?? clearTimeout,
})
