import {
  ArrowRightIcon,
  BoxesIcon,
  PaletteIcon,
  TerminalIcon,
} from "lucide-react"

import { DocLink } from "./doc-link.js"

const RESOURCES = [
  {
    to: "foundations-colors--docs",
    icon: PaletteIcon,
    title: "Foundations",
    description:
      "Color, type, spacing, elevation and motion, named the same as in Figma.",
  },
  {
    to: "catalog--docs",
    icon: BoxesIcon,
    title: "Components",
    description:
      "The base set, plus a shelf of special components built for one moment.",
  },
  {
    to: "getting-started--docs",
    icon: TerminalIcon,
    title: "Getting started",
    description:
      "Point shadcn at the registry once, then add parts by name in any project.",
  },
]

function Resources() {
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {RESOURCES.map(({ to, icon: Icon, title, description }) => (
        <DocLink
          key={to}
          to={to}
          className="group flex items-start gap-4 rounded-2xl border border-border bg-card p-5 no-underline transition-colors hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring-subtle focus-visible:outline-none sm:flex-col sm:gap-10 sm:p-6"
        >
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-border bg-background text-foreground transition-transform group-hover:-rotate-6">
            <Icon className="size-5" />
          </span>
          <span className="flex flex-col gap-1.5">
            <span className="flex items-center gap-1.5 text-base font-semibold text-foreground">
              {title}
              <ArrowRightIcon className="size-4 -translate-x-1 opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100" />
            </span>
            <span className="text-sm leading-6 text-muted-foreground">
              {description}
            </span>
          </span>
        </DocLink>
      ))}
    </div>
  )
}

const PRINCIPLES = [
  {
    title: "Quiet until it matters",
    body: "Grays build the hierarchy with weight, size and space. Color appears only when it means something: danger, success, warning, information.",
  },
  {
    title: "Proportion, not preference",
    body: "Size, spacing and radius come from one scale. The system sets the measure, so every screen shares a rhythm.",
  },
  {
    title: "Every state is designed",
    body: "Hover, focus, disabled and invalid are drawn in Figma and built to match. Nothing is left to a browser default.",
  },
  {
    title: "Legible for everyone",
    body: "Contrast is measured, not judged by eye, and focus is always visible. A part that fails either isn't finished.",
  },
]

// Numbered along the sequence rather than 1 to 4.
const FIB = [1, 2, 3, 5]

function Principles() {
  return (
    <div className="grid border-t border-border sm:grid-cols-2">
      {PRINCIPLES.map((principle, index) => (
        <div
          key={principle.title}
          className={
            "flex flex-col gap-2 border-b border-border py-6 sm:px-6 " +
            (index % 2 === 0 ? "sm:border-r sm:pl-0" : "sm:pr-0")
          }
        >
          <span className="font-mono text-xs text-muted-foreground">
            {String(FIB[index]).padStart(2, "0")}
          </span>
          <span className="text-base font-semibold text-foreground">
            {principle.title}
          </span>
          <span className="text-sm leading-6 text-muted-foreground">
            {principle.body}
          </span>
        </div>
      ))}
    </div>
  )
}

export { Resources, Principles }
