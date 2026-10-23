import { expect } from "@playwright/test"
import { test } from "./test-page"

// Expected: opened in a generic Android WebView (the 'wv' marker), the page loads and shows in-app.
test.use({
  userAgent:
    "Mozilla/5.0 (Linux; Android 14; Pixel 8 Build/AP1A.240505.005; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/125.0.6422.165 Mobile Safari/537.36",
})

test("an Android WebView is shown as in-app", async ({ page }) => {
  await page.goto("/")
  await expect(page.getByTestId("status")).toHaveText("in-app")
})
