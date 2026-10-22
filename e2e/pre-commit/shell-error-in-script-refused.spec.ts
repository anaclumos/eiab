import { expect } from "@playwright/test"
import { test } from "./clone"

const SCRIPT = "scripts/pre-commit.sh"
const INDEX = "packages/eiab/src/index.ts"
const BEFORE_LINE = 'cd "$snapshot"\n'

const SHELL_ERRORS = [
  { kind: "a syntax error", line: "if then fi (" },
  { kind: "an unbound variable", line: 'cd "$snapshto"' },
]

for (const { kind, line } of SHELL_ERRORS) {
  test(`${kind} in the staged pre-commit script refuses the commit`, async ({
    makeClone,
  }) => {
    const clone = await makeClone()
    const before = await clone.head()
    const script = clone.read(SCRIPT)
    expect(script).toContain(BEFORE_LINE)
    clone.write(SCRIPT, script.replace(BEFORE_LINE, `${line}\n${BEFORE_LINE}`))
    clone.append(INDEX, '\nexport const qaBad: number = "not a number"\n')
    await clone.git("add", SCRIPT, INDEX)

    const result = await clone.commit("-m", kind)

    expect(result.status, result.output).not.toBe(0)
    expect(await clone.head()).toBe(before)
    expect(await clone.staged()).toEqual([INDEX, SCRIPT])
  })
}
