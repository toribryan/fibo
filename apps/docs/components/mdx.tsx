import defaultMdxComponents from "fumadocs-ui/mdx"
import type { MDXComponents } from "mdx/types"

import { BlockFrame } from "@/components/block-frame"
import { Preview } from "@/components/preview"
import { StorybookLink } from "@/components/storybook-link"

export function getMDXComponents(components?: MDXComponents) {
  return {
    ...defaultMdxComponents,
    BlockFrame,
    Preview,
    StorybookLink,
    ...components,
  } satisfies MDXComponents
}

export const useMDXComponents = getMDXComponents

declare global {
  type MDXProvidedComponents = ReturnType<typeof getMDXComponents>
}
