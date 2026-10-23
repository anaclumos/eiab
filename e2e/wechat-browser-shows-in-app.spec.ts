import { expect } from "@playwright/test"
import { test } from "./test-page"

// Expected: opened from WeChat's iPhone in-app browser, the page loads and shows in-app.
test.use({
  userAgent:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 MicroMessenger/8.0.49(0x18003137) NetType/WIFI Language/zh_CN",
})

test("the WeChat in-app browser is shown as in-app", async ({ page }) => {
  await page.goto("/")
  await expect(page.getByTestId("status")).toHaveText("in-app")
})
