/*
 * Renders the brand kit's images into brand/out: the social cards, the logo
 * sheet, the six tension cards and the golden window poster.
 *
 *   node brand/render.mjs
 *
 * Uses the Playwright that apps/storybook already depends on; set
 * CHROMIUM_PATH to use a Chromium of your own instead. Pages that
 * need photos are skipped, with a note, until the photos are in
 * brand/photos (see brand/photos/README.md).
 */
import { existsSync, mkdirSync, writeFileSync } from "node:fs"
import { createRequire } from "node:module"

import { CARDS, render } from "./cards.mjs"

const require = createRequire(
  new URL("../apps/storybook/package.json", import.meta.url)
)
const { chromium } = require("playwright")

const here = new URL(".", import.meta.url).pathname
const out = `${here}out/`
mkdirSync(out, { recursive: true })

// CHROMIUM_PATH points at a Chromium of your own, if Playwright's isn't
// installed.
const browser = await chromium.launch({
  args: ["--allow-file-access-from-files"],
  executablePath: process.env.CHROMIUM_PATH || undefined,
})

// Social cards: each is its own page, one card per screenshot.
for (const card of CARDS) {
  const file = `${out}${card.id}.html`
  writeFileSync(file, render(card))
  const page = await browser.newPage({
    viewport: { width: card.w, height: card.h },
  })
  await page.goto(`file://${file}`)
  await page.evaluate(() => document.fonts.ready)
  await page.screenshot({ path: `${out}${card.id}.png` })
  await page.close()
  console.log("card", card.id)
}

// Canvas pages: each canvas is saved under its id once the page is done.
const PAGES = [
  { file: "logo.html", photos: [] },
  { file: "tensions.html", photos: ["u-rabbit.jpg", "sunflower.jpg"] },
  { file: "window.html", photos: ["u-rabbit.jpg"] },
]
for (const { file, photos } of PAGES) {
  const missing = photos.filter((p) => !existsSync(`${here}photos/${p}`))
  if (missing.length) {
    console.log(`skipped ${file}: add ${missing.join(", ")} to brand/photos`)
    continue
  }
  const page = await browser.newPage({
    viewport: { width: 1800, height: 1400 },
  })
  await page.goto(`file://${here}${file}`)
  await page.waitForFunction(() => document.title !== "", null, {
    timeout: 90_000,
  })
  const title = await page.title()
  if (title !== "done") console.log(`${file}: ${title}`)
  for (const canvas of await page.$$("canvas")) {
    const id = await canvas.getAttribute("id")
    await canvas.screenshot({ path: `${out}${id}.png` })
    console.log("image", id)
  }
  await page.close()
}

await browser.close()
