/*
 * fibo's own parts in Storybook's UI, such as the sidebar's command menu,
 * run on React 19 in a bundle of their own (manager-ui/), because the
 * manager runs Storybook's React 18. manager.tsx sets this on window so
 * they can reach Storybook: the index, its updates and navigation.
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
}

const BRIDGE_READY = "fibo-manager-ready"

declare global {
  interface Window {
    __FIBO_MANAGER__?: FiboManagerBridge
  }
}

export { BRIDGE_READY, type FiboManagerBridge, type IndexEntry }
