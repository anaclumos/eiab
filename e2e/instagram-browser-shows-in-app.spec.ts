import { expect } from "@playwright/test"
import { test } from "./test-page"

// Expected: opened from Instagram's iPhone in-app browser, the page loads and shows in-app.
test.use({
  userAgent:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Instagram 334.0.4.32.98 (iPhone15,3; iOS 17_5; en_US; en; scale=3.00; 1290x2796; 604155400)",
})

test("the Instagram in-app browser is shown as in-app", async ({ page }) => {
  await page.goto("/")
  await expect(page.getByTestId("status")).toHaveText("in-app")
})
