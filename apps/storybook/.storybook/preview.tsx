import React from "react"
import type { Preview } from "@storybook/react-vite"
import { addons } from "storybook/preview-api"

import "../src/docs.css"
import { FiboDocsContainer } from "../src/blocks/docs-container.js"
import { mdxComponents } from "../src/blocks/typography.js"
import {
  readTheme,
  THEME_EVENT,
  THEME_REQUEST,
  type Theme,
} from "./theme-sync.js"

function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle("dark", theme === "dark")
}

applyTheme(readTheme())
const channel = addons.getChannel()
channel.on(THEME_EVENT, applyTheme)
channel.emit(THEME_REQUEST)

const preview: Preview = {
  parameters: {
    controls: {
      expanded: true,
      sort: "requiredFirst",
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    a11y: {
      test: "error",
    },
    backgrounds: {
      disable: true,
    },
    docs: {
      container: FiboDocsContainer,
      components: mdxComponents,
      toc: {
        title: "On this page",
        headingSelector: "h2",
        disable: false,
      },
      canvas: {
        sourceState: "hidden",
      },
    },
    options: {
      storySort: {
        order: [
          "Welcome",
          "Getting started",
          "Registry guide",
          "Catalog",
          "Changelog",
          "Design skills",
          "Foundations",
          ["Colors", "Typography", "Theme creator"],
          "Base components",
          "Special components",
        ],
      },
    },
  },
  decorators: [
    // Docs canvases already pad their stories, so the wrapper only pads in
    // the standalone story view.
    (Story, context) => (
      <div
        className={
          context.viewMode === "docs"
            ? "bg-background text-foreground"
            : "min-h-24 bg-background p-6 text-foreground"
        }
      >
        <Story />
      </div>
    ),
  ],
}

export default preview
