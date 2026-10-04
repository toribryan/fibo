import { describe, expect, it, vi } from "vitest"

import { mergeRefs } from "./merge-refs.js"

describe("mergeRefs", () => {
  it("sets object and function refs, and skips missing ones", () => {
    const node = document.createElement("div")
    const object: { current: HTMLDivElement | null } = { current: null }
    const fn = vi.fn()
    mergeRefs<HTMLDivElement>(object, fn, undefined, null)(node)
    expect(object.current).toBe(node)
    expect(fn).toHaveBeenCalledWith(node)
  })

  it("undoes every ref in its cleanup", () => {
    const node = document.createElement("div")
    const object: { current: HTMLDivElement | null } = { current: null }
    const fn = vi.fn()
    const ownCleanup = vi.fn()
    const withCleanup = vi.fn(() => ownCleanup)
    const cleanup = mergeRefs<HTMLDivElement>(object, fn, withCleanup)(node)
    expect(typeof cleanup).toBe("function")
    ;(cleanup as () => void)()
    expect(object.current).toBeNull()
    expect(fn).toHaveBeenLastCalledWith(null)
    expect(ownCleanup).toHaveBeenCalledOnce()
    expect(withCleanup).toHaveBeenCalledTimes(1)
  })
})
