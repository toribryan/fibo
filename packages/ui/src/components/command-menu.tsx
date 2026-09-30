"use client"

import * as React from "react"
import { Autocomplete as AutocompletePrimitive } from "@base-ui/react/autocomplete"
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog"
import { SearchIcon } from "lucide-react"

import { Button } from "@workspace/ui/components/button"
import { Kbd, KbdGroup } from "@workspace/ui/components/kbd"
import { cn } from "@workspace/ui/lib/utils"

type CommandMenuItem = {
  /** Unique across the whole menu. Passed back to `onSelect`. */
  value: string
  label: string
  icon?: React.ReactNode
  /** Keys shown on the right, such as `["⌘", "N"]`. Display only. */
  shortcut?: string[]
  /** Extra words a search matches, such as synonyms. */
  keywords?: string[]
  disabled?: boolean
  /** Runs when the item is picked, before the menu closes. */
  onSelect?: () => void
}

type CommandMenuGroup = {
  label: string
  items: CommandMenuItem[]
}

type CommandMenuProps = {
  /** The commands, in groups shown in order. */
  groups: CommandMenuGroup[]
  /** Called with every item picked, after the item's own `onSelect`. */
  onSelect?: (item: CommandMenuItem) => void
  /** Whether the menu is open, when you control it. */
  open?: boolean
  /** Whether the menu starts open, when it keeps its own state. */
  defaultOpen?: boolean
  /** Called when the menu opens or closes. */
  onOpenChange?: (open: boolean) => void
  /**
   * The letter that toggles the menu with Cmd on macOS or Ctrl elsewhere.
   * `null` turns the shortcut off.
   */
  hotkey?: string | null
  /**
   * An element that opens the menu, in place of the default search button.
   * It must forward its ref and props, as fibo's Button does. `null` renders
   * no trigger, for a menu opened only by the shortcut or from state.
   */
  trigger?: React.ReactElement | null
  /** Hint in the search box. */
  placeholder?: string
  /** Shown when a search matches nothing. */
  emptyText?: React.ReactNode
  /** Names the dialog and the search box for assistive technology. */
  label?: string
  /** Whether to show the row of keyboard hints under the list. */
  hints?: boolean
  /** Where the dialog portals to. Defaults to the body. */
  container?: DialogPrimitive.Portal.Props["container"]
  /** Classes for the trigger. */
  className?: string
  /** Classes for the dialog. */
  popupClassName?: string
}

function useControllable<T>(
  value: T | undefined,
  defaultValue: T,
  onChange: ((value: T) => void) | undefined
) {
  const [own, setOwn] = React.useState(defaultValue)
  const current = value ?? own
  const set = (next: T) => {
    if (value === undefined) setOwn(next)
    onChange?.(next)
  }
  return [current, set] as const
}

const noSubscription = () => () => {}

// The platform never changes, so there is nothing to subscribe to. The
// server snapshot keeps the first render hydration-safe.
function useIsMac() {
  return React.useSyncExternalStore(
    noSubscription,
    () => /mac|iphone|ipad/i.test(navigator.platform || navigator.userAgent),
    () => false
  )
}

function matches(item: CommandMenuItem, query: string) {
  const term = query.trim().toLowerCase()
  if (!term) return true
  return [item.label, ...(item.keywords ?? [])].some((text) =>
    text.toLowerCase().includes(term)
  )
}

/**
 * A search dialog of grouped commands, opened with Cmd+K or Ctrl+K. Typing
 * filters every group at once, the first match is always highlighted, and
 * Enter runs it.
 */
