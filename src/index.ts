const KAKAOTALK_REGEX = /(?:iphone|ipad|android).* kakaotalk/i
const LINE_REGEX = /(?:iphone|ipad|android).* line\//i
const INAPP_REGEX =
  /inapp|naver|snapchat|wirtschaftswoche|thunderbird|instagram|everytimeapp|whatsapp|electron|wadiz|aliapp|zumapp|kakaostory|band|twitter|daumapps|daumdevice\/mobile|fb_iab|fb4a|fban|fbios|fbss|trill/i
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

function toAndroidChromeIntent(url: string): string | null {
  try {
    const parsed = new URL(url)

    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return null
    }

    const scheme = parsed.protocol.slice(0, -1)
    return `intent://${parsed.host}${parsed.pathname}${parsed.search}#Intent;scheme=${scheme};package=com.android.chrome;end`
  } catch {
    return null
  }
}

export function isInAppBrowser(userAgent?: string): boolean {
  const ua = userAgent ?? getDefaultUserAgent() ?? ""
  return KAKAOTALK_REGEX.test(ua) || LINE_REGEX.test(ua) || INAPP_REGEX.test(ua)
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
  if (!isInAppBrowser(ua)) {
    return null
  }

  if (KAKAOTALK_REGEX.test(ua)) {
    return `kakaotalk://web/openExternal?url=${encodeURIComponent(url)}`
  }

  if (LINE_REGEX.test(ua)) {
    return addQueryParam(url, "openExternalBrowser", "1")
  }

  if (isAndroid(ua)) {
    return toAndroidChromeIntent(url)
  }

  if (isIOS(ua)) {
    return (
      replaceScheme(url, "https://", "x-safari-https://") ??
      replaceScheme(url, "http://", "x-safari-http://")
    )
  }

  return null
}

export function attemptEscape(currentUrl?: string, userAgent?: string): void {
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
