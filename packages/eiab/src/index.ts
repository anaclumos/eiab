// Apps with custom escape mechanisms (order matters - checked first)
const KAKAOTALK_REGEX = /(?:iphone|ipad|android).* kakaotalk/i
const LINE_REGEX = /(?:iphone|ipad|android).* line\//i
// Threads ("Barcelona") and Instagram expose native external-browser deep link
// hosts ("extbrowser") that the host app handles outside the WKWebView.
// Check Threads before Instagram: some Threads UAs also contain "Instagram".
const THREADS_REGEX = /\bBarcelona/i
const INSTAGRAM_REGEX = /\bInstagram/i
// Meta iOS IABs (FB/Messenger/IG/Threads). Auto location.href to x-safari-*
// (and often even to native schemes without a tap) is dropped or hangs the
// WebView — Facebook iOS 555+ is the known hang case (#2).
const META_IOS_REGEX =
  /\b(?:FBAN|FBIOS|FB_IAB|FBAV|Facebook|Instagram|Barcelona|IABMV\/)/i

// Supported apps detection patterns (based on inapp-spy research + community reports)
const INAPP_PATTERNS = [
  // Generic WebView indicators
  "WebView",
  "Android.+wv\\)", // Android WebView marker

  // Generic in-app marker
  "inapp",

  // Meta: Facebook
  "\\bFB[\\w_]+\\/",
  "\\bFacebook",
  "fb_iab",
  "fb4a",
  "fban",
  "fbios",
  "fbss",

  // Meta: Instagram
  "\\bInstagram",

  // Meta: Threads
  "\\bBarcelona",

  // Meta: In-App Browser marker (appears across IG/FB/Messenger/Threads)
  "IABMV\\/",

  // Meta: Messenger (covered by FB patterns above)

  // Google
  "GSA", // Google Search App

  // Social
  "\\bTwitter",
  "Snapchat",
  "LinkedInApp",

  // TikTok
  "musical_ly",
  "Bytedance",
  "trill",

  // Messaging
  "\\bMicroMessenger\\/", // WeChat
  "\\b(?:WAiOS|WA4A)\\/", // WhatsApp (new format)
  "WhatsApp", // WhatsApp (legacy)
  "\\bTelegram\\/", // Telegram (iOS/desktop UA)

  // Chinese apps
  "\\bWeibo",
  "baiduboxapp",

  // Korean apps
  "band",
  "daumapps",
  "daumdevice\\/mobile",
  "kakaostory",
  "naver",
  "wadiz",
  "zumapp",

  // Other
  "aliapp",
  "electron",
  "everytimeapp",
  "thunderbird",
  "wirtschaftswoche",
] as const

const INAPP_REGEX = new RegExp(INAPP_PATTERNS.join("|"), "i")
// Generic iOS WebView: has iPhone/iPad/iPod but no "Safari/" token
const IOS_WEBVIEW_REGEX = /iP(hone|ad|od)(?!.*Safari\/)/i
const IOS_REGEX = /iP(hone|ad|od)/i
const ANDROID_REGEX = /Android/i

function getDefaultUserAgent(): string | undefined {
  try {
    if (
      typeof navigator !== "undefined" &&
      typeof navigator.userAgent === "string"
    ) {
      return navigator.userAgent
    }
  } catch (_) {
    return undefined
  }

  return undefined
}

function getDefaultUrl(): string | undefined {
  try {
    if (typeof location !== "undefined" && typeof location.href === "string") {
      return location.href
    }
  } catch (_) {
    return undefined
  }

  return undefined
}

// Telegram Android has no UA signal; detect via runtime globals
function isTelegramRuntime(): boolean {
  try {
    if (typeof window !== "undefined") {
      return (
        "TelegramWebview" in window ||
        "TelegramWebviewProxy" in window ||
        "TelegramWebviewProxyProto" in window
      )
    }
  } catch (_) {
    /* empty */
  }

  return false
}

function isIOS(userAgent: string): boolean {
  return IOS_REGEX.test(userAgent)
}

function isAndroid(userAgent: string): boolean {
  return ANDROID_REGEX.test(userAgent)
}

function addQueryParam(url: string, key: string, value: string): string {
  try {
    const parsed = new URL(url)
    parsed.searchParams.set(key, value)
    return parsed.toString()
  } catch {
    const hashIndex = url.indexOf("#")
    const base = hashIndex >= 0 ? url.slice(0, hashIndex) : url
    const hash = hashIndex >= 0 ? url.slice(hashIndex) : ""

    const separator = base.includes("?") ? "&" : "?"
    const next = `${base}${separator}${encodeURIComponent(key)}=${encodeURIComponent(value)}`
    return `${next}${hash}`
  }
}