function CommandMenu({
  groups,
  onSelect,
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  hotkey = "k",
  trigger,
  placeholder = "Type a command or search…",
  emptyText = "No results found",
  label = "Command menu",
  hints = true,
  container,
  className,
  popupClassName,
}: CommandMenuProps) {
  const [open, setOpen] = useControllable(openProp, defaultOpen, onOpenChange)
  const [query, setQuery] = React.useState("")
  const mac = useIsMac()
  const toggle = React.useEffectEvent(() => setOpen(!open))

  React.useEffect(() => {
    if (!hotkey) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (
        event.key.toLowerCase() === hotkey.toLowerCase() &&
        (event.metaKey || event.ctrlKey) &&
        !event.altKey &&
        !event.shiftKey
      ) {
        event.preventDefault()
        toggle()
      }
    }
    document.addEventListener("keydown", onKeyDown)
    return () => document.removeEventListener("keydown", onKeyDown)
  }, [hotkey])

  const run = (item: CommandMenuItem) => {
    if (item.disabled) return
    item.onSelect?.()
    onSelect?.(item)
    setOpen(false)
  }

  const shortcut = hotkey ? (
    <KbdGroup>
      <Kbd>{mac ? "⌘" : "Ctrl"}</Kbd>
      <Kbd>{hotkey.toUpperCase()}</Kbd>
    </KbdGroup>
  ) : null

  return (
    <DialogPrimitive.Root
      open={open}
      onOpenChange={(next) => setOpen(next)}
      onOpenChangeComplete={(isOpen) => {
        if (!isOpen) setQuery("")
      }}
    >
      {trigger === null ? null : trigger ? (
        <DialogPrimitive.Trigger
          data-slot="command-menu-trigger"
          render={trigger}
          className={className}
        />
      ) : (
        <DialogPrimitive.Trigger
          data-slot="command-menu-trigger"
          render={<Button variant="outline" />}
          className={cn(
            "w-60 justify-start text-muted-foreground has-data-[slot=kbd-group]:pr-1.5",
            className
          )}
        >
          <SearchIcon data-icon="inline-start" aria-hidden="true" />
          <span className="flex-1 text-left">Search…</span>
          {shortcut}
        </DialogPrimitive.Trigger>
      )}
      <DialogPrimitive.Portal container={container}>
        <DialogPrimitive.Backdrop
          data-slot="command-menu-backdrop"
          className="fixed inset-0 z-50 bg-backdrop duration-150 motion-reduce:animate-none data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0"
        />
        <DialogPrimitive.Popup
          data-slot="command-menu"
          className={cn(
            "fixed top-[15vh] left-1/2 z-50 flex max-h-[min(28rem,70vh)] w-[calc(100vw-2rem)] max-w-xl -translate-x-1/2 flex-col overflow-hidden rounded-xl border border-border bg-popover text-popover-foreground shadow-lg outline-hidden duration-150 motion-reduce:animate-none data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
            popupClassName
          )}
        >
          <DialogPrimitive.Title className="sr-only">
            {label}
          </DialogPrimitive.Title>
          <AutocompletePrimitive.Root
            inline
            open
            items={groups}
            value={query}
            onValueChange={setQuery}
            filter={matches}
            itemToStringValue={(item: CommandMenuItem) => item.label}
            autoHighlight="always"
            keepHighlight
          >
            <div
              data-slot="command-menu-search"
              className="flex h-12 shrink-0 items-center gap-2 border-b border-border px-4"
            >
              <SearchIcon
                aria-hidden="true"
                className="size-4 shrink-0 text-muted-foreground"
              />
              <AutocompletePrimitive.Input
                aria-label={label}
                placeholder={placeholder}
                spellCheck={false}
                className="h-full min-w-0 flex-1 bg-transparent text-sm outline-hidden placeholder:text-muted-foreground"
              />
            </div>
            <AutocompletePrimitive.Empty
              data-slot="command-menu-empty"
              className="px-2 py-10 text-center text-sm text-muted-foreground empty:hidden empty:p-0"
            >
              {emptyText}
            </AutocompletePrimitive.Empty>
            <AutocompletePrimitive.List
              data-slot="command-menu-list"
              className="min-h-0 flex-1 scroll-py-2 overflow-y-auto p-2 outline-hidden empty:hidden"
            >
              {(group: CommandMenuGroup) => (
                <AutocompletePrimitive.Group
                  key={group.label}
                  items={group.items}
                  data-slot="command-menu-group"
                  className="not-first:mt-2"
                >
                  <AutocompletePrimitive.GroupLabel
                    data-slot="command-menu-group-label"
                    className="px-2 pt-1 pb-1.5 text-xs text-muted-foreground"
                  >
                    {group.label}
                  </AutocompletePrimitive.GroupLabel>
                  <AutocompletePrimitive.Collection>
                    {(item: CommandMenuItem) => (
                      <AutocompletePrimitive.Item
                        key={item.value}
                        value={item}
                        disabled={item.disabled}
                        onClick={() => run(item)}
                        data-slot="command-menu-item"
                        className="flex h-9 cursor-default items-center gap-2 rounded-md px-2 text-sm outline-hidden select-none data-highlighted:bg-accent data-highlighted:text-accent-foreground data-disabled:pointer-events-none data-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4"
                      >
                        {item.icon ? (
                          <span
                            aria-hidden="true"
                            className="flex text-muted-foreground"
                          >
                            {item.icon}
                          </span>
                        ) : null}
                        <span className="flex-1 truncate">{item.label}</span>
                        {item.shortcut ? (
                          <KbdGroup data-slot="command-menu-shortcut">
                            {item.shortcut.map((key) => (
                              <Kbd key={key}>{key}</Kbd>
                            ))}
                          </KbdGroup>
                        ) : null}
                      </AutocompletePrimitive.Item>
                    )}
                  </AutocompletePrimitive.Collection>
                </AutocompletePrimitive.Group>
              )}
            </AutocompletePrimitive.List>
          </AutocompletePrimitive.Root>
          {hints ? (
            <div
              data-slot="command-menu-hints"
              aria-hidden="true"
              className="flex h-10 shrink-0 items-center gap-4 border-t border-border px-4 text-xs text-muted-foreground"
            >
              <span className="flex items-center gap-1.5">
                <Kbd>↵</Kbd>
                Run
              </span>
              <span className="flex items-center gap-1.5">
                <KbdGroup>
                  <Kbd>↑</Kbd>
                  <Kbd>↓</Kbd>
                </KbdGroup>
                Move
              </span>
              <span className="flex items-center gap-1.5">
                <Kbd>Esc</Kbd>
                Close
              </span>
            </div>
          ) : null}
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}

export { CommandMenu }
export type { CommandMenuGroup, CommandMenuItem, CommandMenuProps }
