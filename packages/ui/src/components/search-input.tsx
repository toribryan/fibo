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

function Shortcut({ hotkey, mac }: { hotkey: string; mac: boolean }) {
  return (
    // aria-keyshortcuts on the control already announces it.
    <KbdGroup aria-hidden="true" className="pointer-coarse:hidden">
      <Kbd>{mac ? "⌘" : "Ctrl"}</Kbd>
      <Kbd>{hotkey.toUpperCase()}</Kbd>
    </KbdGroup>
  )
}

type SearchInputSharedProps = {
  /** Key that, with Cmd or Ctrl, focuses the field or presses the button. Null turns it off. */
  hotkey?: string | null
  /** Height, matching an Input or Button of the same size. */
  size?: FieldSize
  /** Accessible name. The button shows no text, so this is all a screen reader hears. */
  label?: string
}

type SearchInputFieldProps = SearchInputSharedProps &
  Omit<
    React.ComponentProps<"input">,
    "type" | "size" | "value" | "defaultValue"
  > & {
    /** `field` is a search box; `button` is a compact trigger for a search that opens elsewhere, such as Command menu. */
    type?: "field"
    /** The query, when controlled. */
    value?: string
    /** The query to start with, when uncontrolled. */
    defaultValue?: string
    /** Called with the new query on every change, including a clear. */
    onValueChange?: (value: string) => void
  }

type SearchInputButtonProps = SearchInputSharedProps &
  Omit<React.ComponentProps<typeof Button>, "type" | "size" | "variant"> & {
    /** `field` is a search box; `button` is a compact trigger for a search that opens elsewhere, such as Command menu. */
    type: "button"
  }

type SearchInputProps = SearchInputFieldProps | SearchInputButtonProps

/**
 * A search box with a Cmd+K hint, or the same search folded into a small
 * button for a header, that opens a Command menu or dialog.
 */
function SearchInput(props: SearchInputProps) {
  return props.type === "button" ? (
    <SearchButton {...props} />
  ) : (
    <SearchField {...props} />
  )
}

function SearchField({
  hotkey = "k",
  size,
  label = "Search",
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
}: SearchInputFieldProps) {
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
    <div
      data-slot="search-input"
      data-type="field"
      className={cn("w-full", className)}
    >
      <InputGroup size={size}>
        <InputGroupAddon>
          <SearchIcon aria-hidden="true" />
        </InputGroupAddon>
        <InputGroupInput
          ref={mergeRefs(inputRef, ref)}
          aria-label={label}
          aria-keyshortcuts={
            hotkey
              ? `${mac ? "Meta" : "Control"}+${hotkey.toUpperCase()}`
              : undefined
          }
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
        ) : hotkey ? (
          <InputGroupAddon align="inline-end">
            <Shortcut hotkey={hotkey} mac={mac} />
          </InputGroupAddon>
        ) : null}
      </InputGroup>
    </div>
  )
}

function SearchButton({
  hotkey = "k",
  size: sizeProp,
  label = "Search",
  disabled,
  className,
  ref,
  ...props
}: SearchInputButtonProps) {
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
      aria-label={label}
      aria-keyshortcuts={
        hotkey
          ? `${mac ? "Meta" : "Control"}+${hotkey.toUpperCase()}`
          : undefined
      }
      className={cn("gap-2 px-2 text-muted-foreground", className)}
      {...props}
      // After the spread, so a Command menu that renders it as its trigger
      // doesn't swap in its own slot.
      data-slot="search-input"
      data-type="button"
      type="button"
    >
      <SearchIcon aria-hidden="true" />
      {hotkey ? <Shortcut hotkey={hotkey} mac={mac} /> : null}
    </Button>
  )
}

export { SearchInput }
export type { SearchInputProps }
