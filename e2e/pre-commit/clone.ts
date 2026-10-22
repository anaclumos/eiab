import { spawn, spawnSync } from "node:child_process"
import {
  appendFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  writeFileSync,
} from "node:fs"
import { tmpdir } from "node:os"
import { dirname, join, resolve } from "node:path"

const REPO_ROOT = resolve(__dirname, "../..")

export const COMMIT_TEST_TIMEOUT = 120_000

const localGitVars = spawnSync("git", ["rev-parse", "--local-env-vars"], {
  encoding: "utf8",
})
  .stdout.split("\n")
  .map((name) => name.trim())
  .filter(Boolean)

function cleanEnv(): NodeJS.ProcessEnv {
  const env = { ...process.env }
  for (const name of [...localGitVars, "LEFTHOOK", "LEFTHOOK_EXCLUDE"]) {
    delete env[name]
  }
  return env
}

export interface RunResult {
  output: string
  status: number | null
}

export interface Clone {
  append: (path: string, content: string) => void
  commit: (...args: string[]) => RunResult & { seconds: number }
  dir: string
  git: (...args: string[]) => RunResult
  head: () => string
  read: (path: string) => string
  remove: () => void
  show: (path: string) => string | null
  staged: () => string[]
  status: () => string[]
  write: (path: string, content: string) => void
}

export function makeClone(): Clone {
  const base = mkdtempSync(join(tmpdir(), "eiab-pre-commit-"))
  const dir = join(base, "repo")
  const env = cleanEnv()

  const run = (command: string, args: string[]): RunResult => {
    const result = spawnSync(command, args, {
      cwd: existsSync(dir) ? dir : base,
      env,
      encoding: "utf8",
      maxBuffer: 64 * 1024 * 1024,
    })
    return {
      status: result.status,
      output: `${result.stdout ?? ""}${result.stderr ?? ""}`,
    }
  }
  const must = (command: string, args: string[]): string => {
    const result = run(command, args)
    if (result.status !== 0) {
      throw new Error(`${command} ${args.join(" ")} failed:\n${result.output}`)
    }
    return result.output
  }

  must("git", ["clone", "--quiet", REPO_ROOT, dir])
  must("git", ["config", "user.name", "Pre-commit QA"])
  must("git", ["config", "user.email", "qa@example.com"])
  must("bun", ["install"])

  const git = (...args: string[]) => run("git", args)
  const lines = (text: string) => text.split("\n").filter(Boolean)

  return {
    dir,
    git,
    commit: (...args) => {
      const started = Date.now()
      const result = git("commit", ...args)
      return { ...result, seconds: (Date.now() - started) / 1000 }
    },
    head: () => must("git", ["rev-parse", "HEAD"]).trim(),
    show: (path) => {
      const result = git("show", `HEAD:${path}`)
      return result.status === 0 ? result.output : null
    },
    status: () =>
      lines(must("git", ["status", "--porcelain", "--untracked-files=all"])),
    staged: () => lines(must("git", ["diff", "--cached", "--name-only"])),
    read: (path) => readFileSync(join(dir, path), "utf8"),
    write: (path, content) => {
      const target = join(dir, path)
      mkdirSync(dirname(target), { recursive: true })
      writeFileSync(target, content)
    },
    append: (path, content) => appendFileSync(join(dir, path), content),
    remove: () => {
      spawn("rm", ["-rf", base], { detached: true, stdio: "ignore" }).unref()
    },
  }
}
