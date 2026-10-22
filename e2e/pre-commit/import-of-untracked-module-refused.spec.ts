import { expect, test } from "@playwright/test"
import { COMMIT_TEST_TIMEOUT, makeClone } from "./clone"

test("a staged import of a module that exists only untracked is refused", () => {
  test.setTimeout(COMMIT_TEST_TIMEOUT)
  const clone = makeClone()
  try {
    const before = clone.head()
    clone.write("packages/eiab/src/qa-helper.ts", "export const qaHelper = 1\n")
    clone.write(
      "packages/eiab/src/qa-user.ts",
      'import { qaHelper } from "./qa-helper"\n\nexport const qaUser = qaHelper + 1\n'
    )
    clone.git("add", "packages/eiab/src/qa-user.ts")

    const result = clone.commit("-m", "import untracked module")

    expect(result.status, result.output).not.toBe(0)
    expect(result.output).toContain("TS2307")
    expect(clone.head()).toBe(before)
    expect(clone.staged()).toEqual(["packages/eiab/src/qa-user.ts"])
    expect(clone.status()).toContain("?? packages/eiab/src/qa-helper.ts")
  } finally {
    clone.remove()
  }
})
