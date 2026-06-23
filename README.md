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
| Twitter/X | ✅ | - |
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
- `getEscapeUrl(currentUrl?, userAgent?): string | null` -- Returns a URL/scheme to escape the in-app browser, or `null`.
- `attemptEscape(currentUrl?, userAgent?): void` -- Convenience wrapper that redirects to the escape URL if detected.

### React (`eiab/react`)

- **`EscapeInAppBrowser`** -- Attempts automatic escape on mount. Accepts an optional `fallback` prop rendered when automatic escape fails (e.g. Meta iOS apps — see notes below).
- **`EiabEscapeDialog`** -- Bottom-sheet dialog with "Open in browser", "Copy link", and dismiss actions. Relies on native anchor navigation from a user tap.
- **`EiabEscapeLink`** -- Inline tappable link (native `<a href>` to the scheme URL). Renders nothing when not in an in-app browser.
- **`useIsInAppBrowser(userAgent?)`** -- Returns `null` during SSR, `boolean` after hydration.
- **`useEscapeUrl(url?, userAgent?)`** -- Returns the escape URL or `null`.
- **`EiabSuccess`** / **`EiabFailed`** -- Conditional rendering based on in-app detection.


## Escape Strategies

| Platform | Method | Notes |
|----------|--------|-------|
| Instagram (iOS) | `instagram://extbrowser/?url=...` | Instagram's own native external-browser host (best-effort — see caveat) |
| iOS (other) | `x-safari-https://` scheme | Opens Safari when the WebView allows it |
| Android | `intent://...#Intent;scheme=https;end` | Opens the user's default browser |
| KakaoTalk | `kakaotalk://web/openExternal?url=...` | Native external browser scheme |
| LINE | `?openExternalBrowser=1` query param | Works on both iOS and Android |

The KakaoTalk/LINE/Instagram rows use each app's **own native "open externally" scheme**, handled by the host app rather than by iOS — the most robust class of escape.

## Meta iOS caveat

Meta's iOS in-app browsers (Instagram, Facebook, Messenger, Threads) are hardened WKWebViews that drop `x-safari-*` scheme redirects without user activation, and IG v417+ filters them even on tap. **There is no purely-browser-based API that reliably opens Safari from these apps.**

For **Instagram** specifically, `eiab` instead emits Instagram's own native deep link, `instagram://extbrowser/?url=...`, which the Instagram app (not the WebView) handles. This is the best-grounded option — it's the same class of native-exit scheme used for KakaoTalk/LINE — but treat it as **best-effort, not guaranteed**: Meta's handler gates to trusted callers and may sanitize the URL back into the in-app browser, and there is no confirmed real-device proof it ejects to Safari on current iOS. Always pair it with the manual fallback below.

What to do:

1. Render `EiabEscapeDialog` (or `EiabEscapeLink`) so the scheme is triggered by a real user tap — native anchor navigation carries the strongest signal.
2. Offer the dialog's **Copy link** action and Meta's documented manual path, which is the only *guaranteed* exit: *Instagram:* tap `•••` → *Open in external browser*. *Facebook:* tap the options menu → *Open in external browser*.

## Notes

- `eiab` is intentionally small and **dependency-free** at runtime.
