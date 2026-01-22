import { describe, expect, it } from "bun:test"

import { attemptEscape, getEscapeUrl, isInAppBrowser } from "../src/index"

const HTTPS_URL = "https://example.com/path?foo=1"
const HTTP_URL = "http://example.com/path?foo=1"

// Facebook - iOS
const FACEBOOK_IOS_UA =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/22B83 [FBAN/FBIOS;FBAV/488.0.0.68.101;FBBV/658219612;FBDV/iPhone12,8;FBMD/iPhone;FBSN/iOS;FBSV/18.1;FBSS/2;FBID/phone;FBLC/en_US;FBOP/5;FBRV/0;IABMV/1]"

// Facebook - Android
const FACEBOOK_ANDROID_UA =
  "Mozilla/5.0 (Linux; Android 14; Pixel 8 Build/AP2A.240905.003; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/130.0.6723.83 Mobile Safari/537.36 [FB_IAB/FB4A;FBAV/488.0.0.62.79;IABMV/1;]"

// Google Search App - iOS
const GSA_IOS_UA =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) GSA/334.0.674067880 Mobile/15E148 Safari/604.1"

// Instagram - iOS
const INSTAGRAM_IOS_UA =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/22B83 Instagram 354.0.0.29.90 (iPhone12,8; iOS 18_1; en_US; en; scale=2.00; 750x1334; 654111336; IABMV/1)"

// Instagram - Android
const INSTAGRAM_ANDROID_UA =
  "Mozilla/5.0 (Linux; Android 14; Pixel 8 Build/AP2A.240905.003; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/130.0.6723.58 Mobile Safari/537.36 Instagram 355.1.0.44.103 Android (34/14; 420dpi; 1080x2205; Google/google; Pixel 8; shiba; shiba; en_US; 658190016)"

// LINE - iOS
const LINE_IOS_UA =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 10_2_1 like Mac OS X) AppleWebKit/602.4.6 (KHTML, like Gecko) Mobile/14D27 Safari Line/7.3.2"

// LINE - Android
const LINE_ANDROID_UA =
  "Mozilla/5.0 (Linux; Android 6.0.1; D6653 Build/23.5.A.0.575; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/58.0.3029.83 Mobile Safari/537.36 Line/7.4.0/IAB"

// LinkedIn - iOS
const LINKEDIN_IOS_UA =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 [LinkedInApp]/9.30.1753"

// Messenger - iOS
const MESSENGER_IOS_UA =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 [FBAN/FBIOS;FBAV/482.2.0.68.110;FBBV/658316928;FBDV/iPhone12,8;FBMD/iPhone;FBSN/iOS;FBSV/18.1;FBSS/2;FBCR/;FBID/phone;FBLC/en_US;FBOP/80]"

// Messenger - Android
const MESSENGER_ANDROID_UA =
  "Mozilla/5.0 (Linux; Android 14; Pixel 8 Build/AP2A.240905.003; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/130.0.6723.58 Mobile Safari/537.36 [FB_IAB/FB4A;FBAV/482.0.0.71.108;]"

// Snapchat - iOS
const SNAPCHAT_IOS_UA =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_3_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.3.1 Mobile/15E148 Snapchat/12.72.0.39 (like Safari/8617.2.4.10.8, panda)"

// Threads - iOS
const THREADS_IOS_UA =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/23D5103d Barcelona 413.1.0.23.79 (iPhone18,1; iOS 26_3; en_US; en; scale=3.00; 1206x2622; IABMV/1; 865807478)"

// Threads - Android
const THREADS_ANDROID_UA =
  "Mozilla/5.0 (Linux; Android 14; Pixel 8 Build/AP2A.240905.003; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/130.0.6723.58 Mobile Safari/537.36 Barcelona 355.0.0.39.109 Android (34/14; 420dpi; 1080x2205; Google/google; Pixel 8; shiba; shiba; en_US; 657318936)"

// TikTok - iOS
const TIKTOK_IOS_UA =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_3_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 BytedanceWebview/d8a21c6 musical_ly_33.2.1 JsSdk/2.0 NetType/WIFI Channel/App Store ByteLocale/en Region/US FalconTag/BDB55B46-0286-4504-847E-C8300CB9F79D"

// TikTok - Android
const TIKTOK_ANDROID_UA =
  "Mozilla/5.0 (Linux; Android 14; Pixel 8 Build/UQ1A.240105.004; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/121.0.6167.143 Mobile Safari/537.36 musical_ly_2023303040 JsSdk/1.0 NetType/WIFI Channel/googleplay AppName/musical_ly app_version/33.3.4 ByteLocale/en ByteFullLocale/en Region/US AppId/1233 Spark/1.5.0.5-alpha.2 AppVersion/33.3.4 BytedanceWebview/d8a21c6"

// Twitter - iOS
const TWITTER_IOS_UA =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 26_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/23D5103d Twitter for iPhone/11.57"

// WeChat - iOS
const WECHAT_IOS_UA =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 10_2_1 like Mac OS X) AppleWebKit/602.4.6 (KHTML, like Gecko) Mobile/14D27 MicroMessenger/6.5.8 NetType/WIFI Language/zh_CN"

// WeChat - Android
const WECHAT_ANDROID_UA =
  "Mozilla/5.0 (Linux; Android 6.0.1; SM-N9208 Build/MMB29K; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/58.0.3029.83 Mobile Safari/537.36 MicroMessenger/6.5.7.1041 NetType/WIFI Language/zh_TW"

// WhatsApp - iOS (new format)
const WHATSAPP_IOS_UA =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 26_0_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.0.1 Mobile/15E148 Safari/604.1 [WAiOS/2.25.31]"

