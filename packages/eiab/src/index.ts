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
  "\\bTwitter", // Twitter/X (iOS + Android)
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

/**
 * Returns true when automatic (JS-initiated) escape redirects are dropped or
 * hang the host WebView, so a real user tap is required instead.
 *
 * Covers Meta iOS (Facebook hang on 555+, IG/Threads/Messenger drop).
 * Twitter/X iOS is not gated: since app 11.42 it uses WKWebView, and
 * `x-safari-*` is a WebKit-level hand-off (not a custom app scheme), so
 * `attemptEscape` can auto-navigate like TikTok and other non-Meta IABs.
 * Pair Meta iOS with `EiabEscapeDialog` / `EiabEscapeLink` so the scheme
 * fires from a native `<a href>` click.
 */
export function needsUserGesture(userAgent?: string): boolean {
  const ua = userAgent ?? getDefaultUserAgent() ?? ""
  return isMetaIOS(ua)
}

export interface EiabUserAgentData {
  brands: { brand: string; version: string }[]
  mobile: boolean | null
  platform: string | null
}

export interface EiabConnectionInfo {
  effectiveType: string | null
  type: string | null
  downlink: number | null
  rtt: number | null
  saveData: boolean | null
}

export interface EiabDebugInfo {
  href: string
  userAgent: string
  referrer: string
  title: string
  isInAppBrowser: boolean
  needsUserGesture: boolean
  escapeUrl: string | null
  isIOS: boolean
  isAndroid: boolean
  language: string
  languages: string[]
  platform: string
  vendor: string
  cookieEnabled: boolean
  maxTouchPoints: number
  standalone: boolean
  visibilityState: string
  innerWidth: number
  innerHeight: number
  screenWidth: number
  screenHeight: number
  devicePixelRatio: number
  telegramWebview: boolean
  telegramWebApp: boolean
  hasShare: boolean
  hasClipboard: boolean
  hasSafari: boolean
  hasWebkit: boolean
  historyLength: number
  timeOrigin: number
  collectedAt: string
  userAgentData: EiabUserAgentData | null
  connection: EiabConnectionInfo | null
}

interface NavigatorDebugExtras {
  standalone?: boolean
  userAgentData?: {
    brands?: { brand: string; version: string }[]
    mobile?: boolean
    platform?: string
  }
  connection?: {
    effectiveType?: string
    type?: string
    downlink?: number
    rtt?: number
    saveData?: boolean
  }
  share?: (...args: unknown[]) => Promise<unknown>
}

function readUserAgentData(
  nav: NavigatorDebugExtras
): EiabUserAgentData | null {
  const uad = nav.userAgentData
  if (!uad) {
    return null
  }
  return {
    brands: Array.from(uad.brands ?? []),
    mobile: uad.mobile ?? null,
    platform: uad.platform ?? null,
  }
}

function readConnection(nav: NavigatorDebugExtras): EiabConnectionInfo | null {
  const conn = nav.connection
  if (!conn) {
    return null
  }
  return {
    effectiveType: conn.effectiveType ?? null,
    type: conn.type ?? null,
    downlink: conn.downlink ?? null,
    rtt: conn.rtt ?? null,
    saveData: conn.saveData ?? null,
  }
}

function isStandaloneDisplay(nav: NavigatorDebugExtras): boolean {
  const standaloneMedia =
    typeof window.matchMedia === "function" &&
    window.matchMedia("(display-mode: standalone)").matches
  return Boolean(nav.standalone || standaloneMedia)
}

/**
 * Snapshot of the live browser environment plus eiab's detection result.
 * Intended for support / field debugging (copy-paste from a demo or overlay).
 * Requires `window` + `navigator`.
 */
export function getDebugInfo(): EiabDebugInfo {
  if (typeof window === "undefined" || typeof navigator === "undefined") {
    throw new Error("getDebugInfo() requires a browser environment")
  }

  const nav = navigator as Navigator & NavigatorDebugExtras
  const ua = nav.userAgent ?? ""
  const win = window as Window & { Telegram?: { WebApp?: unknown } }

  return {
    href: typeof location !== "undefined" ? location.href : "",
    userAgent: ua,
    referrer: typeof document !== "undefined" ? document.referrer : "",
    title: typeof document !== "undefined" ? document.title : "",
    isInAppBrowser: isInAppBrowser(),
    needsUserGesture: needsUserGesture(),
    escapeUrl: getEscapeUrl(),
    isIOS: isIOS(ua),
    isAndroid: isAndroid(ua),
    language: nav.language ?? "",
    languages: Array.from(nav.languages ?? []),
    platform: nav.platform ?? "",
    vendor: nav.vendor ?? "",
    cookieEnabled: Boolean(nav.cookieEnabled),
    maxTouchPoints: nav.maxTouchPoints ?? 0,
    standalone: isStandaloneDisplay(nav),
    visibilityState:
      typeof document !== "undefined" ? document.visibilityState : "",
    innerWidth: window.innerWidth ?? 0,
    innerHeight: window.innerHeight ?? 0,
    screenWidth: window.screen?.width ?? 0,
    screenHeight: window.screen?.height ?? 0,
    devicePixelRatio: window.devicePixelRatio ?? 1,
    telegramWebview: isTelegramRuntime(),
    telegramWebApp: Boolean(win.Telegram?.WebApp),
    hasShare: typeof nav.share === "function",
    hasClipboard: Boolean(nav.clipboard),
    hasSafari: "safari" in window,
    hasWebkit: "webkit" in window,
    historyLength: window.history?.length ?? 0,
    timeOrigin: typeof performance !== "undefined" ? performance.timeOrigin : 0,
    collectedAt: new Date().toISOString(),
    userAgentData: readUserAgentData(nav),
    connection: readConnection(nav),
  }
}

export function attemptEscape(currentUrl?: string, userAgent?: string): void {
  // Best-effort automatic escape. Apps reported by needsUserGesture() drop or
  // hang on scheme redirects without user activation — Facebook iOS 555+ hangs
  // on x-safari-* location.href (#2). Skip auto-navigation there; callers must
  // pair with a user-tap UI (e.g. EiabEscapeDialog).
  //
  // Twitter/X iOS (11.42+) is a WKWebView, not SFSafariViewController.
  // x-safari-* is dispatched below the WebView navigation delegate, so
  // auto location.href is the same path that works for TikTok and other
  // non-Meta IABs. Gating it made attemptEscape() a no-op — the advertised
  // vanilla API never escaped X.
  if (needsUserGesture(userAgent)) {
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
