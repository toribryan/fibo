"use client"

import * as React from "react"
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react"

import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"

type PaginationNoun = string | { one: string; other: string }

type PaginationProps = Omit<React.ComponentProps<"nav">, "onChange"> & {
  /** The current page, counting from 1. Pass it to control the page. */
  page?: number
  /** The page to start on when the page isn't controlled. */
  defaultPage?: number
  /** How many pages there are. An empty list still has one page. */
  pageCount: number
  /** Called with the new page when Previous or Next is pressed. */
  onPageChange?: (page: number) => void
  /** Rows per page. With totalCount, shows the range, such as “1 to 25 of 10,000”. */
  pageSize?: number
  /** How many rows there are across every page. */
  totalCount?: number
  /** What the rows are, after the range: “agents”, or { one, other } for one row. */
  noun?: PaginationNoun
}

const numberFormat = new Intl.NumberFormat("en-US")

function formatRange(
  page: number,
  pageSize: number,
  totalCount: number,
  noun?: PaginationNoun
) {
  const first = totalCount === 0 ? 0 : (page - 1) * pageSize + 1
  const last = Math.min(page * pageSize, totalCount)
  const label =
    noun === undefined
      ? ""
      : typeof noun === "string"
        ? ` ${noun}`
        : ` ${totalCount === 1 ? noun.one : noun.other}`
  return `${numberFormat.format(first)} to ${numberFormat.format(last)} of ${numberFormat.format(totalCount)}${label}`
}

function Pagination({
  className,
  page: pageProp,
  defaultPage = 1,
  pageCount,
  onPageChange,
  pageSize,
  totalCount,
  noun,
  "aria-label": ariaLabel = "Pagination",
  ...props
}: PaginationProps) {
  const [uncontrolledPage, setUncontrolledPage] = React.useState(defaultPage)
  const lastPage = Math.max(1, pageCount)
  const page = Math.min(Math.max(1, pageProp ?? uncontrolledPage), lastPage)

  const goTo = (next: number) => {
    if (next < 1 || next > lastPage || next === page) return
    if (pageProp === undefined) setUncontrolledPage(next)
    onPageChange?.(next)
  }

  return (
    <nav
      data-slot="pagination"
      aria-label={ariaLabel}
      className={cn(
        "flex items-center justify-end gap-4 text-sm text-muted-foreground",
        className
      )}
      {...props}
    >
      {pageSize !== undefined && totalCount !== undefined ? (
        <span data-slot="pagination-range">
          {formatRange(page, pageSize, totalCount, noun)}
        </span>
      ) : null}
      <div className="flex items-center gap-1">
        {/*
         * Focusable when disabled, so pressing Next onto the last page
         * doesn't drop keyboard focus to the body.
         */}
        <Button
          data-slot="pagination-previous"
          variant="outline"
          size="icon-sm"
          aria-label="Previous page"
          disabled={page <= 1}
          focusableWhenDisabled
          className="data-disabled:pointer-events-none data-disabled:opacity-50"
          onClick={() => goTo(page - 1)}
        >
          <ChevronLeftIcon />
        </Button>
        <span
          data-slot="pagination-page"
          className="min-w-12 text-center text-foreground tabular-nums"
        >
          <span aria-hidden="true">
            {numberFormat.format(page)} / {numberFormat.format(lastPage)}
          </span>
          <span className="sr-only" aria-live="polite">
            Page {numberFormat.format(page)} of {numberFormat.format(lastPage)}
          </span>
        </span>
        <Button
          data-slot="pagination-next"
          variant="outline"
          size="icon-sm"
          aria-label="Next page"
          disabled={page >= lastPage}
          focusableWhenDisabled
          className="data-disabled:pointer-events-none data-disabled:opacity-50"
          onClick={() => goTo(page + 1)}
        >
          <ChevronRightIcon />
        </Button>
      </div>
    </nav>
  )
}

export { formatRange, Pagination }
export type { PaginationNoun, PaginationProps }
