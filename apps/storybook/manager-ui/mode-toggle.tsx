import { useEffect, useState } from "react"
import { MoonIcon, SunIcon } from "lucide-react"
import { createRoot, type Root } from "react-dom/client"

import { Button } from "@workspace/ui/components/button"

import type { FiboManagerBridge } from "../.storybook/manager-bridge.js"

// One button for light and dark: pressed means dark, and the icon shows
// which mode a press goes to.
function ModeToggle({ bridge }: { bridge: FiboManagerBridge }) {
  const [mode, setMode] = useState(bridge.getMode)

  useEffect(() => bridge.onMode(setMode), [bridge])

  const dark = mode === "dark"
  return (
    <Button
      variant="ghost"
      size="icon-sm"
      aria-label="Dark mode"
      aria-pressed={dark}
      title={dark ? "Switch to light mode" : "Switch to dark mode"}
      onClick={() => bridge.setMode(dark ? "light" : "dark")}
    >
      {dark ? <SunIcon aria-hidden="true" /> : <MoonIcon aria-hidden="true" />}
    </Button>
  )
}

/*
 * Takes the place of Storybook's settings button in each sidebar header
 * (manager-head.html hides it). The sidebar remounts on phones and when the
 * layout changes, so each new header gets its own toggle.
 */
const SETTINGS = '.sidebar-header button[aria-label="Settings"]'

function mountModeToggle(bridge: FiboManagerBridge) {
  const mounted = new Map<Element, { host: HTMLElement; root: Root }>()
  const sync = () => {
    for (const settings of document.querySelectorAll(SETTINGS)) {
      if (mounted.has(settings)) continue
      const host = document.createElement("div")
      host.className = "fibo-ui fibo-mode-toggle"
      settings.before(host)
      const root = createRoot(host)
      root.render(<ModeToggle bridge={bridge} />)
      mounted.set(settings, { host, root })
    }
    for (const [settings, { host, root }] of mounted) {
      if (settings.isConnected) continue
      root.unmount()
      host.remove()
      mounted.delete(settings)
    }
  }
  new MutationObserver(sync).observe(document.body, {
    childList: true,
    subtree: true,
  })
  sync()
}

export { mountModeToggle }
