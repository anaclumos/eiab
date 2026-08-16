# eiab (Escape In-App Browser)

Detect in-app browsers and generate escape URLs to open the current page in an external browser.

## Supported Apps

| App | iOS | Android |
|-----|-----|---------|
| Baidu App | - | ✅ |
| Facebook | ✅ | ✅ |
| Google Search App | ✅ | - |
| Instagram | ✅ | ✅ |
| KakaoTalk | ✅ | ✅ |
| LINE | ✅ | ✅ |
| LinkedIn | ✅ | - |
| Messenger | ✅ | ✅ |
| Snapchat | ✅ | - |
| Telegram | ✅ | ✅* |
| Threads | ✅ | ✅ |
| TikTok | ✅ | ✅ |
| Twitter/X | ✅ | ✅ |
| WeChat | ✅ | ✅ |
| Weibo | ✅ | ✅ |
| WhatsApp | ✅ | ✅ |

\*Telegram Android has no UA signal; detected via runtime `window.TelegramWebview` (client-side only).

Also detects generic WebView patterns (iOS WKWebView without Safari token, Android `wv` marker) and 15+ additional in-app browsers (Naver, KakaoStory, Band, Electron, etc.).

## Install

```bash
npm install eiab
```
*Also supports `bun`, `pnpm`, and `yarn`. This library is **ESM-only**.*

## Quick start

### Vanilla JS
```ts
import { attemptEscape } from "eiab";

attemptEscape();
```

### React
```tsx
import {
  EscapeInAppBrowser,
  EiabEscapeDialog,
  EiabSuccess,
  EiabFailed,
} from "eiab/react";

export default function Layout({ children }) {
  return (
    <>
      {/* Auto-escapes where possible; shows dialog where it can't */}
      <EscapeInAppBrowser fallback={<EiabEscapeDialog />} />
      <EiabSuccess>You're in a normal browser!</EiabSuccess>
      <EiabFailed>Please open this page in Safari or Chrome.</EiabFailed>
      {children}
    </>
  );
}
```

## API

### Core (`eiab`)

- `isInAppBrowser(userAgent?: string): boolean` -- Returns `true` if the UA matches in-app browser patterns.
- `needsUserGesture(userAgent?: string): boolean` -- Returns `true` when automatic redirects are dropped/hang and a real user tap is required (Meta iOS, Twitter/X iOS).
- `needsManualEscape(userAgent?: string): boolean` -- Returns `true` when no JS/HTTP navigation opens the default browser (Twitter/X iOS). Use copy + the host app chrome.
- `getEscapeUrl(currentUrl?, userAgent?): string | null` -- Returns a URL/scheme to escape the in-app browser, or `null`. On Twitter/X iOS this is the page URL for copy/debug — not a navigable escape.
- `toXSafariUrl(url: string): string | null` -- Rewrites `https://` / `http://` to `x-safari-https://` / `x-safari-http://`.
- `attemptEscape(currentUrl?, userAgent?): void` -- Convenience wrapper that redirects to the escape URL if detected. No-ops when `needsUserGesture` is true — use `EiabEscapeDialog` / `EiabEscapeLink` there.
- `getDebugInfo(): EiabDebugInfo` -- Live-environment snapshot (UA, detection, escape URL, viewport, share/clipboard). Requires a browser.

### React (`eiab/react`)

- **`EscapeInAppBrowser`** -- Attempts automatic escape on mount (skipped when `needsUserGesture`). Accepts an optional `fallback` prop rendered when automatic escape fails or requires a tap (Meta iOS, Twitter/X iOS).
- **`needsUserGesture`** / **`needsManualEscape`** -- Also re-exported from `eiab/react`.
- **`EiabEscapeDialog`** -- Bottom-sheet dialog with "Open in browser", "Copy link", and dismiss. Native `<a href>` from a user tap, except Twitter/X iOS where the primary action is Copy link.
- **`EiabEscapeLink`** -- Inline tappable link (native `<a href>` to the escape URL). Renders nothing when not in an in-app browser.
- **`useIsInAppBrowser(userAgent?)`** -- Returns `null` during SSR, `boolean` after hydration.
- **`useEscapeUrl(url?, userAgent?)`** -- Returns the escape URL or `null`.
- **`EiabSuccess`** / **`EiabFailed`** -- Conditional rendering based on in-app detection.


