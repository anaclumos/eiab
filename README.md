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
import { EscapeInAppBrowser, useIsInAppBrowser, EiabSuccess, EiabFailed } from "eiab/react";

export default function Layout({ children }) {
  const inApp = useIsInAppBrowser(); // null during SSR, boolean after hydration

  return (
    <>
      <EscapeInAppBrowser />
      <EiabSuccess>You're in a normal browser!</EiabSuccess>
      <EiabFailed>Please open this page in Safari or Chrome.</EiabFailed>
      {children}
    </>
  );
}
```

## API

- `isInAppBrowser(userAgent?: string): boolean` — Returns `true` if the UA matches in-app browser patterns.
- `getEscapeUrl(currentUrl?, userAgent?): string | null` — Returns a URL/scheme to escape the in-app browser, or `null`.
- `attemptEscape(currentUrl?, userAgent?): void` — Convenience wrapper that redirects to the escape URL if detected.

The `eiab/react` entry point exports `EscapeInAppBrowser`, `useIsInAppBrowser`, `EiabSuccess`, and `EiabFailed`.


## Escape Strategies

| Platform | Method | Notes |
|----------|--------|-------|
| iOS | `x-safari-https://` scheme via `window.open` | Opens Safari directly |
| Android | `intent://...#Intent;scheme=https;end` | Opens the user's default browser |
| KakaoTalk | `kakaotalk://web/openExternal?url=...` | Native external browser scheme |
| LINE | `?openExternalBrowser=1` query param | Works on both iOS and Android |

## Notes

- `eiab` is intentionally small and **dependency-free** at runtime.
