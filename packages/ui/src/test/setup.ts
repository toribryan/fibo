import { afterEach } from "vitest"

// Load the real styles so tests that depend on layout (flipping, sizing)
// measure what users see.
import "../styles/globals.css"

// Every test renders into the same page, so a test that scrolls would leave
// the next one's "off screen" content in view.
afterEach(() => {
  window.scrollTo(0, 0)
})
