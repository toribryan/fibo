import type { Meta, StoryObj } from "@storybook/react-vite"
import { ArrowUpDownIcon, PlusIcon, SlidersHorizontalIcon } from "lucide-react"
import { expect, waitFor, within } from "storybook/test"

import { Button } from "./button.js"
import { Input } from "./input.js"
import { Label } from "./label.js"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./select.js"
import {
  Sheet,
  SheetBody,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "./sheet.js"

const meta: Meta<typeof Sheet> = {
  title: "Base components/Overlays/Sheet",
  component: Sheet,
  subcomponents: {
    SheetTrigger,
    SheetContent,
    SheetHeader,
    SheetBody,
    SheetFooter,
    SheetTitle,
    SheetDescription,
    SheetClose,
  },
  argTypes: {
    side: {
      control: "inline-radio",
      options: ["top", "right", "bottom", "left"],
    },
    children: { control: false },
    onOpenChange: { control: false },
    onOpenChangeComplete: { control: false },
    onSnapPointChange: { control: false },
    actionsRef: { control: false },
    handle: { control: false },
    snapPoints: { control: false },
    snapPoint: { control: false },
    defaultSnapPoint: { control: false },
    triggerId: { control: false },
    defaultTriggerId: { control: false },
  },
  parameters: {
    controls: {
      exclude: [
        "children",
        "onOpenChange",
        "onOpenChangeComplete",
        "onSnapPointChange",
        "actionsRef",
        "handle",
        "snapPoints",
        "snapPoint",
        "defaultSnapPoint",
        "triggerId",
        "defaultTriggerId",
      ],
    },
  },
  args: { side: "right" },
  render: (args) => (
    <Sheet {...args}>
      <SheetTrigger render={<Button variant="outline" />}>
        Edit profile
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Edit profile</SheetTitle>
          <SheetDescription>
            Changes show to your team once you save.
          </SheetDescription>
        </SheetHeader>
        <SheetBody className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="sheet-name">Name</Label>
            <Input id="sheet-name" defaultValue="Maya Okafor" />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="sheet-email">Email</Label>
            <Input id="sheet-email" defaultValue="maya@example.com" />
          </div>
        </SheetBody>
        <SheetFooter>
          <SheetClose render={<Button />}>Save</SheetClose>
          <SheetClose render={<Button variant="outline" />}>Cancel</SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  ),
}

export default meta
type Story = StoryObj<typeof Sheet>

export const Default: Story = {
  play: async ({ canvas, canvasElement, userEvent }) => {
    // The sheet renders in a portal on the body, outside the story's canvas.
    const page = within(canvasElement.ownerDocument.body)
    const trigger = canvas.getByRole("button", { name: "Edit profile" })

    await userEvent.click(trigger)
    const dialog = await page.findByRole("dialog", { name: "Edit profile" })
    await expect(dialog).toHaveAccessibleDescription(
      "Changes show to your team once you save."
    )
    await userEvent.click(page.getByRole("button", { name: "Cancel" }))
    await waitFor(() => expect(page.queryByRole("dialog")).toBeNull())
    await waitFor(() => expect(trigger).toHaveFocus())

    // By keyboard: Escape closes it and focus goes back to the trigger.
    await userEvent.keyboard("{Enter}")
    await page.findByRole("dialog", { name: "Edit profile" })
    await userEvent.keyboard("{Escape}")
    await waitFor(() => expect(page.queryByRole("dialog")).toBeNull())
    await waitFor(() => expect(trigger).toHaveFocus())
  },
}

export const Bottom: Story = {
  args: { side: "bottom" },
}

export const Left: Story = {
  args: { side: "left" },
}

export const Filters: Story = {
  render: () => (
    <Sheet side="bottom">
      <SheetTrigger
        render={
          <Button variant="outline" size="icon-sm" aria-label="Filters" />
        }
      >
        <SlidersHorizontalIcon />
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Filters</SheetTitle>
        </SheetHeader>
        <SheetBody className="flex flex-col gap-2">
          <Select
            defaultValue="name"
            items={[
              { value: "name", label: "Name" },
              { value: "team", label: "Team" },
            ]}
          >
            <SelectTrigger className="w-full" aria-label="Sort by">
              <ArrowUpDownIcon />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">Name</SelectItem>
              <SelectItem value="team">Team</SelectItem>
            </SelectContent>
          </Select>
          <Select
            defaultValue="none"
            items={[
              { value: "none", label: "No grouping" },
              { value: "team", label: "Team" },
            ]}
          >
            <SelectTrigger className="w-full" aria-label="Group by">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No grouping</SelectItem>
              <SelectItem value="team">Team</SelectItem>
            </SelectContent>
          </Select>
          <Select
            defaultValue="all"
            items={[
              { value: "all", label: "All roles" },
              { value: "admin", label: "Admin" },
              { value: "editor", label: "Editor" },
            ]}
          >
            <SelectTrigger className="w-full" aria-label="Role">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All roles</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="editor">Editor</SelectItem>
            </SelectContent>
          </Select>
        </SheetBody>
        <SheetFooter>
          <Button variant="ghost" className="justify-start">
            <PlusIcon />
            Add filter
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  ),
}
