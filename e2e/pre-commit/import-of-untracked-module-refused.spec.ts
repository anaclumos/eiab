import { expect } from "@playwright/test"
import { test } from "./clone"

test("a staged import of a module that exists only untracked is refused", async ({
  makeClone,
}) => {
  const clone = await makeClone()
  const before = await clone.head()
  clone.write("packages/eiab/src/qa-helper.ts", "export const qaHelper = 1\n")
  clone.write(
    "packages/eiab/src/qa-user.ts",
    'import { qaHelper } from "./qa-helper"\n\nexport const qaUser = qaHelper + 1\n'
  )
  await clone.git("add", "packages/eiab/src/qa-user.ts")

  const result = await clone.commit("-m", "import untracked module")

  expect(result.status, result.output).not.toBe(0)
  expect(result.output).toContain("TS2307")
  expect(await clone.head()).toBe(before)
  expect(await clone.staged()).toEqual(["packages/eiab/src/qa-user.ts"])
  expect(await clone.status()).toContain("?? packages/eiab/src/qa-helper.ts")
})
