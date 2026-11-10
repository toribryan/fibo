import { createFromSource } from "fumadocs-core/search/server"

import { source } from "@/lib/source"

export const revalidate = false

// Exported as a static index, searched in the browser.
export const { staticGET: GET } = createFromSource(source, {
  language: "english",
})
