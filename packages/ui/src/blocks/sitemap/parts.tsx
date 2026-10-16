"use client"

import * as React from "react"
import { Collapsible as CollapsiblePrimitive } from "@base-ui/react/collapsible"
import { mergeProps } from "@base-ui/react/merge-props"
import { useRender } from "@base-ui/react/use-render"
import { ChevronRightIcon, SearchIcon } from "lucide-react"

import { Button } from "@workspace/ui/components/button"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@workspace/ui/components/input-group"
import { cn } from "@workspace/ui/lib/utils"

/**
 * The page frame: a header, a search, then every destination grouped by job.
 * Its layout follows its own width, not the window's, so it reads the same in
 * a full page, a docs canvas or a preview pane.
 */
function SitemapLayout({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sitemap"
      className={cn("@container/sitemap w-full", className)}
      {...props}
    >
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-10 @3xl/sitemap:px-12 @3xl/sitemap:py-14">
        {children}
      </div>
    </div>
  )
}

function SitemapHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sitemap-header"
      className={cn("flex flex-col gap-2", className)}
      {...props}
    />
  )
}

function SitemapTitle({ className, ...props }: React.ComponentProps<"h1">) {
  return (
    <h1
      data-slot="sitemap-title"
      className={cn(
        "text-2xl font-semibold tracking-tight text-foreground @3xl/sitemap:text-4xl",
        className
      )}
      {...props}
    />
  )
}

function SitemapDescription({
  className,
  ...props
}: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="sitemap-description"
      className={cn(
        "text-base text-muted-foreground @3xl/sitemap:text-lg",
        className
      )}
      {...props}
    />
  )
}

/**
 * A search form for the page. Give it `onSearch` to handle the query in the
 * app, or an `action` to send it to an existing results route as `?q=`.
 */
function SitemapSearch({
  label = "Search locations",
  placeholder = "Search city, state or ZIP code",
  submitLabel = "Search",
  name = "q",
  defaultValue,
  sticky = false,
  onSearch,
  onSubmit,
  className,
  ...props
}: Omit<React.ComponentProps<"form">, "onSubmit"> & {
  /** Names the field for screen readers, and the search landmark. */
  label?: string
  /** Hint text inside the empty field. */
  placeholder?: string
  /** The submit button's text. */
  submitLabel?: string
  /** The query parameter the field submits as. */
  name?: string
  /** The query the field starts with. */
  defaultValue?: string
  /** Pins the search under the page's own header as the page scrolls. Set `top` through `--sitemap-sticky-top`. */
  sticky?: boolean
  /** Called with the trimmed query on submit, in place of a page load. */
  onSearch?: (query: string) => void
  /** Called on submit before `onSearch`. */
  onSubmit?: React.FormEventHandler<HTMLFormElement>
}) {
  return (
    <form
      data-slot="sitemap-search"
      data-sticky={sticky || undefined}
      role="search"
      aria-label={label}
      onSubmit={(event) => {
        onSubmit?.(event)
        if (!onSearch || event.defaultPrevented) return
        event.preventDefault()
        const query = new FormData(event.currentTarget).get(name)
        onSearch(String(query ?? "").trim())
      }}
      className={cn(
        "flex flex-col gap-2 @2xl/sitemap:flex-row",
        // On a phone the pinned bar stays one row high, so it never takes
        // over the screen it is helping someone scroll.
        "data-sticky:sticky data-sticky:top-(--sitemap-sticky-top,0px) data-sticky:z-10 data-sticky:-mx-4 data-sticky:flex-row data-sticky:bg-background data-sticky:px-4 data-sticky:py-3 @3xl/sitemap:data-sticky:-mx-12 @3xl/sitemap:data-sticky:px-12",
        className
      )}
      {...props}
    >
      <InputGroup className="h-11 min-h-11 flex-1">
        <InputGroupAddon>
          <SearchIcon aria-hidden="true" />
        </InputGroupAddon>
        <InputGroupInput
          type="search"
          name={name}
          defaultValue={defaultValue}
          placeholder={placeholder}
          aria-label={label}
          autoComplete="off"
        />
      </InputGroup>
      <Button type="submit" size="lg" className="h-11 px-5">
        {submitLabel}
      </Button>
    </form>
  )
}

