import type { Meta, StoryObj } from "@storybook/react-vite"
import { expect, waitFor, within } from "storybook/test"

import { AppShell } from "./app-shell.js"

const meta: Meta<typeof AppShell> = {
  title: "Blocks/App shell",
  component: AppShell,
  tags: ["new"],
  parameters: { layout: "fullscreen" },
}

export default meta
type Story = StoryObj<typeof AppShell>

// Lets a page or the menu finish animating before the next step reads it.
const settle = () => new Promise((resolve) => setTimeout(resolve, 300))

export const Default: Story = {
  play: async ({ canvas, canvasElement, userEvent, step }) => {
    // The menu portals to the body, outside the story's canvas.
    const page = within(canvasElement.ownerDocument.body)

    await step("Create a project from the menu by keyboard", async () => {
      await userEvent.keyboard("{Control>}k{/Control}")
      const search = await page.findByRole("combobox", {
        name: "Command menu",
      })
      await waitFor(() => expect(search).toHaveFocus())
      await userEvent.keyboard("new project")
      await userEvent.keyboard("{Enter}")
      await waitFor(() => expect(page.queryByRole("dialog")).toBeNull())
      await expect(
        canvas.getByRole("heading", { level: 1, name: "Projects" })
      ).toBeInTheDocument()
      const rows = canvas.getAllByRole("row")
      await expect(rows[1]).toHaveTextContent("Untitled project")
      await expect(rows[1]).toHaveAttribute("data-state", "selected")
    })

    await step("Open a project through a nested page", async () => {
      await settle()
      await userEvent.click(canvas.getByRole("button", { name: /Search/ }))
      await page.findByRole("combobox", { name: "Command menu" })
      await userEvent.click(page.getByRole("option", { name: /Open project/ }))
      await page.findByRole("combobox", {
        name: "Command menu, Open project",
      })
      await settle()
      await userEvent.click(page.getByRole("option", { name: /Cinder/ }))
      await waitFor(() => expect(page.queryByRole("dialog")).toBeNull())
      await expect(
        canvas.getByRole("row", { name: /Cinder billing/ })
      ).toHaveAttribute("data-state", "selected")
    })

    await step("Move pages with the nav and clear the inbox", async () => {
      const nav = canvas.getByRole("navigation", { name: "Pages" })
      const inbox = within(nav).getByRole("button", { name: "Inbox" })
      await userEvent.click(inbox)
      await expect(inbox).toHaveAttribute("aria-current", "true")
      await userEvent.click(
        canvas.getByRole("button", { name: "Mark all as read" })
      )
      await expect(canvas.getByText("You're all caught up")).toBeInTheDocument()
    })
  },
}

/** At phone width the cards stack and the table drops its Owner and Updated
 * columns. */
export const Phone: Story = {
  decorators: [
    (Story) => (
      <div className="mx-auto w-[390px] border-x border-border">
        <Story />
      </div>
    ),
  ],
}
