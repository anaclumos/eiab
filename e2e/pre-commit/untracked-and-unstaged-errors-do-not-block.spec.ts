import { expect, test } from "@playwright/test"
import { COMMIT_TEST_TIMEOUT, makeClone } from "./clone"

test("a good staged change commits in seconds despite broken files outside the commit", () => {
  test.setTimeout(COMMIT_TEST_TIMEOUT)
  const clone = makeClone()
  try {
    const before = clone.head()
    clone.append("apps/demo/lib/utils.ts", "\nexport const qaGoodChange = 1\n")
    clone.git("add", "apps/demo/lib/utils.ts")
    clone.write(
      "packages/eiab/src/qa-scratch.ts",
      'export const qaScratch: number = "not a number"\n'
    )
    clone.append(
      "packages/eiab/src/index.ts",
      '\nexport const qaUnstaged: number = "not a number"\n'
    )

    const result = clone.commit("-m", "good change")

    expect(result.status, result.output).toBe(0)
    expect(result.seconds).toBeLessThan(60)
    expect(clone.head()).not.toBe(before)
    expect(clone.show("apps/demo/lib/utils.ts")).toContain(
      "export const qaGoodChange = 1"
    )
    expect(clone.show("packages/eiab/src/index.ts")).not.toContain("qaUnstaged")
    expect(clone.status()).toEqual(
      expect.arrayContaining([
        " M packages/eiab/src/index.ts",
        "?? packages/eiab/src/qa-scratch.ts",
      ])
    )
    expect(clone.read("packages/eiab/src/index.ts")).toContain("qaUnstaged")
  } finally {
    clone.remove()
  }
})
