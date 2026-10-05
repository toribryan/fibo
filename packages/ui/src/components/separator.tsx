"use client"

import * as React from "react"
import { Separator as SeparatorPrimitive } from "@base-ui/react/separator"

import { cn } from "@workspace/ui/lib/utils"

/**
 * A rule between groups of content. Give it children for a labelled rule,
 * such as a date in a conversation: a line, the label, and a line.
 */
function Separator({
  orientation = "horizontal",
  className,
  children,
  "aria-label": ariaLabel,
  ...props
}: SeparatorPrimitive.Props) {
  if (children === undefined || children === null) {
    return (
      <SeparatorPrimitive
        data-slot="separator"
        orientation={orientation}
        aria-label={ariaLabel}
        className={cn(
          "shrink-0 bg-border data-[orientation=horizontal]:h-px data-[orientation=horizontal]:w-full data-[orientation=vertical]:w-px data-[orientation=vertical]:self-stretch",
          className
        )}
        {...props}
      />
    )
  }
  // A separator's children are presentational to screen readers, so a text
  // label is also its name.
  return (
    <SeparatorPrimitive
      data-slot="separator"
      orientation="horizontal"
      aria-label={
        ariaLabel ?? (typeof children === "string" ? children : undefined)
      }
      className={cn(
        "flex w-full items-center gap-3 text-xs font-medium text-muted-foreground",
        className
      )}
      {...props}
    >
      <span data-slot="separator-line" className="h-px flex-1 bg-border" />
      <span data-slot="separator-label" className="shrink-0">
        {children}
      </span>
      <span data-slot="separator-line" className="h-px flex-1 bg-border" />
    </SeparatorPrimitive>
  )
}

export { Separator }
