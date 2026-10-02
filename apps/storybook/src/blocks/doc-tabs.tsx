import { Tabs } from "@base-ui/react/tabs"
import {
  Children,
  createContext,
  isValidElement,
  useContext,
  useEffect,
  useRef,
  useState,
  type RefObject,
  type ReactElement,
  type ReactNode,
} from "react"

const STORAGE_KEY = "fibo:doc-tab"

function readStoredTab() {
  try {
    return localStorage.getItem(STORAGE_KEY)
  } catch {
    return null
  }
}

function storeTab(tab: string) {
  try {
    localStorage.setItem(STORAGE_KEY, tab)
  } catch {
    // Private windows and blocked storage just forget the choice.
  }
}

type DocTabsState = {
  tab: string | null
  setTab: (tab: string) => void
  /** The same tab, for code that runs outside React's render. */
  tabRef: RefObject<string | null>
}

const DocTabsContext = createContext<DocTabsState | null>(null)

/*
 * The docs container holds the tab, not the page, because the table of
 * contents lives in the container and has to rebuild when the tab changes.
 * The choice is remembered, so someone who reads Build keeps landing on it.
 */
function useDocTabsState(): DocTabsState {
  const [tab, setTabState] = useState(readStoredTab)
  const tabRef = useRef(tab)
  return {
    tab,
    tabRef,
    setTab: (next) => {
      tabRef.current = next
      setTabState(next)
      storeTab(next)
    },
  }
}

type DocTabProps = {
  /** Identifies the tab, and is what gets remembered. */
  value: string
  /** The tab's name in the tab list. */
  label: string
  /** The tab's content, written as ordinary MDX. */
  children?: ReactNode
}

/** One tab of a docs page. Only meaningful inside DocTabs. */
function DocTab({ children }: DocTabProps) {
  return <>{children}</>
}

/** The id in the manager's URL hash, which is where Storybook deep links land. */
function readHash() {
  try {
    return decodeURIComponent(window.parent.location.hash.slice(1))
  } catch {
    return ""
  }
}

/*
 * Splits a docs page into tabs. Inactive panels stay mounted but hidden, so
 * their stories keep their state and the table of contents can skip them.
 */
function DocTabs({ children }: { children: ReactNode }) {
  const context = useContext(DocTabsContext)
  const [localTab, setLocalTab] = useState<string | null>(null)
  const tabs = Children.toArray(children).filter(
    (child): child is ReactElement<DocTabProps> =>
      isValidElement(child) && child.type === DocTab
  )
  const values = tabs.map((tab) => tab.props.value)
  const wanted = context ? context.tab : localTab
  const active = wanted && values.includes(wanted) ? wanted : values[0]
  const setTab = context ? context.setTab : setLocalTab

  // A link to a heading in another tab opens that tab first, so the docs
  // container can scroll to it.
  useEffect(() => {
    const target = readHash()
    if (!target) return
    const panel = document
      .getElementById(target)
      ?.closest<HTMLElement>("[data-doc-tab]")
    const tab = panel?.dataset.docTab
    if (tab && tab !== active) setTab(tab)
    // Only the hash the page opened with.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <Tabs.Root
      value={active}
      onValueChange={(value) => setTab(String(value))}
      className="my-10"
    >
      <Tabs.List
        aria-label="Documentation view"
        activateOnFocus
        className="relative flex gap-6 border-b border-border"
      >
        {tabs.map((tab) => (
          <Tabs.Tab
            key={tab.props.value}
            value={tab.props.value}
            className="-mb-px border-b-2 border-transparent pt-1 pb-3 text-sm font-medium text-muted-foreground transition-colors outline-none hover:text-foreground focus-visible:rounded-sm focus-visible:ring-[3px] focus-visible:ring-ring-subtle data-active:border-foreground data-active:text-foreground"
          >
            {tab.props.label}
          </Tabs.Tab>
        ))}
      </Tabs.List>
      {tabs.map((tab) => (
        <Tabs.Panel
          key={tab.props.value}
          value={tab.props.value}
          keepMounted
          data-doc-tab={tab.props.value}
          className="pt-6 outline-none"
        >
          {tab.props.children}
        </Tabs.Panel>
      ))}
    </Tabs.Root>
  )
}

export { DocTab, DocTabs, DocTabsContext, useDocTabsState }
