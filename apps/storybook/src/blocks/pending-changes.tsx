/// <reference types="vite/client" />

import type { ComponentType } from "react"
import { useMDXComponents } from "@mdx-js/react"
import { Markdown } from "@storybook/addon-docs/blocks"

// Fragments waiting for the next release, read at build time so the page
// shows a change as soon as it merges. See changes/README.md.
const FRAGMENTS = import.meta.glob<string>("../../../../changes/*.md", {
  query: "?raw",
  import: "default",
  eager: true,
})

const ENTRIES = Object.entries(FRAGMENTS)
  .filter(([path]) => !path.endsWith("/README.md"))
  .map(([, text]) => text.replace(/^---\n[\s\S]*?\n---\n/, "").trim())

function PendingChanges() {
  // Storybook's own MDX components, so the entries match the rest of the page.
  const components = useMDXComponents() as Record<string, ComponentType>
  if (!ENTRIES.length) return null
  const list = ENTRIES.map((entry) => `- ${entry.replace(/\n/g, "\n  ")}`)
  return (
    <Markdown options={{ overrides: components }}>
      {`## Not released yet\n\n${list.join("\n")}`}
    </Markdown>
  )
}

export { PendingChanges }
