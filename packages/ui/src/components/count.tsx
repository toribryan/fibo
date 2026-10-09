import * as React from "react"

import { cn } from "@workspace/ui/lib/utils"
import {
  formatCount,
  type FormatCountOptions,
} from "@workspace/ui/lib/format-count"

type CountProps = Omit<React.ComponentProps<"span">, "children"> &
  FormatCountOptions & {
    /** The number. */
    value: number
    /** What screen readers hear, such as `(n) => \`${n} unread\``. Defaults to the exact number when the shown one is capped or shortened. `null` hides the count when its neighbor already says it. */
    label?: string | ((value: number) => string) | null
  }

/**
 * A number as people take it in at a glance: capped at 99+, shortened to
 * 1.2K, or signed as +4, in figures that don't shift as they change. It says
 * the exact number, or your label, to screen readers.
 */
function Count({
  value,
  max,
  notation,
  plus,
  locale,
  label,
  className,
  ...props
}: CountProps) {
  const { shown, exact } = formatCount(value, { max, notation, plus, locale })
  const spoken =
    label === null
      ? null
      : typeof label === "function"
        ? label(value)
        : (label ?? (shown === exact ? null : exact))

  return (
    <span
      data-slot="count"
      aria-hidden={label === null || undefined}
      className={cn("tabular-nums", className)}
      {...props}
    >
      {spoken ? (
        <>
          <span aria-hidden="true">{shown}</span>
          <span className="sr-only">{spoken}</span>
        </>
      ) : (
        shown
      )}
    </span>
  )
}

export { Count, formatCount, type CountProps }
