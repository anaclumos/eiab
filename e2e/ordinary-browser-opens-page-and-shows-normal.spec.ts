import { expect } from "@playwright/test"
import { test } from "./test-page"

// Expected: in an ordinary desktop Chrome, opening the test page succeeds
// with no connection error, answers with an OK response, and shows `normal`.
test("an ordinary desktop browser opens the page and is shown as normal", async ({
  page,
}) => {
  const response = await page.goto("/")
  expect(response?.ok()).toBe(true)
  await expect(page.getByTestId("status")).toHaveText("normal")
})
