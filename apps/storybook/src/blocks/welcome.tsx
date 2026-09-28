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
      "Colour and type tokens, named the same as the Figma variables.",
  },
  {
    to: "catalog--docs",
    icon: BoxesIcon,
    title: "Components",
    description:
      "The standard set, plus a Niche shelf of playful parts built for one moment.",
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
          className="group flex flex-col gap-10 rounded-2xl border border-border bg-card p-6 no-underline transition-colors hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring-subtle focus-visible:outline-none"
        >
          <span className="flex size-10 items-center justify-center rounded-xl border border-border bg-background text-foreground transition-transform group-hover:-rotate-6">
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
    title: "Achromatic by default",
    body: "There is no brand hue. Primary is a neutral, and colour only ever carries meaning: destructive, success, warning, info.",
  },
  {
    title: "One name on both sides",
    body: "Every token in globals.css has a Figma variable with the same name. Opacity steps get names too, such as -subtle and -hover, so Figma can bind them.",
  },
  {
    title: "Yours once installed",
    body: "Installing a part copies its source into your project. The file uses your tokens, and you can change it however you like.",
  },
  {
    title: "Contrast is measured",
    body: "Status tones sit on the 700 step so text clears WCAG AA on solid fills and on their own tints, in both themes.",
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
