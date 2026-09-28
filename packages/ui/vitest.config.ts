import react from "@vitejs/plugin-react"
import { playwright } from "@vitest/browser-playwright"
import { defineConfig } from "vitest/config"

// Unit tests run in the same Chromium as the story tests, so components that
// use the Web Animations API or layout behave as they do for real users.
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { "@workspace/ui": new URL("./src", import.meta.url).pathname },
  },
  test: {
    name: "unit",
    include: ["src/**/*.test.{ts,tsx}"],
    browser: {
      enabled: true,
      headless: true,
      provider: playwright({}),
      instances: [{ browser: "chromium" }],
    },
  },
})
