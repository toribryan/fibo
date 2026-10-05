import * as React from "react"
import { describe, expect, it, vi } from "vitest"
import { render } from "vitest-browser-react"

import {
  Tabs,
  TabsContent,
  TabsList,
  tabsListVariants,
  TabsTrigger,
  type TabsListProps,
} from "./tabs.js"

function Sample({
  variant,
  size,
  ...props
}: React.ComponentProps<typeof Tabs> &
  Pick<TabsListProps, "variant" | "size">) {
  return (
    <Tabs {...props}>
      <TabsList variant={variant} size={size} aria-label="Project">
        <TabsTrigger value="one">One</TabsTrigger>
        <TabsTrigger value="two">Two</TabsTrigger>
        <TabsTrigger value="three" disabled>
          Three
        </TabsTrigger>
      </TabsList>
      <TabsContent value="one">First panel</TabsContent>
      <TabsContent value="two">Second panel</TabsContent>
      <TabsContent value="three">Third panel</TabsContent>
    </Tabs>
  )
}

describe("Tabs", () => {
  it("switches panels when uncontrolled and reports the value", async () => {
    const onValueChange = vi.fn()
    const screen = await render(
      <Sample defaultValue="one" onValueChange={onValueChange} />
    )
    await screen.getByRole("tab", { name: "Two" }).click()
    expect(onValueChange).toHaveBeenLastCalledWith("two", expect.anything())
    await expect
      .element(screen.getByRole("tab", { name: "Two" }))
      .toHaveAttribute("aria-selected", "true")
    await expect.element(screen.getByText("Second panel")).toBeVisible()
  })

  it("keeps a controlled value until the parent changes it", async () => {
    const onValueChange = vi.fn()
    const screen = await render(
      <Sample value="one" onValueChange={onValueChange} />
    )
    await screen.getByRole("tab", { name: "Two" }).click()
    expect(onValueChange).toHaveBeenLastCalledWith("two", expect.anything())
    await expect
      .element(screen.getByRole("tab", { name: "One" }))
      .toHaveAttribute("aria-selected", "true")
    await expect.element(screen.getByText("First panel")).toBeVisible()

    await screen.rerender(<Sample value="two" onValueChange={onValueChange} />)
    await expect.element(screen.getByText("Second panel")).toBeVisible()
  })

  it("never calls back for a disabled tab", async () => {
    const onValueChange = vi.fn()
    const screen = await render(
      <Sample defaultValue="one" onValueChange={onValueChange} />
    )
    await screen.getByRole("tab", { name: "Three" }).click({ force: true })
    expect(onValueChange).not.toHaveBeenCalled()
  })

  it("shares the list's variant and size with its triggers", async () => {
    const screen = await render(
      <Sample defaultValue="one" variant="line" size="sm" />
    )
    const list = screen.getByRole("tablist")
    await expect.element(list).toHaveAttribute("data-variant", "line")
    await expect.element(list).toHaveAttribute("data-size", "sm")
    const trigger = screen.getByRole("tab", { name: "One" }).element()
    expect(trigger.className).toContain("hover:bg-muted")
    expect(trigger.className).toContain("h-8")
  })

  it("raises the active tab on a pill in the default variant", async () => {
    const screen = await render(<Sample defaultValue="one" />)
    const indicator = screen.container.querySelector(
      "[data-slot=tabs-indicator]"
    )
    expect(indicator?.className).toContain("bg-background")
    expect(
      screen.getByRole("tab", { name: "One" }).element().className
    ).toContain("h-8")
  })
})

describe("tabsListVariants", () => {
  it("draws a muted track for the default variant at 36px", () => {
    const classes = tabsListVariants()
    expect(classes).toContain("bg-muted")
    expect(classes).toContain("data-[orientation=horizontal]:h-9")
  })

  it("drops the track for the line variant", () => {
    const classes = tabsListVariants({ variant: "line", size: "sm" })
    expect(classes).not.toContain("bg-muted")
    expect(classes).not.toContain("h-8")
  })

  it("scrolls sideways instead of wrapping when horizontal", () => {
    expect(tabsListVariants()).toContain(
      "data-[orientation=horizontal]:overflow-x-auto"
    )
  })

  it("never uses an opacity modifier on a token colour", () => {
    for (const variant of ["default", "line"] as const) {
      for (const size of ["sm", "default"] as const) {
        expect(tabsListVariants({ variant, size })).not.toMatch(
          /\b(bg|text|border)-[a-z-]+\/\d+/
        )
      }
    }
  })
})
