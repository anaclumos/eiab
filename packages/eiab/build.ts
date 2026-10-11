export {}

const options = {
  outdir: "./dist",
  target: "browser",
  format: "esm",
  minify: true,
  sourcemap: "external",
  external: ["react", "react/jsx-runtime", "react/jsx-dev-runtime"],
  define: {
    "process.env.NODE_ENV": '"production"',
  },
} satisfies Omit<Bun.BuildConfig, "entrypoints">

await Bun.build({ ...options, entrypoints: ["./src/index.ts"] })
await Bun.build({
  ...options,
  entrypoints: ["./src/react.tsx"],
  banner: '"use client";',
})
