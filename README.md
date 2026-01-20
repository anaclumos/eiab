# eiab (Escape In-App Browser)

Detect common in-app browsers (Facebook/Instagram/Twitter/etc.) and generate an escape URL that opens the current page in an external browser.

This is useful for flows that often fail inside in-app browsers (e.g. Apple Wallet passes, OAuth/SSO redirects, payment providers, file downloads).

## Install

```bash
bun add eiab
```

Or with npm/pnpm/yarn:

```bash
npm install eiab
pnpm add eiab
yarn add eiab
```

**Note:** This library is **ESM-only**. CommonJS is not supported.

## Quick start

### Vanilla JS

```ts
import { attemptEscape } from "eiab";

attemptEscape();
```

### React

```tsx
import { EscapeInAppBrowser } from "eiab/react";

export default function Layout({ children }) {
  return (
    <>
      <EscapeInAppBrowser />
      {children}
    </>
  );
}
```

The component accepts optional `url` and `userAgent` props to override detection.

### Vue

```ts
import { onMounted } from "vue";
import { attemptEscape } from "eiab";

export function useEscapeOnMounted() {
  onMounted(() => {
    attemptEscape();
  });
}
```

## API

```ts
export function isInAppBrowser(userAgent?: string): boolean;
export function getEscapeUrl(currentUrl?: string, userAgent?: string): string | null;
export function attemptEscape(currentUrl?: string, userAgent?: string): void;
```

### `isInAppBrowser(userAgent?)`

Returns `true` when the provided UA (or `navigator.userAgent`) matches common in-app browser patterns.

### `getEscapeUrl(currentUrl?, userAgent?)`

Returns a URL/scheme that should open `currentUrl` in an external browser, or `null` when no escape should be attempted.

### `attemptEscape(currentUrl?, userAgent?)`

Convenience wrapper that calls `getEscapeUrl(...)` and, when a non-null value is returned, assigns it to `window.location.href` (or `location.href`).

## Escape strategies

- KakaoTalk: `kakaotalk://web/openExternal?url=...`
- LINE: adds `openExternalBrowser=1`
- Android (generic in-app): Chrome Intent URI
- iOS (generic in-app): `x-safari-https://...` (and `x-safari-http://...`)

## Why `x-safari-https://`?

Historically, many apps used `googlechrome://` to jump out of an iOS in-app browser, but that requires Chrome to be installed.

iOS supports `x-safari-https://` to open a URL directly in Safari, providing a more reliable escape mechanism that doesn't depend on third-party browsers being installed.

## Browser support matrix (high level)

| Platform | In-app detected | Escape method |
| --- | --- | --- |
| iOS (KakaoTalk) | Yes | `kakaotalk://...` |
| iOS (LINE) | Yes | `?openExternalBrowser=1` |
| iOS (other in-app) | Yes | `x-safari-https://...` |
| Android (LINE) | Yes | `?openExternalBrowser=1` |
| Android (other in-app) | Yes | `intent://...#Intent;package=com.android.chrome;end` |

## Notes

- `eiab` is intentionally small and dependency-free at runtime.
