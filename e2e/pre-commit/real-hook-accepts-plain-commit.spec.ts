import { expect } from "@playwright/test"
import { test } from "./clone"

test("the real hook accepts a plain text commit and it lands", async ({
  makeClone,
}) => {
  const clone = await makeClone()
  const before = await clone.head()
  clone.write("qa-plain-note.txt", "plain words\n")
  await clone.git("add", "qa-plain-note.txt")
  const result = await clone.commit("-m", "add a plain note")
  expect(result.status, result.output).toBe(0)
  expect(await clone.head()).not.toBe(before)
  expect(await clone.show("qa-plain-note.txt")).toBe("plain words\n")
  expect(await clone.status()).toEqual([])
})
