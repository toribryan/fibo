import { describe, expect, it, vi } from "vitest"
import { render } from "vitest-browser-react"

import { formatRange, Pagination } from "./pagination.js"

describe("formatRange", () => {
  it("formats the first page with thousands separators", () => {
    expect(formatRange(1, 25, 10000, "members")).toBe(
      "1 to 25 of 10,000 members"
    )
  })

  it("stops the last page at the total", () => {
    expect(formatRange(6, 25, 128, "articles")).toBe(
      "126 to 128 of 128 articles"
    )
  })

  it("uses the singular noun for one row", () => {
    const noun = { one: "member", other: "members" }
    expect(formatRange(1, 25, 1, noun)).toBe("1 to 1 of 1 member")
    expect(formatRange(1, 25, 4, noun)).toBe("1 to 4 of 4 members")
  })

  it("reads 0 to 0 when there are no rows", () => {
    expect(formatRange(1, 25, 0)).toBe("0 to 0 of 0")
  })
})

describe("Pagination", () => {
  it("pages forward and back when uncontrolled", async () => {
    const onPageChange = vi.fn()
    const screen = await render(
      <Pagination pageCount={3} onPageChange={onPageChange} />
    )
    const next = screen.getByRole("button", { name: "Next page" })
    await next.click()
    await expect.element(screen.getByText("Page 2 of 3")).toBeInTheDocument()
    expect(onPageChange).toHaveBeenLastCalledWith(2)
  })

  it("keeps a controlled page until the parent changes it", async () => {
    const onPageChange = vi.fn()
    const screen = await render(
      <Pagination page={1} pageCount={3} onPageChange={onPageChange} />
    )
    await screen.getByRole("button", { name: "Next page" }).click()
    expect(onPageChange).toHaveBeenLastCalledWith(2)
    await expect.element(screen.getByText("Page 1 of 3")).toBeInTheDocument()
  })

  it("disables the ends without taking them out of the tab order", async () => {
    const onPageChange = vi.fn()
    const screen = await render(
      <Pagination page={3} pageCount={3} onPageChange={onPageChange} />
    )
    const next = screen.getByRole("button", { name: "Next page" })
    await expect.element(next).toHaveAttribute("aria-disabled", "true")
    await expect.element(next).not.toHaveAttribute("disabled")
    await next.click({ force: true })
    expect(onPageChange).not.toHaveBeenCalled()
  })

  it("clamps a page past the end to the last page", async () => {
    const screen = await render(<Pagination page={9} pageCount={4} />)
    await expect.element(screen.getByText("Page 4 of 4")).toBeInTheDocument()
  })
})
