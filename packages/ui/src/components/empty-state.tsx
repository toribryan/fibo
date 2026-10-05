import * as React from "react"
import { cva } from "class-variance-authority"

import { cn } from "@workspace/ui/lib/utils"

const emptyStateVariants = cva(
  "group/empty-state flex w-full min-w-0 flex-col items-center justify-center text-center text-balance",
  {
    variants: {
      size: {
        // A line or two inside a menu or popover.
        sm: "gap-1 px-2 py-6",
        default: "gap-2 px-6 py-12",
      },
    },
    defaultVariants: {
      size: "default",
    },
  }
)

/**
 * What shows where content would be: a title, why it's empty, and what to
 * do next.
 */
function EmptyState({
  size = "default",
  className,
  ...props
}: React.ComponentProps<"div"> & {
  /** `sm` for a menu or popover, `default` for a table, list or page. */
  size?: "sm" | "default"
}) {
  return (
    <div
      data-slot="empty-state"
      data-size={size}
      className={cn(emptyStateVariants({ size }), className)}
      {...props}
    />
  )
}

/** An icon above the title, in a muted tile. */
function EmptyStateMedia({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="empty-state-media"
      aria-hidden="true"
      className={cn(
        "mb-2 flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground group-data-[size=sm]/empty-state:mb-1 group-data-[size=sm]/empty-state:size-8 [&_svg:not([class*='size-'])]:size-5 group-data-[size=sm]/empty-state:[&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    />
  )
}

function EmptyStateTitle({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="empty-state-title"
      className={cn(
        "text-sm font-medium text-foreground group-data-[size=sm]/empty-state:font-normal group-data-[size=sm]/empty-state:text-muted-foreground",
        className
      )}
      {...props}
    />
  )
}

function EmptyStateDescription({
  className,
  ...props
}: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="empty-state-description"
      className={cn(
        "max-w-sm text-sm text-muted-foreground group-data-[size=sm]/empty-state:text-xs",
        className
      )}
      {...props}
    />
  )
}

/** One or two buttons, such as Clear filters or Add member. */
function EmptyStateActions({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="empty-state-actions"
      className={cn(
        "mt-2 flex flex-wrap items-center justify-center gap-2",
        className
      )}
      {...props}
    />
  )
}

export {
  EmptyState,
  EmptyStateActions,
  EmptyStateDescription,
  EmptyStateMedia,
  EmptyStateTitle,
  emptyStateVariants,
}
