import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  // The registry site is fully static, so it exports to apps/web/out and
  // Vercel serves it from there (see vercel.json at the repo root).
  output: "export",
  transpilePackages: ["@workspace/ui"],
}

export default nextConfig
