import { expect, test } from "@playwright/test"

const INSTAGRAM_IOS_UA =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 15_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Instagram"
const SAFARI_UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15"
const KAKAOTALK_UA =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 kakaotalk"
const FACEBOOK_ANDROID_UA =
  "Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Mobile Safari/537.36 FB_IAB/FB4A"

test.describe("Normal browser", () => {
  test.use({ userAgent: SAFARI_UA })

  test("shows success message", async ({ page }) => {
    await page.goto("/")
    await expect(page.getByTestId("status")).toHaveText("normal")
    await expect(page.getByTestId("success")).toBeVisible()
    await expect(page.getByTestId("failed")).not.toBeVisible()
  })

  test("does not redirect", async ({ page }) => {
    await page.goto("/")
    await page.waitForTimeout(500)
    expect(page.url()).toBe("http://localhost:3000/")
  })
})

test.describe("Instagram in-app browser (iOS)", () => {
  test.use({ userAgent: INSTAGRAM_IOS_UA })

  test("shows failed message", async ({ page }) => {
    await page.goto("/")
    await expect(page.getByTestId("status")).toHaveText("in-app")
    await expect(page.getByTestId("failed")).toBeVisible()
    await expect(page.getByTestId("success")).not.toBeVisible()
  })
})

test.describe("KakaoTalk in-app browser", () => {
  test.use({ userAgent: KAKAOTALK_UA })

  test("detects as in-app browser", async ({ page }) => {
    await page.goto("/")
    await expect(page.getByTestId("status")).toHaveText("in-app")
    await expect(page.getByTestId("failed")).toBeVisible()
  })
})

test.describe("Facebook in-app browser (Android)", () => {
  test.use({ userAgent: FACEBOOK_ANDROID_UA })

  test("detects as in-app browser", async ({ page }) => {
    await page.goto("/")
    await expect(page.getByTestId("status")).toHaveText("in-app")
    await expect(page.getByTestId("failed")).toBeVisible()
  })
})

test.describe("User agent detection edge cases", () => {
  test("detects various in-app browsers", async ({ browser }) => {
    const inAppUAs = [
      "Mozilla/5.0 (iPhone) naver",
      "Mozilla/5.0 (Android) snapchat",
      "Mozilla/5.0 (iPhone) WhatsApp",
      "Mozilla/5.0 (Android) line/13.0",
      "Mozilla/5.0 (X11; Linux x86_64) electron",
      "Mozilla/5.0 (iPhone) Twitter",
    ]

    for (const ua of inAppUAs) {
      const context = await browser.newContext({ userAgent: ua })
      const page = await context.newPage()
      await page.goto("http://localhost:3000/")
      await expect(page.getByTestId("status")).toHaveText("in-app")
      await context.close()
    }
  })
})
