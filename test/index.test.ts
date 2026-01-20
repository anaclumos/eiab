import { describe, expect, it } from "bun:test"

import { attemptEscape, getEscapeUrl, isInAppBrowser } from "../src/index"

const HTTPS_URL = "https://example.com/path?foo=1"
const HTTP_URL = "http://example.com/path?foo=1"

const IOS_15_UA =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 15_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Instagram"
const IOS_16_UA =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 16_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 FBAN/FBIOS"
const IOS_17_UA =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 inapp"
const IOS_18_UA =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Twitter"

const ANDROID_INAPP_UA =
  "Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Mobile Safari/537.36 FB_IAB/FB4A"

const KAKAOTALK_IOS_UA =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 kakaotalk"

const LINE_ANDROID_UA =
  "Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Mobile Safari/537.36 line/13.0"

describe("isInAppBrowser", () => {
  it("detects a variety of in-app browsers", () => {
    const samples: Array<[string, string]> = [
      ["KakaoTalk", KAKAOTALK_IOS_UA],
      ["LINE", LINE_ANDROID_UA],
      ["Instagram", IOS_15_UA],
      ["Facebook iOS", IOS_16_UA],
      ["Generic inapp", IOS_17_UA],
      ["Twitter", IOS_18_UA],
      ["Facebook Android", ANDROID_INAPP_UA],
      ["Naver", "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) naver"],
      [
        "Snapchat",
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) Snapchat",
      ],
      [
        "WhatsApp",
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) WhatsApp",
      ],
      [
        "KakaoStory",
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) kakaostory",
      ],
      ["Band", "Mozilla/5.0 (Android 13) band"],
      ["DaumApps", "Mozilla/5.0 (Android 13) daumapps"],
      ["Trill", "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) Trill"],
      ["Electron", "Mozilla/5.0 (X11; Linux x86_64) electron"],
      ["Wadiz", "Mozilla/5.0 (Android 13) wadiz"],
      ["ZumApp", "Mozilla/5.0 (Android 13) zumapp"],
      ["AliApp", "Mozilla/5.0 (Android 13) aliapp"],
      ["Everytime", "Mozilla/5.0 (Android 13) everytimeapp"],
      ["Thunderbird", "Mozilla/5.0 (Android 13) thunderbird"],
      ["Wirtschaftswoche", "Mozilla/5.0 (Android 13) wirtschaftswoche"],
      ["DaumDevice", "Mozilla/5.0 (Android 13) daumdevice/mobile"],
      ["FB iab lowercase", "Mozilla/5.0 (Android 13) fb_iab"],
      ["FB4A", "Mozilla/5.0 (Android 13) fb4a"],
      ["FBAN", "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) fban"],
      ["FBIOS", "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) fbios"],
      ["FBSS", "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) fbss"],
    ]

    for (const [, userAgent] of samples) {
      expect(isInAppBrowser(userAgent)).toBe(true)
    }

    expect(
      isInAppBrowser(
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) Safari"
      )
    ).toBe(false)
  })

  it("reads navigator.userAgent when omitted", () => {
    const originalNavigator = globalThis.navigator
    globalThis.navigator = { userAgent: IOS_15_UA } as any
    expect(isInAppBrowser()).toBe(true)
    globalThis.navigator = originalNavigator
  })
})

describe("getEscapeUrl", () => {
  it("uses KakaoTalk openExternal scheme", () => {
    expect(getEscapeUrl(HTTPS_URL, KAKAOTALK_IOS_UA)).toBe(
      `kakaotalk://web/openExternal?url=${encodeURIComponent(HTTPS_URL)}`
    )
  })

  it("adds LINE openExternalBrowser query param", () => {
    expect(getEscapeUrl(HTTPS_URL, LINE_ANDROID_UA)).toBe(
      "https://example.com/path?foo=1&openExternalBrowser=1"
    )
    expect(getEscapeUrl("https://example.com/path", LINE_ANDROID_UA)).toBe(
      "https://example.com/path?openExternalBrowser=1"
    )
  })

  it("generates Android Chrome intent URLs", () => {
    expect(getEscapeUrl(HTTPS_URL, ANDROID_INAPP_UA)).toBe(
      "intent://example.com/path?foo=1#Intent;scheme=https;package=com.android.chrome;end"
    )
  })

  it("uses x-safari-https for all iOS versions including iOS 16", () => {
    expect(getEscapeUrl(HTTPS_URL, IOS_15_UA)).toBe(
      "x-safari-https://example.com/path?foo=1"
    )
    expect(getEscapeUrl(HTTPS_URL, IOS_16_UA)).toBe(
      "x-safari-https://example.com/path?foo=1"
    )
    expect(getEscapeUrl(HTTPS_URL, IOS_17_UA)).toBe(
      "x-safari-https://example.com/path?foo=1"
    )
    expect(getEscapeUrl(HTTPS_URL, IOS_18_UA)).toBe(
      "x-safari-https://example.com/path?foo=1"
    )
  })

  it("uses x-safari-http for all iOS versions including iOS 16", () => {
    expect(getEscapeUrl(HTTP_URL, IOS_15_UA)).toBe(
      "x-safari-http://example.com/path?foo=1"
    )
    expect(getEscapeUrl(HTTP_URL, IOS_16_UA)).toBe(
      "x-safari-http://example.com/path?foo=1"
    )
    expect(getEscapeUrl(HTTP_URL, IOS_17_UA)).toBe(
      "x-safari-http://example.com/path?foo=1"
    )
    expect(getEscapeUrl(HTTP_URL, IOS_18_UA)).toBe(
      "x-safari-http://example.com/path?foo=1"
    )
  })

  it("returns null when not in-app", () => {
    expect(
      getEscapeUrl(
        HTTPS_URL,
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) Safari"
      )
    ).toBeNull()
  })

  it("returns null on missing inputs", () => {
    expect(getEscapeUrl(undefined, undefined)).toBeNull()
  })

  it("reads location.href when omitted", () => {
    const originalLocation = globalThis.location
    const originalNavigator = globalThis.navigator
    globalThis.location = { href: HTTPS_URL } as any
    globalThis.navigator = { userAgent: IOS_17_UA } as any
    expect(getEscapeUrl()).toBe("x-safari-https://example.com/path?foo=1")
    globalThis.location = originalLocation
    globalThis.navigator = originalNavigator
  })
})

describe("attemptEscape", () => {
  it("writes to global location when window is unavailable", () => {
    const stubLocation = { href: HTTPS_URL }
    const originalWindow = globalThis.window
    const originalLocation = globalThis.location

    ;(globalThis as any).window = undefined
    globalThis.location = stubLocation as any

    attemptEscape(HTTPS_URL, IOS_17_UA)
    expect(stubLocation.href).toBe("x-safari-https://example.com/path?foo=1")

    ;(globalThis as any).window = originalWindow
    globalThis.location = originalLocation
  })
})
