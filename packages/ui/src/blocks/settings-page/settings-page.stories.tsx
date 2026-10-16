import type { Meta, StoryObj } from "@storybook/react-vite"
import { expect, fn, waitFor, within } from "storybook/test"

import { SettingsPage } from "./settings-page.js"

const meta: Meta<typeof SettingsPage> = {
  title: "Blocks/Settings page",
  component: SettingsPage,
  tags: ["new"],
  parameters: {
    layout: "fullscreen",
    controls: { exclude: ["initialValues", "onSave", "container"] },
  },
  args: { onSave: fn() },
}

export default meta
type Story = StoryObj<typeof SettingsPage>

export const Default: Story = {
  play: async ({ args, canvas, canvasElement, userEvent, step }) => {
    // Toasts and the confirmation portal to the body.
    const page = within(canvasElement.ownerDocument.body)
    const name = canvas.getByRole("textbox", { name: "Name" })

    await step(
      "An edit brings up the save bar, and Save clears it",
      async () => {
        await expect(canvas.queryByText("Unsaved changes")).toBeNull()
        await userEvent.type(name, " King")
        await waitFor(() =>
          expect(canvas.getByText("Unsaved changes")).toBeVisible()
        )
        await userEvent.click(
          canvas.getByRole("button", { name: "Save changes" })
        )
        await expect(args.onSave).toHaveBeenLastCalledWith(
          expect.objectContaining({ name: "Ada Lovelace King" })
        )
        await expect(await page.findByText("Settings saved")).toBeVisible()
        await waitFor(() =>
          expect(canvas.queryByText("Unsaved changes")).toBeNull()
        )
      }
    )

    await step("An empty name won't save, by Ctrl+S either", async () => {
      await userEvent.clear(name)
      await userEvent.keyboard("{Control>}s{/Control}")
      await expect(name).toHaveAttribute("aria-invalid", "true")
      await expect(canvas.getByText("Enter your name.")).toBeVisible()
      await expect(args.onSave).toHaveBeenCalledTimes(1)
    })

    await step("Discard puts every field back", async () => {
      await userEvent.click(canvas.getByRole("button", { name: "Discard" }))
      await expect(name).toHaveValue("Ada Lovelace King")
      await expect(name).not.toHaveAttribute("aria-invalid", "true")
      await expect(canvas.queryByText("Unsaved changes")).toBeNull()
    })

    await step("Tabs and switches work from the keyboard", async () => {
      canvas.getByRole("tab", { name: "Profile" }).focus()
      await userEvent.keyboard("{ArrowRight}")
      const notifications = canvas.getByRole("tab", { name: "Notifications" })
      await expect(notifications).toHaveFocus()
      // Arrows move focus; Enter picks the tab, as Tabs does everywhere.
      await userEvent.keyboard("{Enter}")
      await waitFor(() =>
        expect(notifications).toHaveAttribute("aria-selected", "true")
      )
      const digest = canvas.getByRole("switch", { name: "Weekly digest" })
      digest.focus()
      await userEvent.keyboard(" ")
      await expect(digest).toBeChecked()
      // The bar fades in, so it's visible a beat after it mounts.
      await waitFor(() =>
        expect(canvas.getByText("Unsaved changes")).toBeVisible()
      )
    })

    await step(
      "Deleting the account asks first, with Cancel focused",
      async () => {
        await userEvent.click(canvas.getByRole("tab", { name: "Account" }))
        await userEvent.click(
          canvas.getByRole("button", { name: "Delete account" })
        )
        const dialog = await page.findByRole("alertdialog", {
          name: "Delete your account?",
        })
        await waitFor(() =>
          expect(
            within(dialog).getByRole("button", { name: "Cancel" })
          ).toHaveFocus()
        )
        await userEvent.keyboard("{Escape}")
        await waitFor(() => expect(page.queryByRole("alertdialog")).toBeNull())
      }
    )
  },
}

/** At phone width the groups stack their headings over their fields, and
 * the save bar's buttons share the row. */
export const Phone: Story = {
  decorators: [
    (Story) => (
      <div className="mx-auto w-[390px] border-x border-border">
        <Story />
      </div>
    ),
  ],
}
