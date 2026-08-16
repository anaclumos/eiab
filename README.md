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
- `needsUserGesture(userAgent?: string): boolean` -- Returns `true` when automatic redirects are dropped/hang and a real user tap is required (Meta iOS).
- `getEscapeUrl(currentUrl?, userAgent?): string | null` -- Returns a URL/scheme to escape the in-app browser, or `null`.
- `attemptEscape(currentUrl?, userAgent?): void` -- Convenience wrapper that redirects to the escape URL if detected. No-ops when `needsUserGesture` is true — use `EiabEscapeDialog` / `EiabEscapeLink` there.
- `getDebugInfo(): EiabDebugInfo` -- Live-environment snapshot (UA, detection, escape URL, viewport, share/clipboard). Requires a browser.

### React (`eiab/react`)

- **`EscapeInAppBrowser`** -- Attempts automatic escape on mount (skipped when `needsUserGesture`). Accepts an optional `fallback` prop rendered when automatic escape fails or requires a tap (e.g. Meta iOS — see notes below).
- **`needsUserGesture`** -- Also re-exported from `eiab/react`.
- **`EiabEscapeDialog`** -- Bottom-sheet dialog with "Open in browser", "Copy link", and dismiss actions. Relies on native anchor navigation from a user tap.
- **`EiabEscapeLink`** -- Inline tappable link (native `<a href>` to the scheme URL). Renders nothing when not in an in-app browser.
- **`useIsInAppBrowser(userAgent?)`** -- Returns `null` during SSR, `boolean` after hydration.
- **`useEscapeUrl(url?, userAgent?)`** -- Returns the escape URL or `null`.
- **`EiabSuccess`** / **`EiabFailed`** -- Conditional rendering based on in-app detection.


## Escape Strategies

| Platform | Method | Notes |
|----------|--------|-------|
| Instagram (iOS) | `instagram://extbrowser/?url=...` | Instagram's own native external-browser host (best-effort — see caveat) |
| Threads (iOS) | `barcelona://extbrowser/?url=...` | Threads' native external-browser host (best-effort — see caveat) |
| Twitter/X (iOS) | `x-safari-https://` | Auto-escape via WebKit hand-off (WKWebView since X 11.42) |
| iOS (other) | `x-safari-https://` scheme | Opens Safari when the WebView allows it |
| Android | `intent://...#Intent;scheme=https;end` | Opens the user's default browser (includes Twitter/X) |
| KakaoTalk | `kakaotalk://web/openExternal?url=...` | Native external browser scheme |
| LINE | `?openExternalBrowser=1` query param | Works on both iOS and Android |

The KakaoTalk/LINE/Instagram/Threads rows use each app's **own native "open externally" scheme**, handled by the host app rather than by iOS — the most robust class of escape.

## Twitter/X iOS

Since X 11.42 the iOS in-app browser is a WKWebView (it used to be `SFSafariViewController`). `x-safari-*` is a WebKit-level hand-off, not a custom app scheme, so `attemptEscape` auto-navigates the same way it does for TikTok and other non-Meta IABs. Pair with `EiabEscapeDialog` / **Copy link** as a backup if a future WebView build swallows the scheme.

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
