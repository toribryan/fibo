import { useEffect, useState } from "react"
import { PaletteIcon } from "lucide-react"
import { createRoot, type Root } from "react-dom/client"

import "@workspace/ui/themes/mechanical.css"
import "@workspace/ui/themes/electrical.css"

import { Button } from "@workspace/ui/components/button"
import { Kbd } from "@workspace/ui/components/kbd"
import {
  Menu,
  MenuContent,
  MenuGroup,
  MenuLabel,
  MenuRadioGroup,
  MenuRadioItem,
  MenuTrigger,
} from "@workspace/ui/components/menu"

import type { FiboManagerBridge } from "../.storybook/manager-bridge.js"
import type { DesignTheme } from "../.storybook/theme-sync.js"

const THEMES: { value: DesignTheme; label: string }[] = [
  { value: "fibo", label: "Original" },
  { value: "mechanical", label: "Mechanical" },
  { value: "electrical", label: "Electrical" },
]

/*
 * A key drawn by the theme itself: fibo's Kbd inside the theme's scope, so
 * it can't drift from the stylesheet. The scope is display: contents, so
 * the theme's page color has no box to paint.
 */
function ThemeKey({ theme }: { theme: DesignTheme }) {
  return (
    <span data-theme={theme} className="contents">
      <Kbd aria-hidden="true" className="size-5">
        @
      </Kbd>
    </span>
  )
}

function ThemeMenu({ bridge }: { bridge: FiboManagerBridge }) {
  const [theme, setTheme] = useState(bridge.getDesignTheme)

  useEffect(() => bridge.onDesignTheme(setTheme), [bridge])

  return (
    <Menu>
      <MenuTrigger
        render={
          <Button
            variant="outline"
            size="icon"
            aria-label="Theme"
            title="Theme"
          >
            <PaletteIcon aria-hidden="true" />
          </Button>
        }
      />
      <MenuContent align="end" className="w-56">
        <MenuGroup>
          <MenuLabel>Theme</MenuLabel>
          <MenuRadioGroup
            value={theme}
            onValueChange={(value) =>
              bridge.setDesignTheme(value as DesignTheme)
            }
          >
            {/* The key marks each theme, and the current one is highlighted,
                so the radio dot gives way. */}
            {THEMES.map(({ value, label }) => (
              <MenuRadioItem
                key={value}
                value={value}
                className="pl-2 data-checked:bg-accent data-checked:text-accent-foreground [&>span:first-child]:hidden"
              >
                <ThemeKey theme={value} />
                <span className="truncate">{label}</span>
              </MenuRadioItem>
            ))}
          </MenuRadioGroup>
        </MenuGroup>
      </MenuContent>
    </Menu>
  )
}

/*
 * Mounts beside each sidebar's search, where Storybook's create-story button
 * sat (manager-head.html hides it). Like the search trigger, it remounts
 * with the sidebar, and sits after it because mountCommandSearch observes
 * first.
 */
function mountThemeMenu(bridge: FiboManagerBridge) {
  const mounted = new Map<Element, { host: HTMLElement; root: Root }>()
  const sync = () => {
    for (const field of document.querySelectorAll(".search-field")) {
      if (mounted.has(field)) continue
      const host = document.createElement("div")
      host.className = "fibo-ui fibo-theme-menu"
      field.before(host)
      const root = createRoot(host)
      root.render(<ThemeMenu bridge={bridge} />)
      mounted.set(field, { host, root })
    }
    for (const [field, { host, root }] of mounted) {
      if (field.isConnected) continue
      root.unmount()
      host.remove()
      mounted.delete(field)
    }
  }
  new MutationObserver(sync).observe(document.body, {
    childList: true,
    subtree: true,
  })
  sync()
}

export { mountThemeMenu }