function replaceScheme(url: string, from: string, to: string): string | null {
  if (!url.startsWith(from)) {
    return null
  }
  return `${to}${url.slice(from.length)}`
}

function toAndroidIntent(url: string): string | null {
  try {
    const parsed = new URL(url)

    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return null
    }

    const scheme = parsed.protocol.slice(0, -1)
    return `intent://${parsed.host}${parsed.pathname}${parsed.search}#Intent;scheme=${scheme};S.browser_fallback_url=${encodeURIComponent(url)};end`
  } catch {
    return null
  }
}

export function isInAppBrowser(userAgent?: string): boolean {
  const ua = userAgent ?? getDefaultUserAgent() ?? ""

  if (
    KAKAOTALK_REGEX.test(ua) ||
    LINE_REGEX.test(ua) ||
    INAPP_REGEX.test(ua) ||
    IOS_WEBVIEW_REGEX.test(ua)
  ) {
    return true
  }

  // Runtime-only detection when no explicit UA was provided (browser context)
  if (userAgent === undefined && isTelegramRuntime()) {
    return true
  }

  return false
}

export function getEscapeUrl(
  currentUrl?: string,
  userAgent?: string
): string | null {
  const url = currentUrl ?? getDefaultUrl()
  if (!url) {
    return null
  }

  const ua = userAgent ?? getDefaultUserAgent() ?? ""
  if (
    !isInAppBrowser(ua) &&
    (userAgent !== undefined || !isTelegramRuntime())
  ) {
    return null
  }

  if (KAKAOTALK_REGEX.test(ua)) {
    return `kakaotalk://web/openExternal?url=${encodeURIComponent(url)}`
  }

  if (LINE_REGEX.test(ua)) {
    return addQueryParam(url, "openExternalBrowser", "1")
  }

  if (isAndroid(ua)) {
    // Android's intent:// is the proven, reliable escape for Instagram and the
    // other Meta apps, so prefer it over the native scheme there.
    return toAndroidIntent(url)
  }

  if (isIOS(ua)) {
    // Meta apps register native "open in external browser" deep link hosts
    // handled by the app, not the WKWebView — the same class of native-exit
    // scheme used for KakaoTalk/LINE. These sidestep x-safari-* filtering Meta
    // added in IG v417+ / FB 555+, but are best-effort only: handlers often
    // require a real user tap, gate to trusted callers, and may sanitize the
    // URL back into the in-app browser. Always pair with EiabEscapeDialog /
    // EiabEscapeLink plus the manual "••• → Open in external browser" path.
    if (THREADS_REGEX.test(ua)) {
      return `barcelona://extbrowser/?url=${encodeURIComponent(url)}`
    }
    if (INSTAGRAM_REGEX.test(ua)) {
      return `instagram://extbrowser/?url=${encodeURIComponent(url)}`
    }

    return (
      replaceScheme(url, "https://", "x-safari-https://") ??
      replaceScheme(url, "http://", "x-safari-http://")
    )
  }

  return null
}

function isMetaIOS(userAgent: string): boolean {
  return isIOS(userAgent) && META_IOS_REGEX.test(userAgent)
}

export function attemptEscape(currentUrl?: string, userAgent?: string): void {
  // Best-effort automatic escape. Meta iOS WKWebViews (Instagram, Facebook,
  // Messenger, Threads) drop or hang on scheme redirects without user
  // activation — Facebook iOS 555+ hangs on x-safari-* location.href (#2).
  // Skip auto-navigation there; callers must pair with a user-tap UI
  // (e.g. EiabEscapeDialog).
  const ua = userAgent ?? getDefaultUserAgent() ?? ""
  if (isMetaIOS(ua)) {
    return
  }

  const escapeUrl = getEscapeUrl(currentUrl, userAgent)
  if (!escapeUrl) {
    return
  }

  try {
    if (typeof window !== "undefined" && window.location) {
      window.location.href = escapeUrl
      return
    }
  } catch (_) {
    /* empty */
  }

  try {
    if (typeof location !== "undefined") {
      ;(location as Location).href = escapeUrl
    }
  } catch (_) {
    /* empty */
  }
}
