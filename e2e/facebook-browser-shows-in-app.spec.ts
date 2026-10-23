import { expect } from "@playwright/test"
import { test } from "./test-page"

// Expected: opened from Facebook's iPhone in-app browser, the page loads and shows in-app.
test.use({
  userAgent:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 [FBAN/FBIOS;FBAV/462.0.0.47.103;FBBV/593458745;FBDV/iPhone15,2;FBMD/iPhone;FBSN/iOS;FBSV/17.4;FBSS/3;FBID/phone;FBLC/en_US;FBOP/5]",
})

test("the Facebook in-app browser is shown as in-app", async ({ page }) => {
  await page.goto("/")
  await expect(page.getByTestId("status")).toHaveText("in-app")
})
