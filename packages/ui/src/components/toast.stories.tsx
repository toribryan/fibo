import type { Meta, StoryObj } from "@storybook/react-vite"
import { expect, waitFor, within } from "storybook/test"

import { Button } from "./button.js"
import { Toaster, toast } from "./toast.js"

const meta: Meta<typeof Toaster> = {
  title: "Components/Toast",
  component: Toaster,
  tags: ["new"],
  argTypes: {
    timeout: { control: { type: "range", min: 0, max: 10000, step: 500 } },
    limit: { control: { type: "range", min: 1, max: 5, step: 1 } },
    toastManager: { control: false },
    children: { control: false },
  },
  args: { timeout: 5000, limit: 3 },
  parameters: {
    // The toasts are fixed to the viewport corner, so the story needs room.
    layout: "fullscreen",
    controls: { exclude: ["toastManager", "children"] },
    // Every story shares the one toast manager, so on the docs page each
    // runs in its own iframe; inline, one click would toast in every
    // Toaster on the page.
    docs: { story: { inline: false, iframeHeight: 320 } },
  },
  decorators: [
    (Story, { args }) => (
      <Toaster {...args}>
        <div className="flex min-h-80 flex-wrap items-start gap-2 p-8">
          <Story />
        </div>
      </Toaster>
    ),
  ],
}

export default meta
type Story = StoryObj<typeof Toaster>

export const Default: Story = {
  render: () => (
    <Button
      variant="outline"
      onClick={() =>
        toast.add({
          title: "Changes saved",
          description: "Your profile is up to date.",
        })
      }
    >
      Save changes
    </Button>
  ),
  play: async ({ canvas, canvasElement, userEvent }) => {
    // Toasts render in a portal on the body, outside the story's canvas.
    const page = within(canvasElement.ownerDocument.body)
    await userEvent.click(canvas.getByRole("button", { name: "Save changes" }))
    await expect(await page.findByText("Changes saved")).toBeVisible()

    // Base UI hides Dismiss from the accessibility tree until the stack
    // expands, so hover first.
    await userEvent.hover(page.getByRole("dialog"))
    await userEvent.click(await page.findByRole("button", { name: "Dismiss" }))
    await waitFor(() => expect(page.queryByText("Changes saved")).toBeNull())

    // By keyboard: F6 jumps to the toasts, Tab reaches one, Escape closes it.
    await userEvent.click(canvas.getByRole("button", { name: "Save changes" }))
    await page.findByText("Changes saved")
    await userEvent.keyboard("{F6}")
    await expect(
      page.getByRole("region", { name: "Notifications" })
    ).toHaveFocus()
    await userEvent.tab()
    await expect(page.getByRole("dialog")).toHaveFocus()
    await userEvent.keyboard("{Escape}")
    await waitFor(() => expect(page.queryByText("Changes saved")).toBeNull())
  },
}

export const Types: Story = {
  render: () => (
    <>
      {(
        [
          ["success", "Invoice sent", "Ada will get it in a minute."],
          ["info", "New version", "Reload to get the latest changes."],
          ["warning", "Storage almost full", "You've used 92% of 10 GB."],
          ["error", "Upload failed", "The file is over the 25 MB limit."],
        ] as const
      ).map(([type, title, description]) => (
        <Button
          key={type}
          variant="outline"
          onClick={() => toast.add({ type, title, description })}
        >
          Show {type}
        </Button>
      ))}
    </>
  ),
}

export const WithAction: Story = {
  name: "With action",
  render: () => (
    <Button
      variant="outline"
      onClick={() => {
        const id = toast.add({
          title: "Message archived",
          timeout: 8000,
          actionProps: {
            children: "Undo",
            onClick: () => toast.close(id),
          },
        })
      }}
    >
      Archive message
    </Button>
  ),
  play: async ({ canvas, canvasElement, userEvent }) => {
    const page = within(canvasElement.ownerDocument.body)
    await userEvent.click(
      canvas.getByRole("button", { name: "Archive message" })
    )
    await userEvent.click(await page.findByRole("button", { name: "Undo" }))
    await waitFor(() => expect(page.queryByText("Message archived")).toBeNull())
  },
}

export const Pending: Story = {
  name: "Promise",
  render: () => (
    <Button
      variant="outline"
      onClick={() =>
        toast.promise(
          new Promise((resolve) => window.setTimeout(resolve, 2000)),
          {
            loading: { title: "Publishing", description: "Uploading files." },
            success: { title: "Published", description: "Your site is live." },
            error: { title: "Couldn't publish", description: "Try again." },
          }
        )
      }
    >
      Publish site
    </Button>
  ),
}
