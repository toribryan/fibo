"use client"

import * as React from "react"
import {
  BookmarkIcon,
  CompassIcon,
  HouseIcon,
  RabbitIcon,
  SearchIcon,
  UserIcon,
} from "lucide-react"

import {
  FloatingNav,
  type FloatingNavItem,
} from "@workspace/ui/components/floating-nav"

const ITEMS: FloatingNavItem[] = [
  { value: "home", label: "Home", icon: <HouseIcon /> },
  { value: "explore", label: "Explore", icon: <CompassIcon /> },
  { value: "saved", label: "Saved", icon: <BookmarkIcon /> },
  { value: "profile", label: "Profile", icon: <UserIcon /> },
]

// A transform makes the frame the containing block for fixed children, so a
// `fixed` bar floats at the bottom of the phone instead of the docs page.
function Phone({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative h-[30rem] w-[min(22rem,100%)] transform-gpu overflow-hidden rounded-[2.5rem] border border-border bg-background">
      {children}
    </div>
  )
}

function Feed() {
  return (
    <div className="flex flex-col gap-4 p-5 pt-8">
      <span className="text-lg font-semibold">Today</span>
      {["Golden section", "Seed heads", "Pixel rabbits"].map((title) => (
        <div
          key={title}
          className="flex flex-col gap-2 rounded-2xl border border-border p-4"
        >
          <span className="h-24 rounded-xl bg-muted" />
          <span className="text-sm font-medium">{title}</span>
        </div>
      ))}
    </div>
  )
}

// Busy content right under the bar, so the glass has something to bend.
function Gallery() {
  return (
    <div className="flex h-full flex-col gap-3 p-5 pt-8">
      <span className="text-lg font-semibold">Library</span>
      <div className="grid flex-1 grid-cols-3 gap-1.5">
        {Array.from({ length: 15 }, (_, i) => (
          <span
            key={i}
            className={
              [
                "bg-foreground",
                "bg-muted-foreground",
                "bg-muted",
                "bg-border",
                "bg-primary",
              ][(i * 2) % 5] + " rounded-md"
            }
          />
        ))}
      </div>
      <p className="m-0 text-sm text-muted-foreground">
        The golden section turns up in seed heads, shells and the spiral of a
        rabbit population, each term the sum of the two before.
      </p>
    </div>
  )
}

export function FloatingNavDefaultDemo() {
  return (
    <Phone>
      <Feed />
      <FloatingNav items={ITEMS} defaultValue="home" />
    </Phone>
  )
}

export function FloatingNavGlassDemo() {
  return (
    <Phone>
      <Gallery />
      <FloatingNav items={ITEMS} defaultValue="home" variant="glass" />
    </Phone>
  )
}

export function FloatingNavLabeledDemo() {
  return (
    <Phone>
      <Feed />
      <FloatingNav items={ITEMS} defaultValue="home" labels="always" />
    </Phone>
  )
}

const LINKS: FloatingNavItem[] = [
  { value: "home", label: "Home", icon: <HouseIcon />, href: "#home" },
  { value: "search", label: "Search", icon: <SearchIcon />, href: "#search" },
  { value: "about", label: "About", icon: <RabbitIcon />, href: "#about" },
]

export function FloatingNavLinksDemo() {
  const [value, setValue] = React.useState("search")
  return (
    <Phone>
      <div className="flex flex-col gap-2 p-5 pt-8">
        <span className="text-lg font-semibold">
          {LINKS.find((item) => item.value === value)?.label}
        </span>
        <span className="text-sm text-muted-foreground">
          Links route through the app&apos;s own router, so the page never
          reloads.
        </span>
      </div>
      <FloatingNav
        aria-label="Sections"
        items={LINKS}
        value={value}
        onValueChange={(next, event) => {
          event.preventDefault()
          setValue(next)
        }}
      />
    </Phone>
  )
}
