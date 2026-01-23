export {}

const tempConfig = {
  extends: "./tsconfig.json",
  compilerOptions: {
    noEmit: false,
    emitDeclarationOnly: true,
    outDir: "./dist",
  },
  include: ["src/index.ts", "src/react.tsx"],
}

await Bun.build({
  entrypoints: ["./src/index.ts", "./src/react.tsx"],
  outdir: "./dist",
  target: "browser",
  format: "esm",
  minify: true,
  sourcemap: "external",
  external: ["react"],
})

// Prepend "use client" directive to react.js (stripped by bundler)
const reactPath = "./dist/react.js"
const reactContent = await Bun.file(reactPath).text()
if (!reactContent.startsWith('"use client"')) {
  await Bun.write(reactPath, `"use client";\n${reactContent}`)
}

await Bun.write("tsconfig.build.json", JSON.stringify(tempConfig, null, 2))

const result = Bun.spawn(["tsc", "-p", "tsconfig.build.json"], {
  stdout: "inherit",
  stderr: "inherit",
})

const exitCode = await result.exited

await Bun.file("tsconfig.build.json").unlink()

if (exitCode !== 0) {
  process.exit(exitCode)
}
