/*
 * Builds public/fibo-manager/: fibo's own parts for Storybook's UI, on
 * React 19, with the CSS they need (see manager-ui/main.tsx).
 *
 * globals.css can't be loaded in the manager as it is, because Tailwind's
 * preflight and its base rules would restyle Storybook itself. The CSS entry
 * is globals.css with those scoped to where fibo's parts render (FIBO_ROOTS),
 * and its `@source` pointed at the components by absolute path.
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { createRequire } from "node:module"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"

import react from "@vitejs/plugin-react"
import { defineConfig, type Plugin } from "vite"

const app = dirname(fileURLToPath(import.meta.url))
const ui = resolve(app, "../../packages/ui")

/*
 * Where fibo's parts render in the manager: their own `.fibo-ui` hosts, and
 * the portals Base UI opens on the body for their popups, such as the
 * command menu's dialog. Storybook itself never uses Base UI, so a portal
 * here is always fibo's.
 */
const FIBO_ROOTS = ".fibo-ui, [data-base-ui-portal]"

function managerCss(): Plugin {
  const id = "virtual:fibo-manager.css"
  // Inside packages/ui, so the entry's imports resolve from its dependencies.
  const file = resolve(ui, "node_modules/.cache/fibo-manager/manager.css")
  return {
    name: "fibo-manager-css",
    buildStart() {
      const globals = readFileSync(
        resolve(ui, "src/styles/globals.css"),
        "utf8"
      )
      const preflight = readFileSync(
        createRequire(resolve(ui, "package.json")).resolve(
          "tailwindcss/preflight.css"
        ),
        "utf8"
      )
      const entry = [
        "@layer theme, base, components, utilities;",
        '@import "tailwindcss/theme.css" layer(theme);',
        '@import "tailwindcss/utilities.css" layer(utilities);',
        `@layer base { @scope (${FIBO_ROOTS}) { ${preflight} } }`,
        globals
          .replace('@import "tailwindcss";', "")
          .replace(/@source "[^"]+";/, `@source "${resolve(ui, "src")}";`)
          .replace(/\n {2}\* \{/, `\n  ${FIBO_ROOTS}, :is(${FIBO_ROOTS}) * {`)
          .replace(/\n {2}body,/, "\n  .fibo-ui,"),
        `@source "${resolve(app, "manager-ui")}";`,
      ].join("\n")
      mkdirSync(dirname(file), { recursive: true })
      writeFileSync(file, entry)
    },
    resolveId: (source) => (source === id ? file : undefined),
  }
}

export default defineConfig({
  root: app,
  plugins: [managerCss(), react()],
  define: { "process.env.NODE_ENV": JSON.stringify("production") },
  build: {
    outDir: "public/fibo-manager",
    emptyOutDir: true,
    copyPublicDir: false,
    minify: true,
    lib: {
      entry: resolve(app, "manager-ui/main.tsx"),
      formats: ["es"],
      fileName: () => "fibo-manager.js",
      cssFileName: "fibo-manager",
    },
  },
})
