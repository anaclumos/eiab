import { expect, test } from "@playwright/test"
import { COMMIT_TEST_TIMEOUT, makeClone } from "./clone"

test("only the staged part of a file is committed, and the unstaged edit stays", () => {
  test.setTimeout(COMMIT_TEST_TIMEOUT)
  const path = "packages/eiab/src/index.ts"
  const clone = makeClone()
  try {
    clone.append(path, "\nexport const qaStaged   =   1\n")
    clone.git("add", path)
    clone.append(path, "\nexport const qaUnstaged = 2\n")

    const result = clone.commit("-m", "partial")

    expect(result.status, result.output).toBe(0)
    const committed = clone.show(path)
    expect(committed).toContain("export const qaStaged = 1\n")
    expect(committed).not.toContain("qaStaged   =")
    expect(committed).not.toContain("qaUnstaged")
    expect(clone.read(path)).toContain("export const qaUnstaged = 2")
    expect(clone.status()).toEqual([` M ${path}`])
  } finally {
    clone.remove()
  }
})
