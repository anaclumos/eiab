import { expect } from "@playwright/test"
import { test } from "./clone"

test("a staged lint error refuses the commit and stays staged", async ({
  makeClone,
}) => {
  const clone = await makeClone()
  const before = await clone.head()
  clone.append("packages/eiab/src/index.ts", "\nexport const qaAny: any = 1\n")
  await clone.git("add", "packages/eiab/src/index.ts")

  const result = await clone.commit("-m", "lint error")

  expect(result.status, result.output).not.toBe(0)
  expect(result.output).toContain("noExplicitAny")
  expect(await clone.head()).toBe(before)
  expect(await clone.staged()).toEqual(["packages/eiab/src/index.ts"])
  expect((await clone.git("diff", "--cached")).output).toContain("qaAny")
})
