import type { DesignTheme, Theme } from "./theme-sync.js"

/*
 * fibo's own parts in Storybook's UI, such as the sidebar's command menu,
 * run on React 19 in a bundle of their own (manager-ui/), because the
 * manager runs Storybook's React 18. manager.tsx sets this on window so
 * they can reach Storybook: the index, its updates, navigation, light or
 * dark, and the design theme.
 */
type IndexEntry = {
  id: string
  title: string
  name: string
  type: string
  tags?: string[]
}

type FiboManagerBridge = {
  getIndex: () => Record<string, IndexEntry>
  /** Calls the listener whenever the index changes; returns the unsubscribe. */
  onIndex: (listener: () => void) => () => void
  navigate: (path: string) => void
  getMode: () => Theme
  setMode: (mode: Theme) => void
  /** Calls the listener whenever light or dark changes; returns the unsubscribe. */
  onMode: (listener: (mode: Theme) => void) => () => void
  getDesignTheme: () => DesignTheme
  setDesignTheme: (theme: DesignTheme) => void
  /** Calls the listener whenever the design theme changes; returns the unsubscribe. */
  onDesignTheme: (listener: (theme: DesignTheme) => void) => () => void
}

const BRIDGE_READY = "fibo-manager-ready"

declare global {
  interface Window {
    __FIBO_MANAGER__?: FiboManagerBridge
  }
}

export { BRIDGE_READY, type FiboManagerBridge, type IndexEntry }