/** A short row of popular destinations under the search. */
function SitemapSuggestions({
  label = "Popular locations",
  className,
  children,
  ...props
}: React.ComponentProps<"div"> & {
  /** Says what the suggestions are, above them and to screen readers. */
  label?: string
}) {
  const id = React.useId()
  return (
    <div
      data-slot="sitemap-suggestions"
      className={cn("flex flex-col gap-2", className)}
      {...props}
    >
      <span id={id} className="text-sm text-muted-foreground">
        {label}
      </span>
      <ul
        aria-labelledby={id}
        className="m-0 flex list-none flex-wrap gap-2 p-0"
      >
        {children}
      </ul>
    </div>
  )
}

/** One suggestion, a link shaped like a chip. `render` swaps in a router link. */
function SitemapSuggestion({
  className,
  render,
  ...props
}: useRender.ComponentProps<"a">) {
  const element = useRender({
    render: render ?? <a />,
    props: mergeProps<"a">(
      {
        "data-slot": "sitemap-suggestion",
        className: cn(
          "inline-flex h-8 items-center rounded-full bg-secondary px-3 text-sm font-medium text-secondary-foreground no-underline transition-colors outline-none hover:bg-secondary-hover focus-visible:ring-[3px] focus-visible:ring-ring-subtle",
          className
        ),
      } as React.ComponentProps<"a">,
      props
    ),
  })
  return <li className="m-0 p-0">{element}</li>
}

/**
 * The directory: one column on a phone, two on a tablet and four on a
 * desktop. It is the page's sitemap landmark.
 */
function SitemapSections({
  "aria-label": ariaLabel = "Sitemap",
  className,
  ...props
}: React.ComponentProps<"nav">) {
  return (
    <nav
      data-slot="sitemap-sections"
      aria-label={ariaLabel}
      className={cn(
        "grid grid-cols-1 gap-4 border-border pt-2 @2xl/sitemap:grid-cols-2 @2xl/sitemap:gap-x-8 @2xl/sitemap:gap-y-10 @2xl/sitemap:border-t @2xl/sitemap:pt-10 @5xl/sitemap:grid-cols-4",
        className
      )}
      {...props}
    />
  )
}

/**
 * One group of destinations under a heading. A card on a phone, so each
 * group reads as its own stop while scrolling; a plain column wider up.
 */
function SitemapSection({
  title,
  className,
  children,
  ...props
}: Omit<React.ComponentProps<"section">, "title"> & {
  /** The group's heading, such as "Find a home". */
  title: React.ReactNode
}) {
  const id = React.useId()
  return (
    <section
      data-slot="sitemap-section"
      aria-labelledby={id}
      className={cn(
        "flex min-w-0 flex-col rounded-xl border border-border bg-card @2xl/sitemap:rounded-none @2xl/sitemap:border-0 @2xl/sitemap:bg-transparent",
        className
      )}
      {...props}
    >
      <h2
        id={id}
        data-slot="sitemap-section-title"
        className="m-0 border-b border-border px-4 py-3 text-base font-semibold text-foreground @2xl/sitemap:border-0 @2xl/sitemap:px-0 @2xl/sitemap:pt-0 @2xl/sitemap:pb-2 @3xl/sitemap:text-lg"
      >
        {title}
      </h2>
      <ul
        data-slot="sitemap-list"
        className="m-0 flex list-none flex-col p-0 px-4 pb-1 @2xl/sitemap:px-0"
      >
        {children}
      </ul>
    </section>
  )
}

