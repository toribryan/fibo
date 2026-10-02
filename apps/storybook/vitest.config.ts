import path from "node:path"
import { fileURLToPath } from "node:url"

import { storybookTest } from "@storybook/addon-vitest/vitest-plugin"
import { playwright } from "@vitest/browser-playwright"
import { defineConfig } from "vitest/config"

const dirname = path.dirname(fileURLToPath(import.meta.url))

// Every story is a test: it must render, pass its play function, and pass the
// axe checks the a11y addon runs on it.
export default defineConfig({
  test: {
    projects: [
      {
        extends: true,
        plugins: [
          storybookTest({ configDir: path.join(dirname, ".storybook") }),
        ],
        test: {
          name: "storybook",
          browser: {
            enabled: true,
            headless: true,
            provider: playwright({}),
            // The Storybook addon no longer sets its 1200x900 viewport under
            // Vitest 5, which falls back to 414x896 and turns wide parts such
            // as Data table into their phone layouts.
            viewport: { width: 1200, height: 900 },
            instances: [{ browser: "chromium" }],
          },
        },
      },
    ],
  },
})
