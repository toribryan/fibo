"use client"

import * as React from "react"

import { cn } from "@workspace/ui/lib/utils"

/*
 * The wrapper scrolls sideways so a wide table never widens the page. While
 * it overflows it's a named region in the tab order, so keyboard users can
 * scroll it too. The name goes on one of the two, never both, so it isn't
 * announced twice: `aria-label` moves to the region, and a caption names it
 * when there's no label.
 */
function Table({
  className,
  "aria-label": label,
  ...props
}: React.ComponentProps<"table">) {
  const containerRef = React.useRef<HTMLDivElement>(null)
  const [overflowing, setOverflowing] = React.useState(false)
  const [captionId, setCaptionId] = React.useState<string>()

  React.useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const update = () => {
      setOverflowing(container.scrollWidth > container.clientWidth + 1)
      setCaptionId(
        container.querySelector(":scope > table > caption")?.id || undefined
      )
    }
    update()
    const observer = new ResizeObserver(update)
    observer.observe(container)
    if (container.firstElementChild) {
      observer.observe(container.firstElementChild)
    }
    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={containerRef}
      data-slot="table-container"
      tabIndex={overflowing ? 0 : undefined}
      role={overflowing ? "region" : undefined}
      aria-label={
        overflowing && (label || !captionId)
          ? (label ?? "Scrollable table")
          : undefined
      }
      aria-labelledby={overflowing && !label ? captionId : undefined}
      className="relative w-full overflow-x-auto outline-none focus-visible:ring-[3px] focus-visible:ring-ring-subtle focus-visible:ring-inset"
    >
      <table
        data-slot="table"
        className={cn(
          "w-full caption-bottom border-separate border-spacing-0 text-sm",
          className
        )}
        aria-label={overflowing ? undefined : label}
        {...props}
      />
    </div>
  )
}

function TableHeader({ className, ...props }: React.ComponentProps<"thead">) {
  return (
    <thead
      data-slot="table-header"
      className={cn("bg-muted", className)}
      {...props}
    />
  )
}

function TableBody({ className, ...props }: React.ComponentProps<"tbody">) {
  return (
    <tbody
      data-slot="table-body"
      className={cn("[&_tr:last-child>*]:border-b-0", className)}
      {...props}
    />
  )
}

function TableFooter({ className, ...props }: React.ComponentProps<"tfoot">) {
  return (
    <tfoot
      data-slot="table-footer"
      className={cn(
        "bg-muted font-medium [&>tr>*]:border-t [&>tr>*]:border-b-0 [&>tr>*]:border-border",
        className
      )}
      {...props}
    />
  )
}

/*
 * Borders sit on the cells, not the row: a separated table can't draw a row
 * border, and a pinned cell has to carry its own to stay lined up.
 */
function TableRow({ className, ...props }: React.ComponentProps<"tr">) {
  return (
    <tr
      data-slot="table-row"
      className={cn(
        "bg-background transition-colors data-selected:bg-muted [&>*]:border-b [&>*]:border-border [tbody>&]:hover:bg-muted",
        className
      )}
      {...props}
    />
  )
}

/*
 * Labels are foreground, not muted: muted-foreground on the muted header
 * band is 4.34:1, under AA for 12px text.
 */
function TableHead({ className, ...props }: React.ComponentProps<"th">) {
  return (
    <th
      data-slot="table-head"
      className={cn(
        "h-9 bg-muted px-2 text-left align-middle text-xs font-medium whitespace-nowrap text-foreground [&:has([role=checkbox])]:w-9 [&:has([role=checkbox])]:pl-3",
        className
      )}
      {...props}
    />
  )
}

function TableCell({ className, ...props }: React.ComponentProps<"td">) {
  return (
    <td
      data-slot="table-cell"
      className={cn(
        "h-10 bg-inherit p-2 align-middle whitespace-nowrap [&:has([role=checkbox])]:w-9 [&:has([role=checkbox])]:pl-3",
        className
      )}
      {...props}
    />
  )
}

function TableCaption({
  className,
  id,
  ...props
}: React.ComponentProps<"caption">) {
  // Table reads this id to name its scroll region after the caption.
  const fallbackId = React.useId()
  return (
    <caption
      id={id ?? fallbackId}
      data-slot="table-caption"
      className={cn("mt-4 text-sm text-muted-foreground", className)}
      {...props}
    />
  )
}

export {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
}