## Escape Strategies

| Platform | Method | Notes |
|----------|--------|-------|
| Instagram (iOS) | `instagram://extbrowser/?url=...` | Instagram's own native external-browser host (best-effort — see caveat) |
| Threads (iOS) | `barcelona://extbrowser/?url=...` | Threads' native external-browser host (best-effort — see caveat) |
| Twitter/X (iOS) | None (copy + X chrome) | No JS/HTTP scheme opens the default browser; see below |
| iOS (other) | `x-safari-https://` scheme | Opens Safari when the WebView allows it |
| Android | `intent://...#Intent;scheme=https;end` | Opens the user's default browser (includes Twitter/X) |
| KakaoTalk | `kakaotalk://web/openExternal?url=...` | Native external browser scheme |
| LINE | `?openExternalBrowser=1` query param | Works on both iOS and Android |

The KakaoTalk/LINE/Instagram/Threads rows use each app's **own native "open externally" scheme**, handled by the host app rather than by iOS — the most robust class of escape.

## Twitter/X iOS

There is no JavaScript or HTTP method that opens the user's default browser from X's iOS in-app browser.

That is not a guess. [inappdebugger](https://github.com/shalanah/inapp-debugger) (matrix updated 2026-03-07) marks Twitter iPhone **Safari scheme ❌** and **browser scheme ❌**. The same page states there is no Apple-approved default-browser exit, unlike Android intent links. Field tests on Twitter for iPhone 12.17 / iOS 27 matched that matrix: `x-safari-*` (JS, `<a>`, and HTTP 302), guessed `twitter://` hosts, `_blank` https, and `window.open` all stay in-app (the 302 reloads the page). `navigator.share({ url })` opens the iOS share sheet, which is not Safari. The Shortcuts `x-error` trick ([inapp-debugger#8](https://github.com/shalanah/inapp-debugger/issues/8)) died on iOS 18.1+. Marketing posts that claim X iOS "automatic redirect" or that `x-safari-*` still works on Twitter contradict both the matrix and those device tests.

`needsManualEscape()` is therefore true. `getEscapeUrl` returns the page URL for copy/debug only — do not navigate to it. `EiabEscapeDialog` makes **Copy link** the primary action and tells the user to use X's chrome: tap **•••** → **Open in browser** (wording may be Open in Safari / Open externally). Some X builds also have **Settings and privacy** → **Display** → **Use in-app browser**; do not assume that toggle still exists.

`attemptEscape` does **not** auto-navigate (`needsUserGesture`). Pair with `EiabEscapeDialog`.

On Android, Twitter/X uses the standard `intent://` escape.

## Meta iOS caveat

Meta's iOS in-app browsers (Instagram, Facebook, Messenger, Threads) are hardened WKWebViews that drop — and on Facebook iOS 555+, **hang on** — `x-safari-*` scheme redirects without user activation. IG v417+ also filters them even on tap. **There is no purely-browser-based API that reliably opens Safari from these apps.**

`attemptEscape()` therefore **does not auto-navigate on Meta iOS** (`needsUserGesture`). Auto `location.href` to a blocked scheme is what left Facebook IAB pages stuck with no redirect. Use a user-tap UI instead.

For **Instagram** / **Threads**, `getEscapeUrl` emits each app's native deep link (`instagram://extbrowser/?url=...` / `barcelona://extbrowser/?url=...`), handled by the host app (not the WebView). Same class of native-exit scheme as KakaoTalk/LINE, but **best-effort, not guaranteed**: Meta often requires a real tap, gates handlers to trusted callers, and may sanitize the URL back into the in-app browser. Facebook/Messenger still surface `x-safari-*` for tap-driven UI only — there is no confirmed Facebook native extbrowser host.

What to do:

1. Render `EiabEscapeDialog` (or `EiabEscapeLink`) so the scheme is triggered by a real user tap — native anchor navigation carries the strongest signal.
2. Offer the dialog's **Copy link** action and Meta's documented manual path, which is the only *guaranteed* exit: *Instagram / Threads:* tap `•••` → *Open in external browser*. *Facebook:* tap the options menu → *Open in external browser*.

## Notes

- `eiab` is intentionally small and **dependency-free** at runtime.