// WhatsApp - Android (new format)
const WHATSAPP_ANDROID_UA =
  "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.7390.124 Mobile Safari/537.36 [WA4A/2.25.32.75;]"

// KakaoTalk - iOS
const KAKAOTALK_IOS_UA =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 KAKAOTALK 10.0.0"

// Generic in-app pattern
const GENERIC_INAPP_UA =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 inapp"

describe("isInAppBrowser", () => {
  it("detects all 13 supported apps", () => {
    const samples: [string, string][] = [
      ["Facebook iOS", FACEBOOK_IOS_UA],
      ["Facebook Android", FACEBOOK_ANDROID_UA],
      ["Google Search App", GSA_IOS_UA],
      ["Instagram iOS", INSTAGRAM_IOS_UA],
      ["Instagram Android", INSTAGRAM_ANDROID_UA],
      ["LINE iOS", LINE_IOS_UA],
      ["LINE Android", LINE_ANDROID_UA],
      ["LinkedIn iOS", LINKEDIN_IOS_UA],
      ["Messenger iOS", MESSENGER_IOS_UA],
      ["Messenger Android", MESSENGER_ANDROID_UA],
      ["Snapchat iOS", SNAPCHAT_IOS_UA],
      ["Threads iOS", THREADS_IOS_UA],
      ["Threads Android", THREADS_ANDROID_UA],
      ["TikTok iOS", TIKTOK_IOS_UA],
      ["TikTok Android", TIKTOK_ANDROID_UA],
      ["Twitter iOS", TWITTER_IOS_UA],
      ["WeChat iOS", WECHAT_IOS_UA],
      ["WeChat Android", WECHAT_ANDROID_UA],
      ["WhatsApp iOS", WHATSAPP_IOS_UA],
      ["WhatsApp Android", WHATSAPP_ANDROID_UA],
      ["KakaoTalk iOS", KAKAOTALK_IOS_UA],
      ["Generic inapp", GENERIC_INAPP_UA],
    ]

    for (const [, userAgent] of samples) {
      expect(isInAppBrowser(userAgent)).toBe(true)
    }
  })

  it("detects additional in-app patterns", () => {
    const samples: [string, string][] = [
      ["Naver", "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) naver"],
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
    ]

    for (const [, userAgent] of samples) {
      expect(isInAppBrowser(userAgent)).toBe(true)
    }
  })

  it("returns false for normal browsers", () => {
    expect(
      isInAppBrowser(
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) Safari"
      )
    ).toBe(false)
  })

  it("reads navigator.userAgent when omitted", () => {
    const originalNavigator = globalThis.navigator
    globalThis.navigator = { userAgent: INSTAGRAM_IOS_UA } as any
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
    expect(getEscapeUrl(HTTPS_URL, FACEBOOK_ANDROID_UA)).toBe(
      "intent://example.com/path?foo=1#Intent;scheme=https;package=com.android.chrome;end"
    )
    expect(getEscapeUrl(HTTPS_URL, INSTAGRAM_ANDROID_UA)).toBe(
      "intent://example.com/path?foo=1#Intent;scheme=https;package=com.android.chrome;end"
    )
  })

  it("uses x-safari-https for iOS in-app browsers", () => {
    expect(getEscapeUrl(HTTPS_URL, INSTAGRAM_IOS_UA)).toBe(
      "x-safari-https://example.com/path?foo=1"
    )
    expect(getEscapeUrl(HTTPS_URL, FACEBOOK_IOS_UA)).toBe(
      "x-safari-https://example.com/path?foo=1"
    )
    expect(getEscapeUrl(HTTPS_URL, TWITTER_IOS_UA)).toBe(
      "x-safari-https://example.com/path?foo=1"
    )
    expect(getEscapeUrl(HTTPS_URL, THREADS_IOS_UA)).toBe(
      "x-safari-https://example.com/path?foo=1"
    )
    expect(getEscapeUrl(HTTPS_URL, TIKTOK_IOS_UA)).toBe(
      "x-safari-https://example.com/path?foo=1"
    )
    expect(getEscapeUrl(HTTPS_URL, SNAPCHAT_IOS_UA)).toBe(
      "x-safari-https://example.com/path?foo=1"
    )
    expect(getEscapeUrl(HTTPS_URL, WECHAT_IOS_UA)).toBe(
      "x-safari-https://example.com/path?foo=1"
    )
    expect(getEscapeUrl(HTTPS_URL, WHATSAPP_IOS_UA)).toBe(
      "x-safari-https://example.com/path?foo=1"
    )
    expect(getEscapeUrl(HTTPS_URL, MESSENGER_IOS_UA)).toBe(
      "x-safari-https://example.com/path?foo=1"
    )
    expect(getEscapeUrl(HTTPS_URL, LINKEDIN_IOS_UA)).toBe(
      "x-safari-https://example.com/path?foo=1"
    )
    expect(getEscapeUrl(HTTPS_URL, GSA_IOS_UA)).toBe(
      "x-safari-https://example.com/path?foo=1"
    )
  })

  it("uses x-safari-http for iOS in-app browsers", () => {
    expect(getEscapeUrl(HTTP_URL, INSTAGRAM_IOS_UA)).toBe(
      "x-safari-http://example.com/path?foo=1"
    )
    expect(getEscapeUrl(HTTP_URL, TWITTER_IOS_UA)).toBe(
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
    globalThis.navigator = { userAgent: GENERIC_INAPP_UA } as any
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

    attemptEscape(HTTPS_URL, GENERIC_INAPP_UA)
    expect(stubLocation.href).toBe("x-safari-https://example.com/path?foo=1")

    ;(globalThis as any).window = originalWindow
    globalThis.location = originalLocation
  })
})
