// What build-registry.mjs and export-21st.mjs both need to agree on.
import process from "node:process"

export const homepage =
  process.env.FIBO_SITE_URL || "https://fibo.toribryan.com"

export const packageName = (spec) =>
  spec.startsWith("@")
    ? spec.split("/").slice(0, 2).join("/")
    : spec.split("/")[0]

// The docs site's pages are apps/docs/content/docs/<section>/<name>.mdx.
export const docsUrl = (name, info) =>
  `${homepage}/docs/${info.tier === "blocks" ? "blocks" : "components"}/${name}/`
