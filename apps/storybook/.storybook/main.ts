import type { StorybookConfig } from "@storybook/react-vite"

import { existsSync } from "fs"
import { dirname, resolve } from "path"
import { fileURLToPath } from "url"

/**
 * This function is used to resolve the absolute path of a package.
 * It is needed in projects that use Yarn PnP or are set up within a monorepo.
 */
function getAbsolutePath(value: string) {
  return dirname(fileURLToPath(import.meta.resolve(`${value}/package.json`)))
}

const config: StorybookConfig = {
  stories: [
    "../src/pages/*.mdx",
    "../src/components/*.mdx",
    "../../../packages/ui/src/**/*.stories.@(ts|tsx)",
  ],
  addons: [
    getAbsolutePath("@storybook/addon-a11y"),
    getAbsolutePath("@storybook/addon-docs"),
    getAbsolutePath("@storybook/addon-vitest"),
    getAbsolutePath("@chromatic-com/storybook"),
  ],
  framework: getAbsolutePath("@storybook/react-vite"),
  // The built site gets the registry from `build:site`. In dev, serve it at the
  // same path so the Registry guide's picker reads real files.
  staticDirs: async (dirs, { configType }) => {
    const registry = resolve(
      dirname(fileURLToPath(import.meta.url)),
      "../../registry/public/r"
    )
    return configType === "DEVELOPMENT" && existsSync(registry)
      ? [...(dirs ?? []), "../public", { from: registry, to: "/r" }]
      : [...(dirs ?? []), "../public"]
  },
  core: {
    disableWhatsNewNotifications: true,
  },
}

export default config
