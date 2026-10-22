import { expect, test } from "@playwright/test"
import { COMMIT_TEST_TIMEOUT, makeClone } from "./clone"

test("an unstaged formatter config edit does not shape the committed formatting", () => {
  test.setTimeout(COMMIT_TEST_TIMEOUT)
  const clone = makeClone()
  try {
    const config = clone.read("biome.jsonc")
    expect(config).toContain('"semicolons": "asNeeded"')
    clone.write(
      "biome.jsonc",
      config.replace('"semicolons": "asNeeded"', '"semicolons": "always"')
    )
    clone.write("packages/eiab/src/qa-semi.ts", "export const qaSemi   =   1\n")
    clone.git("add", "packages/eiab/src/qa-semi.ts")

    const result = clone.commit("-m", "format with committed config")

    expect(result.status, result.output).toBe(0)
    expect(clone.show("packages/eiab/src/qa-semi.ts")).toBe(
      "export const qaSemi = 1\n"
    )
    expect(clone.status()).toContain(" M biome.jsonc")
    expect(clone.read("biome.jsonc")).toContain('"semicolons": "always"')
  } finally {
    clone.remove()
  }
})