const linkClassName =
  "flex min-h-11 flex-1 items-center rounded-sm py-2 text-sm text-foreground no-underline underline-offset-4 outline-none hover:underline focus-visible:ring-[3px] focus-visible:ring-ring-subtle @3xl/sitemap:text-base"

/** One destination in a section or group. `render` swaps in a router link. */
function SitemapLink({
  className,
  render,
  ...props
}: useRender.ComponentProps<"a">) {
  const element = useRender({
    render: render ?? <a />,
    props: mergeProps<"a">(
      {
        "data-slot": "sitemap-link",
        className: cn(linkClassName, className),
      } as React.ComponentProps<"a">,
      props
    ),
  })
  return (
    <li className="m-0 flex border-b border-border p-0 last:border-0 [[data-slot=sitemap-group-list]_&]:border-0">
      {element}
    </li>
  )
}

/**
 * A destination with destinations under it, such as a state and its cities.
 * `collapsible` folds the children behind a toggle, for long lists on a
 * phone.
 */
function SitemapGroup({
  title,
  href,
  collapsible = false,
  defaultOpen = true,
  open,
  onOpenChange,
  className,
  children,
  ...props
}: Omit<React.ComponentProps<"li">, "title"> & {
  /** The parent destination's name, such as a state. */
  title: string
  /** Where the parent itself goes. Leave it out for a plain label. */
  href?: string
  /** Puts the children behind a toggle beside the title. */
  collapsible?: boolean
  /** Whether a collapsible group starts open. */
  defaultOpen?: boolean
  /** Whether a collapsible group is open, when you control it. */
  open?: boolean
  /** Called when a collapsible group opens or closes. */
  onOpenChange?: (open: boolean) => void
}) {
  const heading = href ? (
    <a data-slot="sitemap-group-title" href={href} className={linkClassName}>
      {title}
    </a>
  ) : (
    <span
      data-slot="sitemap-group-title"
      className="flex min-h-11 flex-1 items-center py-2 text-sm text-foreground @3xl/sitemap:text-base"
    >
      {title}
    </span>
  )
  const list = (
    <ul
      data-slot="sitemap-group-list"
      className="m-0 mb-2 ml-1 flex list-none flex-col border-l border-border p-0 pl-4"
    >
      {children}
    </ul>
  )

  if (!collapsible) {
    return (
      <li
        data-slot="sitemap-group"
        className={cn(
          "m-0 flex flex-col border-b border-border p-0 last:border-0",
          className
        )}
        {...props}
      >
        {heading}
        {list}
      </li>
    )
  }

  return (
    <li
      data-slot="sitemap-group"
      className={cn("m-0 border-b border-border p-0 last:border-0", className)}
      {...props}
    >
      <CollapsiblePrimitive.Root
        defaultOpen={defaultOpen}
        open={open}
        onOpenChange={onOpenChange}
        className="flex flex-col"
      >
        <div className="flex items-center gap-2">
          {heading}
          <CollapsiblePrimitive.Trigger
            data-slot="sitemap-group-trigger"
            aria-label={`Show places in ${title}`}
            className="flex size-9 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors outline-none hover:bg-muted hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring-subtle [&_svg]:size-4 [&_svg]:transition-transform data-panel-open:[&_svg]:rotate-90 motion-reduce:[&_svg]:transition-none"
          >
            <ChevronRightIcon aria-hidden="true" />
          </CollapsiblePrimitive.Trigger>
        </div>
        <CollapsiblePrimitive.Panel data-slot="sitemap-group-panel">
          {list}
        </CollapsiblePrimitive.Panel>
      </CollapsiblePrimitive.Root>
    </li>
  )
}

export {
  SitemapLayout,
  SitemapDescription,
  SitemapGroup,
  SitemapHeader,
  SitemapLink,
  SitemapSearch,
  SitemapSection,
  SitemapSections,
  SitemapSuggestion,
  SitemapSuggestions,
  SitemapTitle,
}
