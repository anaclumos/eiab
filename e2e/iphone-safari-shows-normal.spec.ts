import { expect } from "@playwright/test"
import { test } from "./test-page"

// Expected: opened in plain iPhone Safari, an ordinary mobile browser, the page loads and shows normal, not in-app.
test.use({
  userAgent:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1",
})

test("iPhone Safari is shown as normal", async ({ page }) => {
  await page.goto("/")
  await expect(page.getByTestId("status")).toHaveText("normal")
})
