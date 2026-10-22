import { expect, test } from "@playwright/test"
import { COMMIT_TEST_TIMEOUT, makeClone } from "./clone"

test("a staged lint error refuses the commit and stays staged", () => {
  test.setTimeout(COMMIT_TEST_TIMEOUT)
  const clone = makeClone()
  try {
    const before = clone.head()
    clone.append(
      "packages/eiab/src/index.ts",
      "\nexport const qaAny: any = 1\n"
    )
    clone.git("add", "packages/eiab/src/index.ts")

    const result = clone.commit("-m", "lint error")

    expect(result.status, result.output).not.toBe(0)
    expect(result.output).toContain("noExplicitAny")
    expect(clone.head()).toBe(before)
    expect(clone.staged()).toEqual(["packages/eiab/src/index.ts"])
    expect(clone.git("diff", "--cached").output).toContain("qaAny")
  } finally {
    clone.remove()
  }
})
