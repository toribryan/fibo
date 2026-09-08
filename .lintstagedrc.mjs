/** @type {import('lint-staged').Configuration} */
const config = {
  "*.{js,jsx,mjs,ts,tsx,css,md,mdx,json}": "prettier --write",
}

export default config
