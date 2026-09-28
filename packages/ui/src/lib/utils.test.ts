import { describe, expect, it } from "vitest"

import { cn } from "./utils.js"

describe("cn", () => {
  it("joins conditional classes", () => {
    const hidden = Math.random() > 1
    expect(cn("px-2", hidden && "hidden", "py-1")).toBe("px-2 py-1")
  })

  it("lets the later Tailwind class win a conflict", () => {
    expect(cn("bg-primary px-2", "px-4")).toBe("bg-primary px-4")
  })
})
