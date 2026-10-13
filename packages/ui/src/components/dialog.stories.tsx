import type { Meta, StoryObj } from "@storybook/react-vite"
import { expect, waitFor, within } from "storybook/test"

import { Button } from "./button.js"
import {
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./dialog.js"
import { Field, FieldGroup, FieldLabel } from "./field.js"
import { Input } from "./input.js"

type PlaygroundArgs = {
  /** How wide the dialog gets before it stops growing. */
  size: "sm" | "default" | "lg"
  /** Shows a close button in the top corner. */
  showCloseButton: boolean
}

const meta: Meta<PlaygroundArgs> = {
  title: "Base components/Overlays/Dialog",
  component: DialogContent,
  subcomponents: {
    Dialog,
    DialogTrigger,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogBody,
    DialogFooter,
    DialogClose,
  } as Record<string, React.ComponentType<unknown>>,
  argTypes: {
    size: { control: "inline-radio", options: ["sm", "default", "lg"] },
    showCloseButton: { control: "boolean" },
  },
  args: { size: "default", showCloseButton: true },
  render: ({ size, showCloseButton }) => (
    <Dialog>
      <DialogTrigger render={<Button variant="outline" />}>
        Edit profile
      </DialogTrigger>
      <DialogContent size={size} showCloseButton={showCloseButton}>
        <DialogHeader>
          <DialogTitle>Edit profile</DialogTitle>
          <DialogDescription>
            Changes show on your profile once you save.
          </DialogDescription>
        </DialogHeader>
        <FieldGroup>
          <Field>
            <FieldLabel>Name</FieldLabel>
            <Input defaultValue="Ada Lovelace" />
          </Field>
          <Field>
            <FieldLabel>Username</FieldLabel>
            <Input defaultValue="ada" />
          </Field>
        </FieldGroup>
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>
            Cancel
          </DialogClose>
          <DialogClose render={<Button />}>Save changes</DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
}

export default meta
type Story = StoryObj<PlaygroundArgs>

export const Default: Story = {
  play: async ({ canvas, canvasElement, userEvent, step }) => {
    // The dialog portals to the body, outside the story's canvas.
    const page = within(canvasElement.ownerDocument.body)
    const trigger = canvas.getByRole("button", { name: "Edit profile" })

    await step("Pointer: open, then close with the corner button", async () => {
      await userEvent.click(trigger)
      const dialog = await page.findByRole("dialog", { name: "Edit profile" })
      await expect(dialog).toHaveAccessibleDescription(
        "Changes show on your profile once you save."
      )
      await waitFor(() =>
        expect(
          within(dialog).getByRole("textbox", { name: "Name" })
        ).toHaveFocus()
      )
      await userEvent.click(
        within(dialog).getByRole("button", { name: "Close" })
      )
      await waitFor(() => expect(page.queryByRole("dialog")).toBeNull())
      await waitFor(() => expect(trigger).toHaveFocus())
    })

    await step("Keyboard: open with Enter, close with Escape", async () => {
      trigger.focus()
      await userEvent.keyboard("{Enter}")
      const dialog = await page.findByRole("dialog", { name: "Edit profile" })
      await waitFor(() =>
        expect(dialog).toContainElement(document.activeElement as HTMLElement)
      )
      await userEvent.keyboard("{Escape}")
      await waitFor(() => expect(page.queryByRole("dialog")).toBeNull())
      await waitFor(() => expect(trigger).toHaveFocus())
    })
  },
}

export const Small: Story = {
  args: { size: "sm" },
}

export const Large: Story = {
  args: { size: "lg" },
}

/** A body taller than the screen scrolls inside, so the footer stays put. */
export const LongContent: Story = {
  name: "Long content",
  render: () => (
    <Dialog>
      <DialogTrigger render={<Button variant="outline" />}>
        Read the terms
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Terms of service</DialogTitle>
          <DialogDescription>Last updated October 2026.</DialogDescription>
        </DialogHeader>
        <DialogBody className="flex flex-col gap-3 text-sm text-muted-foreground">
          {Array.from({ length: 12 }, (_, index) => (
            <p key={index} className="m-0">
              {index + 1}. The workspace belongs to the people who make it. We
              keep what you write private, back it up every night, and hand it
              all back in a standard format whenever you ask.
            </p>
          ))}
        </DialogBody>
        <DialogFooter>
          <DialogClose render={<Button />}>Got it</DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
}
