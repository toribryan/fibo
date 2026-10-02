import type { Meta, StoryObj } from "@storybook/react-vite"
import { BoldIcon, ItalicIcon, LockIcon, UnderlineIcon } from "lucide-react"
import { expect, waitFor, within } from "storybook/test"

import { Button } from "./button.js"
import { Kbd } from "./kbd.js"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./tooltip.js"

type TooltipStoryArgs = React.ComponentProps<typeof TooltipContent> & {
  /** What the tooltip says. */
  label: string
}

const meta: Meta<TooltipStoryArgs> = {
  title: "Base components/Overlays/Tooltip",
  component: TooltipContent,
  subcomponents: { Tooltip, TooltipTrigger, TooltipProvider },
  argTypes: {
    label: { control: "text" },
    children: { control: false },
    render: { control: false },
    side: {
      control: "inline-radio",
      options: ["top", "right", "bottom", "left"],
    },
    align: {
      control: "inline-radio",
      options: ["start", "center", "end"],
    },
    sideOffset: { control: { type: "range", min: 0, max: 16, step: 1 } },
  },
  args: {
    label: "Add to library",
    side: "top",
    align: "center",
    sideOffset: 6,
  },
  render: ({ label, ...args }) => (
    <Tooltip>
      <TooltipTrigger render={<Button variant="outline" />}>
        Hover
      </TooltipTrigger>
      <TooltipContent {...args}>{label}</TooltipContent>
    </Tooltip>
  ),
}

export default meta
type Story = StoryObj<TooltipStoryArgs>

export const Default: Story = {
  play: async ({ canvas, canvasElement, userEvent }) => {
    // The popup renders in a portal on the body, outside the story's canvas.
    const page = within(canvasElement.ownerDocument.body)
    const trigger = canvas.getByRole("button", { name: "Hover" })

    await userEvent.hover(trigger)
    await waitFor(() => expect(page.getByText("Add to library")).toBeVisible())
    await userEvent.unhover(trigger)
    await waitFor(() => expect(page.queryByText("Add to library")).toBeNull())

    // Keyboard focus opens it too, and Escape closes it without moving focus.
    await userEvent.tab()
    await expect(trigger).toHaveFocus()
    await waitFor(() => expect(page.getByText("Add to library")).toBeVisible())
    await userEvent.keyboard("{Escape}")
    await waitFor(() => expect(page.queryByText("Add to library")).toBeNull())
    await expect(trigger).toHaveFocus()
  },
}

export const Sides: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      {(["top", "right", "bottom", "left"] as const).map((side) => (
        <Tooltip key={side}>
          <TooltipTrigger render={<Button variant="outline" />}>
            {side.charAt(0).toUpperCase() + side.slice(1)}
          </TooltipTrigger>
          <TooltipContent side={side}>Opens on the {side}</TooltipContent>
        </Tooltip>
      ))}
    </div>
  ),
}

export const IconButtons: Story = {
  name: "Icon buttons",
  render: () => (
    <TooltipProvider>
      <div className="flex gap-1">
        {[
          { icon: BoldIcon, label: "Bold", key: "B" },
          { icon: ItalicIcon, label: "Italic", key: "I" },
          { icon: UnderlineIcon, label: "Underline", key: "U" },
        ].map(({ icon: Icon, label, key }) => (
          <Tooltip key={label}>
            <TooltipTrigger
              render={
                <Button variant="ghost" size="icon-sm" aria-label={label} />
              }
            >
              <Icon aria-hidden="true" />
            </TooltipTrigger>
            <TooltipContent className="flex items-center gap-2">
              {label}
              <Kbd>Ctrl {key}</Kbd>
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    </TooltipProvider>
  ),
}

export const Reason: Story = {
  render: () => (
    <div className="flex items-center gap-2 text-sm">
      Elena Marsh
      <Tooltip>
        <TooltipTrigger
          aria-label="Locked: the workspace owner can't be removed"
          className="inline-flex size-6 items-center justify-center rounded-sm text-muted-foreground outline-none focus-visible:ring-[3px] focus-visible:ring-ring-subtle"
        >
          <LockIcon className="size-3.5" aria-hidden="true" />
        </TooltipTrigger>
        <TooltipContent>
          The workspace owner can&rsquo;t be removed
        </TooltipContent>
      </Tooltip>
    </div>
  ),
}
