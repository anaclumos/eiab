import { expect } from "@playwright/test"
import { test } from "./clone"

test("only the staged part of a file is committed, and the unstaged edit stays", async ({
  makeClone,
}) => {
  const path = "packages/eiab/src/index.ts"
  const clone = await makeClone()
  clone.append(path, "\nexport const qaStaged   =   1\n")
  await clone.git("add", path)
  clone.append(path, "\nexport const qaUnstaged = 2\n")

  const result = await clone.commit("-m", "partial")

  expect(result.status, result.output).toBe(0)
  const committed = await clone.show(path)
  expect(committed).toContain("export const qaStaged = 1\n")
  expect(committed).not.toContain("qaStaged   =")
  expect(committed).not.toContain("qaUnstaged")
  expect(clone.read(path)).toContain("export const qaUnstaged = 2")
  expect(await clone.status()).toEqual([` M ${path}`])
})
