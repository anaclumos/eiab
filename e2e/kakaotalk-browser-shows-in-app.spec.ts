import { expect } from "@playwright/test"
import { test } from "./test-page"

// Expected: opened from KakaoTalk's Android in-app browser, the page loads and shows in-app.
test.use({
  userAgent:
    "Mozilla/5.0 (Linux; Android 14; SM-S918N Build/UP1A.231005.007; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/125.0.6422.165 Mobile Safari/537.36 KAKAOTALK/10.8.1",
})

test("the KakaoTalk in-app browser is shown as in-app", async ({ page }) => {
  await page.goto("/")
  await expect(page.getByTestId("status")).toHaveText("in-app")
})
