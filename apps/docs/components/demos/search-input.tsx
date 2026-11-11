"use client"

import * as React from "react"

import { SearchInput } from "@workspace/ui/components/search-input"

const PEOPLE = [
  "Ada Lovelace",
  "Alan Turing",
  "Grace Hopper",
  "Katherine Johnson",
  "Margaret Hamilton",
]

export function FilteredListDemo() {
  const [query, setQuery] = React.useState("")
  const term = query.trim().toLowerCase()
  const matches = PEOPLE.filter((name) => name.toLowerCase().includes(term))
  return (
    <div className="flex w-72 flex-col gap-3">
      <SearchInput
        aria-label="Filter people"
        placeholder="Filter people…"
        hotkey={null}
        value={query}
        onValueChange={setQuery}
      />
      <ul className="flex flex-col text-sm" aria-live="polite">
        {matches.length ? (
          matches.map((name) => (
            <li key={name} className="rounded-sm px-2 py-1.5">
              {name}
            </li>
          ))
        ) : (
          <li className="px-2 py-1.5 text-muted-foreground">No one matches</li>
        )}
      </ul>
    </div>
  )
}
