"use client"

import * as React from "react"
import { SearchIcon, XIcon } from "lucide-react"

import { Button } from "@workspace/ui/components/button"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@workspace/ui/components/input-group"
import { Kbd, KbdGroup } from "@workspace/ui/components/kbd"
import { useFieldSize, type FieldSize } from "@workspace/ui/lib/field-size"
import { mergeRefs } from "@workspace/ui/lib/merge-refs"
import { cn } from "@workspace/ui/lib/utils"

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

// Mod+hotkey anywhere on the page, unless something nearer the key took it.
// Listeners run in the order they were added, so with two searches on one
// page the first mounted wins.
function useHotkey(hotkey: string | null, onPress: () => void) {
  const press = React.useEffectEvent(onPress)
  React.useEffect(() => {
    if (!hotkey) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented) return
      if (
        event.key.toLowerCase() === hotkey.toLowerCase() &&
        (event.metaKey || event.ctrlKey) &&
        !event.altKey &&
        !event.shiftKey
      ) {
        event.preventDefault()
        press()
      }
    }
    document.addEventListener("keydown", onKeyDown)
    return () => document.removeEventListener("keydown", onKeyDown)
  }, [hotkey])
}

function keyShortcuts(hotkey: string | null, mac: boolean) {
  return hotkey
    ? `${mac ? "Meta" : "Control"}+${hotkey.toUpperCase()}`
    : undefined
}

function Shortcut({ hotkey, mac }: { hotkey: string; mac: boolean }) {
  return (
    // aria-keyshortcuts on the control already announces it.
    <KbdGroup aria-hidden="true" className="pointer-coarse:hidden">
      <Kbd>{mac ? "⌘" : "Ctrl"}</Kbd>
      <Kbd>{hotkey.toUpperCase()}</Kbd>
    </KbdGroup>
  )
}

type SearchInputProps = Omit<
  React.ComponentProps<"input">,
  "type" | "size" | "value" | "defaultValue"
> & {
  /** `ghost` drops the border and fill, for a search at the top of a menu or dialog. */
  variant?: "default" | "ghost"
  /** Height of the field. Defaults to the size of the Field or FieldGroup around it. */
  size?: FieldSize
  /** Key that, with Cmd or Ctrl, focuses the field. `null` turns it off. */
  hotkey?: string | null
  /** The query, when controlled. */
  value?: string
  /** The query to start with, when uncontrolled. */
  defaultValue?: string
  /** Called with the new query on every change, including a clear. */
  onValueChange?: (value: string) => void
}

/** A search box with a Cmd+K shortcut and a clear button. */
function SearchInput({
  variant = "default",
  size,
  hotkey = "k",
  placeholder = "Search…",
  value: valueProp,
  defaultValue = "",
  onValueChange,
  onChange,
  onKeyDown,
  disabled,
  className,
  ref,
  ...props
}: SearchInputProps) {
  const [uncontrolled, setUncontrolled] = React.useState(defaultValue)
  const value = valueProp ?? uncontrolled
  const inputRef = React.useRef<HTMLInputElement>(null)
  const mac = useIsMac()

  const setValue = (next: string) => {
    setUncontrolled(next)
    onValueChange?.(next)
  }

  const clear = () => {
    setValue("")
    inputRef.current?.focus()
  }

  useHotkey(disabled ? null : hotkey, () => {
    inputRef.current?.focus()
    inputRef.current?.select()
  })

  return (
    <InputGroup
      variant={variant}
      size={size}
      data-slot="search-input"
      className={className}
    >
      <InputGroupAddon>
        <SearchIcon aria-hidden="true" />
      </InputGroupAddon>
      <InputGroupInput
        ref={mergeRefs(inputRef, ref)}
        aria-label="Search"
        aria-keyshortcuts={disabled ? undefined : keyShortcuts(hotkey, mac)}
        placeholder={placeholder}
        value={value}
        disabled={disabled}
        onChange={(event) => {
          onChange?.(event)
          setValue(event.target.value)
        }}
        onKeyDown={(event) => {
          onKeyDown?.(event)
          if (event.defaultPrevented || event.key !== "Escape") return
          // Escape clears first, then leaves the field. Stopping it keeps
          // a dialog around the field open while it only clears.
          if (value) {
            event.preventDefault()
            event.stopPropagation()
            setValue("")
          } else event.currentTarget.blur()
        }}
        // The clear button below replaces the browser's own.
        className="[&::-webkit-search-cancel-button]:appearance-none"
        {...props}
        type="search"
      />
      {value ? (
        <InputGroupAddon align="inline-end">
          <Button
            variant="ghost"
            size="icon-xs"
            aria-label="Clear search"
            data-slot="search-input-clear"
            onClick={clear}
          >
            <XIcon aria-hidden="true" />
          </Button>
        </InputGroupAddon>
      ) : hotkey && !disabled ? (
        <InputGroupAddon align="inline-end">
          <Shortcut hotkey={hotkey} mac={mac} />
        </InputGroupAddon>
      ) : null}
    </InputGroup>
  )
}

type SearchTriggerProps = Omit<
  React.ComponentProps<typeof Button>,
  "size" | "variant"
> & {
  /** Height, matching a Button of the same size. Defaults to the size of the Field or FieldGroup around it. */
  size?: FieldSize
  /** Key that, with Cmd or Ctrl, presses the button. `null` turns it off. */
  hotkey?: string | null
}

/**
 * A compact button with a search icon and its shortcut, for a header whose
 * search opens elsewhere, such as in a Command menu.
 */
function SearchTrigger({
  size: sizeProp,
  hotkey = "k",
  disabled,
  className,
  ref,
  ...props
}: SearchTriggerProps) {
  const size = useFieldSize(sizeProp)
  const buttonRef = React.useRef<HTMLButtonElement>(null)
  const mac = useIsMac()

  useHotkey(disabled ? null : hotkey, () => buttonRef.current?.click())

  return (
    <Button
      ref={mergeRefs(buttonRef, ref)}
      variant="ghost"
      size={size}
      disabled={disabled}
      aria-label="Search"
      aria-keyshortcuts={disabled ? undefined : keyShortcuts(hotkey, mac)}
      className={cn("gap-2 px-2 text-muted-foreground", className)}
      {...props}
      // After the spread, so a Command menu that renders it as its trigger
      // doesn't swap in its own slot.
      data-slot="search-trigger"
      type="button"
    >
      <SearchIcon aria-hidden="true" />
      {hotkey ? <Shortcut hotkey={hotkey} mac={mac} /> : null}
    </Button>
  )
}

export { SearchInput, SearchTrigger }
export type { SearchInputProps, SearchTriggerProps }
