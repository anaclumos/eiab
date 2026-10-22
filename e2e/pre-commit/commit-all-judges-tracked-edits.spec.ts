import { expect } from "@playwright/test"
import { test } from "./clone"

test("git commit -a is refused for a tracked type error and passes once it is fixed", async ({
  makeClone,
}) => {
  const path = "packages/eiab/src/index.ts"
  const clone = await makeClone()
  const before = await clone.head()
  const original = clone.read(path)
  clone.write(
    path,
    `${original}\nexport const qaAll: number = "not a number"\n`
  )

  const refused = await clone.commit("-a", "-m", "commit all with error")

  expect(refused.status, refused.output).not.toBe(0)
  expect(refused.output).toContain("TS2322")
  expect(await clone.head()).toBe(before)
  expect(await clone.show(path)).not.toContain("qaAll")

  clone.write(path, `${original}\nexport const qaAll = 1\n`)
  const accepted = await clone.commit("-a", "-m", "commit all fixed")

  expect(accepted.status, accepted.output).toBe(0)
  expect(await clone.show(path)).toContain("export const qaAll = 1")
  expect(await clone.status()).toEqual([])
})
