import { describe, expect, it } from "vitest"

import { badgeVariants } from "./badge.js"
import { buttonVariants } from "./button.js"

describe("buttonVariants", () => {
  it("defaults to the primary fill at the default size", () => {
    const classes = buttonVariants()
    expect(classes).toContain("bg-primary")
    expect(classes).toContain("h-9")
  })

  it("tints destructive instead of filling it solid", () => {
    expect(buttonVariants({ variant: "destructive" })).toContain(
      "bg-destructive-subtle"
    )
  })

  it("never uses an opacity modifier on a token color", () => {
    for (const variant of [
      "default",
      "outline",
      "secondary",
      "ghost",
      "destructive",
      "link",
    ] as const) {
      expect(buttonVariants({ variant })).not.toMatch(
        /\b(bg|text|border)-[a-z-]+\/\d+/
      )
    }
  })
})

describe("badgeVariants", () => {
  it("keeps outline transparent with a border", () => {
    const classes = badgeVariants({ variant: "outline" })
    expect(classes).toContain("border-border")
    expect(classes).toContain("bg-transparent")
  })
})
