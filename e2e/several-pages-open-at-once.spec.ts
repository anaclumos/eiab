import { expect } from "@playwright/test"
import { test } from "./test-page"

// Expected: five tabs of one browser context opening the page at the same
// moment all load with an OK response and no connection error, and each shows
// `normal`.
test("several tabs opening the page at once all load it", async ({
  page,
  context,
}) => {
  const pages = [
    page,
    ...(await Promise.all(Array.from({ length: 4 }, () => context.newPage()))),
  ]

  const responses = await Promise.all(pages.map((p) => p.goto("/")))
  for (const response of responses) {
    expect(response?.ok()).toBe(true)
  }

  for (const p of pages) {
    await expect(p.getByTestId("status")).toHaveText("normal")
  }
})
