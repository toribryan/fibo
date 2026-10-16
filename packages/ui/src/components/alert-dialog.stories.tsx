import type { Meta, StoryObj } from "@storybook/react-vite"
import { expect, fn, waitFor, within } from "storybook/test"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "./alert-dialog.js"
import { Button } from "./button.js"

type PlaygroundArgs = {
  /** The confirming button's style. Destructive for anything that can't be undone. */
  variant: "default" | "destructive"
  /** How wide the dialog gets before it stops growing. */
  size: "sm" | "default"
  /** Called when the action is chosen. */
  onAction: () => void
  /** Called when Cancel is chosen. */
  onCancel: () => void
}

const meta: Meta<PlaygroundArgs> = {
  title: "Base components/Overlays/Alert dialog",
  component: AlertDialogContent,
  subcomponents: {
    AlertDialog,
    AlertDialogTrigger,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogCancel,
    AlertDialogAction,
  } as Record<string, React.ComponentType<unknown>>,
  tags: ["new"],
  parameters: { controls: { exclude: ["onAction", "onCancel"] } },
  argTypes: {
    variant: { control: "inline-radio", options: ["default", "destructive"] },
    size: { control: "inline-radio", options: ["sm", "default"] },
    onAction: { control: false },
    onCancel: { control: false },
  },
  args: {
    variant: "destructive",
    size: "sm",
    onAction: fn(),
    onCancel: fn(),
  },
  render: ({ variant, size, onAction, onCancel }) => (
    <AlertDialog>
      <AlertDialogTrigger render={<Button variant="outline" />}>
        Delete project
      </AlertDialogTrigger>
      <AlertDialogContent size={size}>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Atlas redesign?</AlertDialogTitle>
          <AlertDialogDescription>
            {
              "Its files and comments are deleted for everyone. This can't be undone."
            }
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel}>Cancel</AlertDialogCancel>
          <AlertDialogAction variant={variant} onClick={onAction}>
            Delete project
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  ),
}

export default meta
type Story = StoryObj<PlaygroundArgs>

export const Default: Story = {
  play: async ({ args, canvas, canvasElement, userEvent, step }) => {
    const page = within(canvasElement.ownerDocument.body)
    const trigger = canvas.getByRole("button", { name: "Delete project" })

    await step("Cancel takes focus, and Escape leaves", async () => {
      await userEvent.click(trigger)
      const dialog = await page.findByRole("alertdialog", {
        name: "Delete Atlas redesign?",
      })
      await waitFor(() =>
        expect(
          within(dialog).getByRole("button", { name: "Cancel" })
        ).toHaveFocus()
      )
      await userEvent.keyboard("{Escape}")
      await waitFor(() => expect(page.queryByRole("alertdialog")).toBeNull())
      await waitFor(() => expect(trigger).toHaveFocus())
      await expect(args.onAction).not.toHaveBeenCalled()
    })

    await step("A click outside doesn't dismiss it", async () => {
      await userEvent.click(trigger)
      await page.findByRole("alertdialog")
      const overlay = canvasElement.ownerDocument.querySelector<HTMLElement>(
        '[data-slot="alert-dialog-overlay"]'
      )!
      await userEvent.click(overlay)
      await expect(page.getByRole("alertdialog")).toBeInTheDocument()
    })

    await step("The action runs and closes it", async () => {
      const dialog = page.getByRole("alertdialog")
      await userEvent.click(
        within(dialog).getByRole("button", { name: "Delete project" })
      )
      await expect(args.onAction).toHaveBeenCalledOnce()
      await waitFor(() => expect(page.queryByRole("alertdialog")).toBeNull())
    })
  },
}

/** A confirmation that loses nothing uses the default button. */
export const NonDestructive: Story = {
  name: "Not destructive",
  args: { variant: "default" },
  render: ({ variant, onAction, onCancel }) => (
    <AlertDialog>
      <AlertDialogTrigger render={<Button variant="outline" />}>
        Publish
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Publish to the whole workspace?</AlertDialogTitle>
          <AlertDialogDescription>
            Everyone in Northwind gets a notification and can comment.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel}>Not yet</AlertDialogCancel>
          <AlertDialogAction variant={variant} onClick={onAction}>
            Publish
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  ),
}
