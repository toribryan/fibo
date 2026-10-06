import React from "react"
import type { Preview } from "@storybook/react-vite"
import { addons } from "storybook/preview-api"

import "../src/docs.css"
import { FiboDocsContainer } from "../src/blocks/docs-container.js"
import { mdxComponents } from "../src/blocks/typography.js"
import {
  DESIGN_THEME_EVENT,
  DESIGN_THEME_REQUEST,
  INSET_THEMES,
  readDesignTheme,
  readTheme,
  THEME_EVENT,
  THEME_REQUEST,
  type DesignTheme,
  type Theme,
} from "./theme-sync.js"

function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle("dark", theme === "dark")
}

// fibo is the default look, so it leaves no attribute behind.
function applyDesignTheme(theme: DesignTheme) {
  if (theme === "fibo") delete document.documentElement.dataset.theme
  else document.documentElement.dataset.theme = theme
  // An inset page is the surface panel itself, so its parts match it.
  document.body.toggleAttribute("data-surface", INSET_THEMES.includes(theme))
}

applyTheme(readTheme())
applyDesignTheme(readDesignTheme())
const channel = addons.getChannel()
channel.on(THEME_EVENT, applyTheme)
channel.on(DESIGN_THEME_EVENT, applyDesignTheme)
channel.emit(THEME_REQUEST)
channel.emit(DESIGN_THEME_REQUEST)

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
          "Catalog",
          "Changelog",
          "Design skills",
          "About fibo",
          "Foundations",
          ["Colors", "Typography", "Spacing", "Elevation", "Motion", "Themes"],
          // Base groups in the order the Catalog page shows them. Parts keep
          // the stories' import order, which is alphabetical by file, and
          // special parts sit straight under their shelf.
          "Base components",
          ["Actions", "Forms", "Display", "Navigation", "Overlays", "Feedback"],
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
