import { expect } from "@playwright/test"
import { test } from "./clone"

test("a staged type error refuses the commit and stays staged", async ({
  makeClone,
}) => {
  const clone = await makeClone()
  const before = await clone.head()
  clone.append(
    "packages/eiab/src/index.ts",
    '\nexport const qaBad: number = "not a number"\n'
  )
  await clone.git("add", "packages/eiab/src/index.ts")

  const result = await clone.commit("-m", "type error")

  expect(result.status, result.output).not.toBe(0)
  expect(result.output).toContain("TS2322")
  expect(await clone.head()).toBe(before)
  expect(await clone.staged()).toEqual(["packages/eiab/src/index.ts"])
  expect((await clone.git("diff", "--cached")).output).toContain("qaBad")
})
