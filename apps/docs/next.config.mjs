import { createMDX } from "fumadocs-mdx/next"

const withMDX = createMDX()

/** @type {import("next").NextConfig} */
const config = {
  // The site is static: Vercel serves dist/, with no server at request time.
  output: "export",
  // Folder-style output (docs/index.html) resolves on any static host.
  trailingSlash: true,
  reactStrictMode: true,
  transpilePackages: ["@workspace/ui"],
}

export default withMDX(config)
