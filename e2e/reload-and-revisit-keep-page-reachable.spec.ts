import { expect } from "@playwright/test"
import { test } from "./test-page"

// Expected: opening the page, reloading it, and opening it again in the same
// test each succeed with an OK response and no connection error, and the page
// shows `normal` every time.
test("reloading and revisiting the page keeps it reachable", async ({
  page,
}) => {
  const status = page.getByTestId("status")

  const first = await page.goto("/")
  expect(first?.ok()).toBe(true)
  await expect(status).toHaveText("normal")

  const reloaded = await page.reload()
  expect(reloaded?.ok()).toBe(true)
  await expect(status).toHaveText("normal")

  await page.goto("about:blank")
  await expect(status).toHaveCount(0)
  const revisited = await page.goto("/")
  expect(revisited?.ok()).toBe(true)
  await expect(status).toHaveText("normal")
})
