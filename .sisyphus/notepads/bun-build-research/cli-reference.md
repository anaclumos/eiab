# Bun `bun build` CLI - Complete Reference

## Quick Start

```bash
# Basic bundling
bun build ./src/index.ts

# With output directory
bun build --outdir=dist ./src/index.ts

# With minification and sourcemaps
bun build --minify --sourcemap=external --outdir=dist ./src/index.ts

# Watch mode (auto-rebuild on changes)
bun build --watch --outdir=dist ./src/index.ts

# Transpile only (no bundling)
bun build --no-bundle --outdir=dist ./src/index.ts
```

---

## Core Flags

### Output Configuration

| Flag | Values | Default | Description |
|------|--------|---------|-------------|
| `--outdir` | `<path>` | `dist` | Output directory for multiple files |
| `--outfile` | `<path>` | - | Single output file (overrides outdir) |
| `--root` | `<path>` | - | Root directory for multiple entry points |

### Module Format

| Flag | Values | Default | Description |
|------|--------|---------|-------------|
| `--format` | `esm`, `cjs`, `iife` | `esm` | Output module format |
| `--target` | `browser`, `bun`, `node` | - | Execution environment |

### Optimization

| Flag | Values | Default | Description |
|------|--------|---------|-------------|
| `--minify` | - | - | Enable all minification |
| `--minify-syntax` | - | - | Minify syntax and inline data |
| `--minify-whitespace` | - | - | Minify whitespace only |
| `--minify-identifiers` | - | - | Minify identifiers only |
| `--production` | - | - | Set NODE_ENV=production + minify |

### Source Maps

| Flag | Values | Default | Description |
|------|--------|---------|-------------|
| `--sourcemap` | `linked`, `inline`, `external`, `none` | - | Generate sourcemaps |

### Bundling Control

| Flag | Values | Default | Description |
|------|--------|---------|-------------|
| `--no-bundle` | - | - | Transpile only, don't bundle |
| `--splitting` | - | - | Enable code splitting |
| `--external` | `<module>` | - | Exclude module from bundling (can use wildcards) |
| `--packages` | `external`, `bundle` | `bundle` | How to handle dependencies |

### Development

| Flag | Values | Default | Description |
|------|--------|---------|-------------|
| `--watch` | - | - | Auto-rebuild on file changes |
| `--no-clear-screen` | - | - | Don't clear terminal on reload |

---

## Advanced Flags

### Code Injection

| Flag | Values | Default | Description |
|------|--------|---------|-------------|
| `--banner` | `<text>` | - | Add banner to output (e.g., "use client") |
| `--footer` | `<text>` | - | Add footer to output |

### Module Resolution

| Flag | Values | Default | Description |
|------|--------|---------|-------------|
| `--conditions` | `<condition>` | - | Custom package.json export conditions |
| `--public-path` | `<prefix>` | - | Prefix for import paths in bundle |

### File Naming

| Flag | Values | Default | Description |
|------|--------|---------|-------------|
| `--entry-naming` | `<pattern>` | `[dir]/[name].[ext]` | Entry point filename pattern |
| `--chunk-naming` | `<pattern>` | `[name]-[hash].[ext]` | Chunk filename pattern |
| `--asset-naming` | `<pattern>` | `[name]-[hash].[ext]` | Asset filename pattern |

### Environment Variables

| Flag | Values | Default | Description |
|------|--------|---------|-------------|
| `--env` | `disable`, `<var>`, `<prefix>*` | `disable` | Inline environment variables |

### React

| Flag | Values | Default | Description |
|------|--------|---------|-------------|
| `--react-fast-refresh` | - | - | Enable React Fast Refresh |
| `--server-components` | - | - | (EXPERIMENTAL) Enable server components |

### CSS

| Flag | Values | Default | Description |
|------|--------|---------|-------------|
| `--css-chunking` | - | - | Chunk CSS files together |

### Compilation

| Flag | Values | Default | Description |
|------|--------|---------|-------------|
| `--compile` | - | - | Generate standalone executable |
| `--bytecode` | - | - | Use bytecode cache (requires --target=bun) |

### Dead Code Elimination

| Flag | Values | Default | Description |
|------|--------|---------|-------------|
| `--emit-dce-annotations` | - | - | Re-emit DCE annotations in bundles |

### Windows Specific

| Flag | Values | Default | Description |
|------|--------|---------|-------------|
| `--windows-hide-console` | - | - | Hide console window on Windows |
| `--windows-icon` | `<path>` | - | Set executable icon on Windows |

### Experimental

| Flag | Values | Default | Description |
|------|--------|---------|-------------|
| `--app` | - | - | (EXPERIMENTAL) Build web app with Bun Bake |

---

## Real-World Examples

### Library Bundling (ESM + Minified)
```bash
bun build \
  --outdir=dist \
  --format=esm \
  --minify \
  --sourcemap=external \
  ./src/index.ts
```

### Browser App
```bash
bun build \
  --outfile=bundle.js \
  --target=browser \
  --minify \
  --splitting \
  ./src/index.tsx
```

### Server Bundle (Bun Runtime)
```bash
bun build \
  --target=bun \
  --outfile=server.js \
  --minify \
  ./src/server.ts
```

### Standalone Executable
```bash
bun build \
  --compile \
  --outfile=my-app \
  ./cli.ts
```

### Development Build (No Minification)
```bash
bun build \
  --outdir=dist \
  --sourcemap=inline \
  --watch \
  ./src/index.ts
```

### Transpile Only (No Bundling)
```bash
bun build \
  --no-bundle \
  --outdir=dist \
  ./src/index.ts
```

### Multiple Entry Points
```bash
bun build \
  --outdir=dist \
  --root=src \
  ./src/index.ts \
  ./src/utils.ts \
  ./src/types.ts
```

### With Environment Variables
```bash
bun build \
  --env=PUBLIC_API_URL \
  --outdir=dist \
  ./src/index.ts
```

---

## Naming Patterns

### Available Variables

- `[dir]` - Directory of the file
- `[name]` - Filename without extension
- `[ext]` - File extension
- `[hash]` - Content hash

### Examples

```bash
# Entry naming
--entry-naming="[dir]/[name]-[hash].[ext]"

# Chunk naming
--chunk-naming="chunks/[name]-[hash].[ext]"

# Asset naming
--asset-naming="assets/[name]-[hash].[ext]"
```

---

## Important Notes

### TypeScript Declaration Files

⚠️ **`bun build` does NOT generate `.d.ts` files natively.**

Options:
1. Use a plugin: `bun-plugin-dts`
2. Run `tsc` separately
3. Skip type generation (not recommended for libraries)

### Bundling vs. Transpiling

- **Bundling** (default): Combines all code into one/few files
- **Transpiling** (--no-bundle): Converts TS to JS, keeps file structure

### Performance Tips

- Use `--no-bundle` for development (faster)
- Use `--minify` for production
- Use `--splitting` for large apps
- Use `--bytecode` for Bun runtime (faster startup)

---

## Comparison with Bun.build() API

The CLI is a wrapper around the `Bun.build()` API. For complex builds, use `build.ts`:

```typescript
// build.ts
import { build } from "bun";

await build({
  entrypoints: ["./src/index.ts"],
  outdir: "./dist",
  target: "browser",
  format: "esm",
  minify: true,
  sourcemap: "external",
});
```

Then run: `bun run build.ts`

---

## Resources

- Official Docs: https://bun.com/docs/bundler
- API Reference: https://bun.sh/reference/bun/build
- GitHub: https://github.com/oven-sh/bun
