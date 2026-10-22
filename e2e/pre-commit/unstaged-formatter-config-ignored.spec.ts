import { expect } from "@playwright/test"
import { test } from "./clone"

test("an unstaged formatter config edit does not shape the committed formatting", async ({
  makeClone,
}) => {
  const clone = await makeClone()
  const config = clone.read("biome.jsonc")
  expect(config).toContain('"semicolons": "asNeeded"')
  clone.write(
    "biome.jsonc",
    config.replace('"semicolons": "asNeeded"', '"semicolons": "always"')
  )
  clone.write("packages/eiab/src/qa-semi.ts", "export const qaSemi   =   1\n")
  await clone.git("add", "packages/eiab/src/qa-semi.ts")

  const result = await clone.commit("-m", "format with committed config")

  expect(result.status, result.output).toBe(0)
  expect(await clone.show("packages/eiab/src/qa-semi.ts")).toBe(
    "export const qaSemi = 1\n"
  )
  expect(await clone.status()).toContain(" M biome.jsonc")
  expect(clone.read("biome.jsonc")).toContain('"semicolons": "always"')
})
