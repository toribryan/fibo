import storybook from "eslint-plugin-storybook"

import { config } from "@workspace/eslint-config/react-internal"

/** @type {import("eslint").Linter.Config} */
export default [
  ...config,
  ...storybook.configs["flat/recommended"],
  { ignores: ["storybook-static/**"] },
]
