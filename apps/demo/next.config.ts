import path from "node:path"
import { fileURLToPath } from "node:url"
import type { NextConfig } from "next"

const eiabSrc = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../packages/eiab/src"
)

const nextConfig: NextConfig = {
  transpilePackages: ["eiab"],
  turbopack: {
    resolveAlias: {
      "eiab/react": path.join(eiabSrc, "react.tsx"),
      eiab: path.join(eiabSrc, "index.ts"),
    },
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      "eiab/react": path.join(eiabSrc, "react.tsx"),
      eiab: path.join(eiabSrc, "index.ts"),
    }
    return config
  },
}

export default nextConfig
