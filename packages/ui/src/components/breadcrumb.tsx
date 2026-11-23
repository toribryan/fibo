"use client"

import * as React from "react"
import { mergeProps } from "@base-ui/react/merge-props"
import { useRender } from "@base-ui/react/use-render"
import {
  ChevronRightIcon,
  ChevronsUpDownIcon,
  MoreHorizontalIcon,
} from "lucide-react"

import { MenuTrigger } from "@workspace/ui/components/menu"
import { cn } from "@workspace/ui/lib/utils"

function Breadcrumb({
  "aria-label": ariaLabel = "Breadcrumb",
  ...props
}: React.ComponentProps<"nav">) {
  return <nav data-slot="breadcrumb" aria-label={ariaLabel} {...props} />
}

function BreadcrumbList({ className, ...props }: React.ComponentProps<"ol">) {
  return (
    <ol
      data-slot="breadcrumb-list"
      className={cn(
        "flex flex-wrap items-center gap-1.5 text-sm break-words text-muted-foreground",
        className
      )}
      {...props}
    />
  )
}

function BreadcrumbItem({ className, ...props }: React.ComponentProps<"li">) {
  return (
    <li
      data-slot="breadcrumb-item"
      className={cn("inline-flex min-w-0 items-center gap-1.5", className)}
      {...props}
    />
  )
}

const focusRing =
  "rounded-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring-subtle"

function BreadcrumbLink({
  className,
  render,
  ...props
}: useRender.ComponentProps<"a">) {
  return useRender({
    render: render ?? <a />,
    props: mergeProps<"a">(
      {
        "data-slot": "breadcrumb-link",
        className: cn(
          focusRing,
          "truncate transition-colors hover:text-foreground",
          className
        ),
      } as React.ComponentProps<"a">,
      props
    ),
  })
}

function BreadcrumbPage({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="breadcrumb-page"
      aria-current="page"
      className={cn("truncate font-medium text-foreground", className)}
      {...props}
    />
  )
}

function BreadcrumbSeparator({
  children,
  className,
  ...props
}: React.ComponentProps<"li">) {
  return (
    <li
      data-slot="breadcrumb-separator"
      role="presentation"
      aria-hidden="true"
      className={cn(
        "flex items-center text-muted-foreground [&>svg]:size-3.5",
        className
      )}
      {...props}
    >
      {children ?? <ChevronRightIcon />}
    </li>
  )
}

function BreadcrumbEllipsis({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="breadcrumb-ellipsis"
      className={cn("flex size-6 items-center justify-center", className)}
      {...props}
    >
      <MoreHorizontalIcon className="size-4" aria-hidden="true" />
      <span className="sr-only">More pages</span>
    </span>
  )
}

function BreadcrumbMenuTrigger({
  className,
  icon,
  children,
  ...props
}: React.ComponentProps<typeof MenuTrigger> & {
  /** An icon before the label, such as the kind of thing being switched. */
  icon?: React.ReactNode
}) {
  return (
    <MenuTrigger
      data-slot="breadcrumb-menu-trigger"
      className={cn(
        "-mx-1 inline-flex h-7 min-w-0 items-center gap-1.5 rounded-4xl px-2 font-medium text-foreground transition-colors outline-none select-none hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring-subtle data-popup-open:bg-muted [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    >
      {icon ? (
        <span
          data-slot="breadcrumb-menu-icon"
          aria-hidden="true"
          className="flex text-muted-foreground"
        >
          {icon}
        </span>
      ) : null}
      <span className="truncate">{children}</span>
      <ChevronsUpDownIcon
        aria-hidden="true"
        className="size-3.5 text-muted-foreground"
      />
    </MenuTrigger>
  )
}

export {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbMenuTrigger,
  BreadcrumbPage,
  BreadcrumbSeparator,
}
