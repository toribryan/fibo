import { useEffect, useState } from "react"
import { PaletteIcon } from "lucide-react"
import { createRoot, type Root } from "react-dom/client"

import "@workspace/ui/themes/mechanical.css"
import "@workspace/ui/themes/sage.css"

import { Button } from "@workspace/ui/components/button"
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

const THEMES: { value: DesignTheme; label: string; description: string }[] = [
  { value: "fibo", label: "fibo", description: "Achromatic, the default" },
  {
    value: "mechanical",
    label: "Mechanical",
    description: "Terracotta keys on beige",
  },
  { value: "sage", label: "Sage", description: "Ink and a yellow highlight" },
]

// A chip of the theme's own page and primary, drawn by the theme itself.
function Swatch({ theme }: { theme: DesignTheme }) {
  return (
    <span
      aria-hidden="true"
      data-theme={theme === "fibo" ? undefined : theme}
      className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-sm border border-border bg-background"
    >
      <span className="size-2.5 rounded-full bg-primary" />
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
      <MenuContent align="end" className="w-60">
        <MenuGroup>
          <MenuLabel>Theme</MenuLabel>
          <MenuRadioGroup
            value={theme}
            onValueChange={(value) =>
              bridge.setDesignTheme(value as DesignTheme)
            }
          >
            {THEMES.map(({ value, label, description }) => (
              <MenuRadioItem
                key={value}
                value={value}
                className="h-auto items-start gap-2.5 py-1.5"
              >
                <Swatch theme={value} />
                <span className="flex min-w-0 flex-col">
                  <span>{label}</span>
                  <span className="text-xs text-muted-foreground">
                    {description}
                  </span>
                </span>
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
