import {
  useRef,
  useState,
  type FocusEvent as ReactFocusEvent,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react"

import { cn } from "@workspace/ui/lib/utils"

import { LeaderLines, useAnnotations, type Callout } from "./leader-lines.js"

type Part = Callout & {
  /** The part's name, as the label and in the legend. */
  name: string
  /** What the part is for. */
  description: ReactNode
}

/** Spread on an element of the figure to make it a named part. */
type PartProps = {
  ref: (node: HTMLElement | null) => void
  "data-picked"?: true
}

/*
 * A live example with its parts labeled the way the Colors page labels its
 * tokens: names in a column either side, a line to each part, and a legend
 * underneath. Pointing at a name or a legend entry outlines its part.
 */
function AnatomyDiagram({
  parts,
  children,
}: {
  parts: Part[]
  /** Renders the example, marking each part with part(token). */
  children: (part: (token: string) => PartProps) => ReactNode
}) {
  const [active, setActive] = useState<string | null>(null)
  const frame = useRef<HTMLDivElement>(null)
  const columnNodes = useRef(new Map<string, HTMLElement>())
  const calloutNodes = useRef(new Map<string, HTMLElement>())
  const partNodes = useRef(new Map<string, HTMLElement>())
  const annotations = useAnnotations(
    frame,
    columnNodes,
    calloutNodes,
    partNodes,
    parts
  )
  const isActive = (token: string) => active === token

  // A mouse picks by hovering; a tap picks and a second tap lets go, since
  // touch has no hover to end.
  const pointAt = (token: string) => ({
    onPointerEnter: (event: ReactPointerEvent) => {
      if (event.pointerType === "mouse") setActive(token)
    },
    onPointerLeave: (event: ReactPointerEvent) => {
      if (event.pointerType === "mouse") setActive(null)
    },
    onClick: (event: ReactMouseEvent) => {
      const { pointerType } = event.nativeEvent as PointerEvent
      if (pointerType !== "touch" && pointerType !== "pen") return
      setActive((current) => (current === token ? null : token))
    },
    onFocus: (event: ReactFocusEvent<HTMLElement>) => {
      if (event.currentTarget.matches(":focus-visible")) setActive(token)
    },
    onBlur: () => setActive(null),
  })

  const part = (token: string): PartProps => ({
    ref: (node) => {
      if (node) partNodes.current.set(token, node)
      else partNodes.current.delete(token)
    },
    "data-picked": isActive(token) || undefined,
  })

  const column = (side: "left" | "right") => (
    <div
      ref={(node) => {
        if (node) columnNodes.current.set(side, node)
        else columnNodes.current.delete(side)
      }}
      className="relative hidden w-36 shrink-0 self-stretch md:block"
    >
      {parts
        .filter((p) => p.side === side)
        .map(({ token, name }) => (
          // A pointer shortcut only: the legend below carries the same parts
          // for keyboards and screen readers, so each part is one tab stop.
          <button
            key={token}
            type="button"
            tabIndex={-1}
            aria-hidden="true"
            ref={(node) => {
              if (node) calloutNodes.current.set(token, node)
              else calloutNodes.current.delete(token)
            }}
            {...pointAt(token)}
            // Hidden until measured, so callouts never jump into place.
            style={{ top: annotations?.tops[token] ?? 0 }}
            className={cn(
              "absolute inset-x-0 flex rounded-md px-2 py-0.5 font-mono text-xs whitespace-nowrap text-foreground transition-opacity duration-200 outline-none focus-visible:ring-[3px] focus-visible:ring-ring-subtle",
              side === "left" ? "justify-end" : "justify-start",
              annotations?.tops[token] === undefined && "invisible",
              active && !isActive(token) && "opacity-40"
            )}
          >
            {name}
          </button>
        ))}
    </div>
  )

  return (
    <figure className="my-6 flex flex-col gap-8 rounded-xl border border-border bg-card p-4 text-foreground sm:p-6">
      <div
        ref={frame}
        className="relative flex flex-col items-center gap-6 py-6 md:flex-row md:justify-center md:gap-10"
      >
        <LeaderLines
          lines={annotations?.lines ?? []}
          isActive={isActive}
          anyActive={active !== null}
        />
        {column("left")}
        <div
          inert
          className="w-full max-w-sm min-w-0 [&_[data-picked]]:outline-2 [&_[data-picked]]:outline-offset-2 [&_[data-picked]]:outline-foreground [&_[data-picked]]:outline-dashed"
        >
          {children(part)}
        </div>
        {column("right")}
      </div>
      <ol className="m-0 grid list-none gap-x-8 gap-y-1 p-0 sm:grid-cols-2">
        {parts.map(({ token, name, description }) => (
          <li key={token}>
            <button
              type="button"
              aria-pressed={isActive(token)}
              {...pointAt(token)}
              className={cn(
                "flex w-full flex-col items-start gap-0.5 rounded-md px-2 py-2 text-left transition-opacity duration-200 outline-none focus-visible:ring-[3px] focus-visible:ring-ring-subtle",
                active && !isActive(token) && "opacity-40"
              )}
            >
              <span className="font-mono text-xs text-foreground">{name}</span>
              <span className="text-sm leading-6 text-muted-foreground">
                {description}
              </span>
            </button>
          </li>
        ))}
      </ol>
    </figure>
  )
}

/**
 * A plain table for specs: a header row, then one row per item. On a phone
 * each row stacks into a card of label and value pairs instead, since a
 * table of three or four prose columns only fits by scrolling sideways.
 */
function SpecTable({
  columns,
  rows,
}: {
  columns: string[]
  rows: ReactNode[][]
}) {
  return (
    <>
      <dl className="my-6 divide-y divide-border text-sm sm:hidden">
        {rows.map((row, index) => (
          <div key={index} className="flex flex-col gap-2 py-3 first:pt-0">
            <dt className="font-medium text-foreground">{row[0]}</dt>
            {row.slice(1).map((cell, cellIndex) => (
              <dd key={cellIndex} className="flex flex-col gap-0.5">
                <span className="text-xs text-muted-foreground">
                  {columns[cellIndex + 1]}
                </span>
                <span className="leading-6 text-foreground">{cell}</span>
              </dd>
            ))}
          </div>
        ))}
      </dl>
      <div className="my-6 overflow-x-auto max-sm:hidden">
        <table className="w-full min-w-lg border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-border text-foreground">
              {columns.map((column) => (
                <th key={column} className="py-2.5 pr-4 font-medium last:pr-0">
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr
                key={index}
                className="border-b border-border align-top last:border-b-0"
              >
                {row.map((cell, cellIndex) => (
                  <td
                    key={cellIndex}
                    className={cn(
                      "py-3 pr-4 leading-6 last:pr-0",
                      cellIndex === 0
                        ? "font-medium text-foreground"
                        : "text-muted-foreground"
                    )}
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}

type Specimen = {
  label: string
  note?: ReactNode
  children: ReactNode
}

/** A grid of one part in several states, each named, for comparing at a glance. */
function Specimens({ items }: { items: Specimen[] }) {
  return (
    <div className="my-6 grid gap-4 sm:grid-cols-2">
      {items.map((item) => (
        <figure key={item.label} className="m-0 flex min-w-0 flex-col gap-3">
          <div
            inert
            className="flex min-h-40 items-center rounded-xl border border-border bg-muted p-6"
          >
            <div className="w-full">{item.children}</div>
          </div>
          <figcaption className="flex flex-col gap-0.5">
            <span className="text-sm font-semibold text-foreground">
              {item.label}
            </span>
            {item.note ? (
              <span className="text-sm leading-6 text-muted-foreground">
                {item.note}
              </span>
            ) : null}
          </figcaption>
        </figure>
      ))}
    </div>
  )
}

export { AnatomyDiagram, SpecTable, Specimens }
