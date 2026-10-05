import { describe, expect, it } from "vitest"

import { formatCount } from "./format-count.js"

describe("formatCount", () => {
  it("shows a plain count as is", () => {
    expect(formatCount(7)).toEqual({ shown: "7", exact: "7" })
  })

  it("caps at max with a plus", () => {
    expect(formatCount(128, { max: 99 })).toEqual({
      shown: "99+",
      exact: "128",
    })
    expect(formatCount(99, { max: 99 }).shown).toBe("99")
  })

  it("shortens from a thousand up when compact", () => {
    expect(formatCount(999, { notation: "compact" }).shown).toBe("999")
    expect(formatCount(1200, { notation: "compact", locale: "en-US" })).toEqual(
      {
        shown: "1.2K",
        exact: "1,200",
      }
    )
  })

  it("signs a count of things not shown", () => {
    expect(formatCount(4, { plus: true }).shown).toBe("+4")
    expect(formatCount(150, { plus: true, max: 99 }).shown).toBe("+99+")
  })

  it("follows the locale", () => {
    expect(formatCount(12345, { locale: "de-DE" }).exact).toBe("12.345")
  })
})
