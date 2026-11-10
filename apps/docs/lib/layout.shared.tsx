import type { BaseLayoutProps } from "fumadocs-ui/layouts/shared"

import { GITHUB, STORYBOOK } from "@/lib/links"

export function baseOptions(): BaseLayoutProps {
  return {
    nav: { title: "fibo" },
    githubUrl: GITHUB,
    links: [{ text: "Storybook", url: STORYBOOK, external: true }],
  }
}
