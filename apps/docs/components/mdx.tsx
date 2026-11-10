import defaultMdxComponents from "fumadocs-ui/mdx"
import type { MDXComponents } from "mdx/types"

import { DoDont, DoDonts } from "@/components/do-dont"
import { Preview } from "@/components/preview"
import { StorybookLink } from "@/components/storybook-link"

export function getMDXComponents(components?: MDXComponents) {
  return {
    ...defaultMdxComponents,
    Preview,
    DoDont,
    DoDonts,
    StorybookLink,
    ...components,
  } satisfies MDXComponents
}

export const useMDXComponents = getMDXComponents

declare global {
  type MDXProvidedComponents = ReturnType<typeof getMDXComponents>
}
