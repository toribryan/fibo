import type { StorybookConfig } from "@storybook/react-vite"

import { dirname } from "path"
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
  staticDirs: ["../public"],
  core: {
    disableWhatsNewNotifications: true,
  },
}

export default config
