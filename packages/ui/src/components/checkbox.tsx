"use client"

import * as React from "react"
import { Checkbox as CheckboxPrimitive } from "@base-ui/react/checkbox"

import { CheckIcon, MinusIcon } from "lucide-react"

import { cn } from "@workspace/ui/lib/utils"

// The box both parts draw, so a row's mark can't drift from the control.
const BOX =
  "relative flex size-4 shrink-0 items-center justify-center rounded-sm border border-input bg-input-subtle data-checked:border-primary data-checked:bg-primary data-checked:text-primary-foreground data-indeterminate:border-primary data-indeterminate:bg-primary data-indeterminate:text-primary-foreground [&_svg]:size-3.5"

function Checkbox({ className, ...props }: CheckboxPrimitive.Root.Props) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn(
        BOX,
        "peer transition-shadow outline-none group-has-focus-visible/field-label:ring-0 group-has-focus-visible/field-label:not-data-checked:border-input group-has-disabled/field:opacity-50 after:absolute after:-inset-x-3 after:-inset-y-2 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring-subtle aria-invalid:border-destructive aria-invalid:ring-[3px] aria-invalid:ring-destructive-ring aria-invalid:aria-checked:border-primary group-has-[:focus-visible]/field-label:data-checked:border-primary dark:data-checked:bg-primary data-disabled:cursor-not-allowed data-disabled:opacity-50",
        className
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        data-slot="checkbox-indicator"
        className="grid place-content-center text-current transition-none"
      >
        <CheckIcon className="in-data-indeterminate:hidden" />
        <MinusIcon className="hidden in-data-indeterminate:block" />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  )
}

/**
 * A checkbox's look without its behaviour, for a row that is already the
 * control, such as a listbox option, where a nested checkbox would be a
 * second control inside the first.
 */
function CheckboxMark({
  checked = false,
  className,
  ...props
}: Omit<React.ComponentProps<"span">, "children"> & {
  /** Ticked, empty, or `indeterminate` for a dash. */
  checked?: boolean | "indeterminate"
}) {
  return (
    <span
      aria-hidden="true"
      data-slot="checkbox-mark"
      data-checked={checked === true || undefined}
      data-indeterminate={checked === "indeterminate" || undefined}
      className={cn(BOX, className)}
      {...props}
    >
      {checked === true ? (
        <CheckIcon />
      ) : checked === "indeterminate" ? (
        <MinusIcon />
      ) : null}
    </span>
  )
}

export { Checkbox, CheckboxMark }
