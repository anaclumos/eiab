import { spawn } from "node:child_process"
import { mkdtempSync, rmSync, symlinkSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

const ROOT = join(__dirname, "..", "..")
export const FIXTURE = join(ROOT, "e2e", "pre-commit", "clone")
const PLAYWRIGHT = join(ROOT, "node_modules", ".bin", "playwright")
const DURATION = /\((\d+(?:\.\d+)?)(m?s)\)\s*$/
const COLOR = new RegExp(`${String.fromCharCode(27)}\\[[0-9;]*m`, "g")
export const TIMEOUT_ERROR = /Test timeout of \d+ ?ms exceeded\./

export const uniqueSleep = () =>
  `${4000 + Math.floor(Math.random() * 5000)}.${Math.floor(Math.random() * 1e6)}`

const run = (command: string, args: string[]) =>
  new Promise<{ code: number | null; output: string }>((resolve) => {
    const child = spawn(command, args)
    let output = ""
    child.stdout.on("data", (chunk) => {
      output += chunk
    })
    child.on("close", (code) => resolve({ code, output }))
  })

export const pids = async (pattern: string): Promise<number[]> => {
  const { output } = await run("pgrep", ["-f", pattern])
  return output
    .split("\n")
    .map((line) => Number(line.trim()))
    .filter((pid) => pid > 0)
}

const signal = (pid: number) => {
  try {
    process.kill(pid, "SIGKILL")
    return true
  } catch {
    return false
  }
}

export const killAll = (list: number[]) => list.map(signal)

export const makeInnerDir = () => {
  const dir = mkdtempSync(join(tmpdir(), "qa-inner-run-"))
  symlinkSync(join(ROOT, "node_modules"), join(dir, "node_modules"))
  return dir
}

export const removeInnerDir = (dir: string) =>
  rmSync(dir, { recursive: true, force: true })

export const runInner = (
  dir: string,
  specs: Record<string, string>,
  { workers = 1, deadlineMs }: { workers?: number; deadlineMs: number }
) => {
  writeFileSync(
    join(dir, "playwright.config.ts"),
    `export default { testDir: ".", reporter: "list", workers: ${workers}, fullyParallel: true }\n`
  )
  for (const [name, body] of Object.entries(specs)) {
    writeFileSync(join(dir, name), body)
  }
  const env = Object.fromEntries(
    Object.entries(process.env).filter(
      ([key]) => !(key.startsWith("TEST_") || key.startsWith("PW_"))
    )
  )
  return new Promise<{
    code: number | null
    output: string
    seconds: number
    killed: boolean
  }>((resolve) => {
    const started = Date.now()
    const child = spawn(
      PLAYWRIGHT,
      ["test", "-c", join(dir, "playwright.config.ts")],
      { cwd: dir, env, detached: true }
    )
    let output = ""
    let killed = false
    child.stdout.on("data", (chunk) => {
      output += chunk
    })
    child.stderr.on("data", (chunk) => {
      output += chunk
    })
    const timer = setTimeout(() => {
      killed = true
      if (child.pid) {
        signal(-child.pid)
      }
    }, deadlineMs)
    child.on("close", (code) => {
      clearTimeout(timer)
      resolve({
        code,
        output,
        seconds: (Date.now() - started) / 1000,
        killed,
      })
    })
  })
}

export const commitSpec = (
  title: string,
  hook: string,
  {
    budgetAfterSetupMs,
    before = "",
    after = "",
  }: { budgetAfterSetupMs: number; before?: string; after?: string }
) => `import { expect } from "@playwright/test"
import { chmodSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import { test } from ${JSON.stringify(FIXTURE)}

test(${JSON.stringify(title)}, async ({ makeClone }) => {
  const started = Date.now()
  const clone = await makeClone()
  test.setTimeout(Date.now() - started + ${budgetAfterSetupMs})
  ${before}
  clone.write("scripts/pre-commit.sh", ${JSON.stringify(`#!/bin/sh\n${hook}\n`)})
  chmodSync(join(clone.dir, "scripts/pre-commit.sh"), 0o755)
  clone.write("note.txt", "a note\\n")
  await clone.git("add", "scripts/pre-commit.sh", "note.txt")
  const result = await clone.commit("-m", "add a note")
  ${after}
})
`

export const watchPids = (pattern: string) => {
  const seen = new Set<number>()
  let stopped = false
  const loop = (async () => {
    while (!stopped) {
      for (const pid of await pids(pattern)) {
        seen.add(pid)
      }
      await new Promise((resolve) => setTimeout(resolve, 300))
    }
  })()
  return {
    seen,
    stop: async () => {
      stopped = true
      await loop
    },
  }
}

export const settledPids = async (pattern: string, withinMs: number) => {
  const deadline = Date.now() + withinMs
  let left = await pids(pattern)
  while (left.length > 0 && Date.now() < deadline) {
    await new Promise((resolve) => setTimeout(resolve, 500))
    left = await pids(pattern)
  }
  return left
}

export const reportedSeconds = (output: string, title: string) => {
  const line = output
    .replace(COLOR, "")
    .split("\n")
    .find((text) => text.includes(title) && DURATION.test(text))
  const match = line?.match(DURATION)
  if (!match) {
    return Number.NaN
  }
  return match[2] === "ms" ? Number(match[1]) / 1000 : Number(match[1])
}
