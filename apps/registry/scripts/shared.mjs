// What build-registry.mjs and export-21st.mjs both need to agree on.
import process from "node:process"

export const homepage =
  process.env.FIBO_SITE_URL || "https://fibo.toribryan.com"

export const packageName = (spec) =>
  spec.startsWith("@")
    ? spec.split("/").slice(0, 2).join("/")
    : spec.split("/")[0]

// Storybook is the site, so a component's docs page is a path off the root.
// Base parts sit in a group in Storybook's sidebar; special parts don't.
export const docsUrl = (name, info) =>
  `${homepage}/?path=/docs/${info.tier}-${info.tier === "base-components" ? `${info.group.toLowerCase()}-` : ""}${name}--docs`
