"use client"

import * as React from "react"
import { Tabs as TabsPrimitive } from "@base-ui/react/tabs"
import { cva } from "class-variance-authority"

import { mergeRefs } from "@workspace/ui/lib/merge-refs"
import { cn } from "@workspace/ui/lib/utils"

type TabsVariant = "default" | "line"
type TabsSize = "sm" | "default"

const TabsListContext = React.createContext<{
  variant: TabsVariant
  size: TabsSize
}>({ variant: "default", size: "default" })

/** Groups the list of tabs and the panels they show. */
function Tabs({ className, ...props }: TabsPrimitive.Root.Props) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      className={cn(
        "flex gap-3 data-[orientation=horizontal]:flex-col data-[orientation=vertical]:items-start data-[orientation=vertical]:gap-6",
        className
      )}
      {...props}
    />
  )
}

const tabsListVariants = cva(
  "relative flex w-fit max-w-full shrink-0 items-center data-[orientation=horizontal]:[scrollbar-width:none] data-[orientation=horizontal]:overflow-x-auto data-[orientation=vertical]:flex-col data-[orientation=vertical]:items-stretch",
  {
    variants: {
      variant: {
        default:
          "rounded-4xl bg-muted p-0.5 data-[orientation=vertical]:rounded-3xl",
        line: "gap-1 data-[orientation=horizontal]:pb-1 data-[orientation=vertical]:ps-2",
      },
      size: {
        sm: "",
        default: "",
      },
    },
    compoundVariants: [
      {
        variant: "default",
        size: "sm",
        className: "data-[orientation=horizontal]:h-8",
      },
      {
        variant: "default",
        size: "default",
        className: "data-[orientation=horizontal]:h-9",
      },
    ],
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

const tabsTriggerVariants = cva(
  "relative z-10 inline-flex shrink-0 items-center justify-center gap-1.5 rounded-4xl px-3 text-sm font-medium whitespace-nowrap text-muted-foreground transition-colors outline-none select-none hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring-subtle focus-visible:ring-inset data-[orientation=vertical]:justify-start data-disabled:pointer-events-none data-disabled:opacity-50 data-active:text-foreground [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        // The track is already muted, so hover only lifts the text; the
        // raised pill under the active tab is the indicator.
        default: "",
        line: "hover:bg-muted",
      },
      size: {
        sm: "",
        default: "",
      },
    },
    compoundVariants: [
      { variant: "default", size: "sm", className: "h-7 px-2.5" },
      { variant: "default", size: "default", className: "h-8" },
      { variant: "line", size: "sm", className: "h-8 px-2.5" },
      { variant: "line", size: "default", className: "h-9" },
    ],
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

const tabsIndicatorVariants = cva(
  "absolute z-0 transition-[left,top,width,height] duration-200 ease-out motion-reduce:transition-none",
  {
    variants: {
      variant: {
        default:
          "top-(--active-tab-top) left-(--active-tab-left) h-(--active-tab-height) w-(--active-tab-width) rounded-4xl bg-background shadow-sm ring-1 ring-border dark:bg-input",
        line: "rounded-full bg-primary data-[orientation=horizontal]:bottom-0 data-[orientation=horizontal]:left-(--active-tab-left) data-[orientation=horizontal]:h-0.5 data-[orientation=horizontal]:w-(--active-tab-width) data-[orientation=vertical]:start-0 data-[orientation=vertical]:top-(--active-tab-top) data-[orientation=vertical]:h-(--active-tab-height) data-[orientation=vertical]:w-0.5",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

/*
 * Keeps the active tab inside a list that scrolls sideways, on mount and
 * whenever the selection moves. Sets the list's own scroll rather than
 * calling scrollIntoView, which would also scroll the page.
 */
function useActiveTabInView(list: React.RefObject<HTMLDivElement | null>) {
  React.useEffect(() => {
    const node = list.current
    if (!node) return
    const reveal = (behavior: ScrollBehavior) => {
      if (node.scrollWidth <= node.clientWidth) return
      const active = node.querySelector<HTMLElement>(
        "[data-slot=tabs-trigger][data-active]"
      )
      if (!active) return
      const start = active.offsetLeft
      const end = start + active.offsetWidth
      const inset = 16
      let left: number | null = null
      if (start < node.scrollLeft) left = start - inset
      else if (end > node.scrollLeft + node.clientWidth)
        left = end - node.clientWidth + inset
      if (left === null) return
      const reduce = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches
      node.scrollTo({ left, behavior: reduce ? "instant" : behavior })
    }
    reveal("instant")
    const observer = new MutationObserver(() => reveal("smooth"))
    observer.observe(node, {
      subtree: true,
      attributes: true,
      attributeFilter: ["data-active"],
    })
    return () => observer.disconnect()
  }, [list])
}

type TabsListProps = TabsPrimitive.List.Props & {
  /** `default` is a segmented control: a muted track with the active tab raised on a pill. `line` is a bare row with a bar under the active tab, or beside it when vertical. */
  variant?: TabsVariant
  /** Height of the row: `sm` is 32px and `default` 36px, matching Button and Input. */
  size?: TabsSize
}

/** The row of tabs. Sets the variant and size for every trigger in it, and scrolls sideways when it doesn't fit. */
function TabsList({
  variant = "default",
  size = "default",
  className,
  children,
  ref,
  ...props
}: TabsListProps) {
  const listRef = React.useRef<HTMLDivElement>(null)
  useActiveTabInView(listRef)
  const context = React.useMemo(() => ({ variant, size }), [variant, size])

  return (
    <TabsListContext.Provider value={context}>
      <TabsPrimitive.List
        ref={mergeRefs(listRef, ref)}
        data-slot="tabs-list"
        data-variant={variant}
        data-size={size}
        className={cn(tabsListVariants({ variant, size }), className)}
        {...props}
      >
        {children}
        <TabsPrimitive.Indicator
          data-slot="tabs-indicator"
          className={tabsIndicatorVariants({ variant })}
        />
      </TabsPrimitive.List>
    </TabsListContext.Provider>
  )
}

/** One tab. Holds a label, and an icon or a Count beside it. */
function TabsTrigger({ className, ...props }: TabsPrimitive.Tab.Props) {
  const { variant, size } = React.useContext(TabsListContext)
  return (
    <TabsPrimitive.Tab
      data-slot="tabs-trigger"
      className={cn(tabsTriggerVariants({ variant, size }), className)}
      {...props}
    />
  )
}

/** The panel a tab shows. Only the active one is in the DOM unless `keepMounted` is set. */
function TabsContent({ className, ...props }: TabsPrimitive.Panel.Props) {
  return (
    <TabsPrimitive.Panel
      data-slot="tabs-content"
      className={cn(
        "min-w-0 flex-1 rounded-md text-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring-subtle",
        className
      )}
      {...props}
    />
  )
}

export {
  Tabs,
  TabsContent,
  TabsList,
  tabsListVariants,
  TabsTrigger,
  type TabsListProps,
  type TabsSize,
  type TabsVariant,
}
