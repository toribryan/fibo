import * as React from "react"
import type { Meta, StoryObj } from "@storybook/react-vite"
import {
  CopyIcon,
  DownloadIcon,
  EllipsisIcon,
  PencilIcon,
  Trash2Icon,
  UserPlusIcon,
} from "lucide-react"
import { expect, fn, waitFor, within } from "storybook/test"

import { Button } from "./button.js"
import {
  Menu,
  MenuCheckboxItem,
  MenuContent,
  MenuGroup,
  MenuItem,
  MenuLabel,
  MenuRadioGroup,
  MenuRadioItem,
  MenuSeparator,
  MenuShortcut,
  MenuSub,
  MenuSubContent,
  MenuSubTrigger,
  MenuTrigger,
} from "./menu.js"

type MenuStoryArgs = React.ComponentProps<typeof MenuContent> & {
  /** Called with the name of the item chosen. */
  onAction: (action: string) => void
}

const meta: Meta<MenuStoryArgs> = {
  title: "Base components/Menu",
  component: MenuContent,
  subcomponents: {
    Menu,
    MenuTrigger,
    MenuItem,
    MenuCheckboxItem,
    MenuRadioItem,
    MenuLabel,
    MenuSeparator,
    MenuShortcut,
    MenuSubTrigger,
  },
  tags: ["new"],
  argTypes: {
    side: {
      control: "inline-radio",
      options: ["top", "right", "bottom", "left"],
    },
    align: {
      control: "inline-radio",
      options: ["start", "center", "end"],
    },
    sideOffset: { control: { type: "range", min: 0, max: 16, step: 1 } },
    onAction: { control: false },
    children: { control: false },
    render: { control: false },
  },
  parameters: { controls: { exclude: ["onAction", "children", "render"] } },
  args: { side: "bottom", align: "start", sideOffset: 4, onAction: fn() },
  render: ({ onAction, ...args }) => (
    <Menu>
      <MenuTrigger render={<Button variant="outline" />}>More</MenuTrigger>
      <MenuContent {...args}>
        <MenuItem onClick={() => onAction("edit")}>
          <PencilIcon />
          Edit
          <MenuShortcut>E</MenuShortcut>
        </MenuItem>
        <MenuItem onClick={() => onAction("duplicate")}>
          <CopyIcon />
          Duplicate
          <MenuShortcut>D</MenuShortcut>
        </MenuItem>
        <MenuItem onClick={() => onAction("export")}>
          <DownloadIcon />
          Export
        </MenuItem>
        <MenuSeparator />
        <MenuItem variant="destructive" onClick={() => onAction("delete")}>
          <Trash2Icon />
          Delete
        </MenuItem>
      </MenuContent>
    </Menu>
  ),
}

export default meta
type Story = StoryObj<MenuStoryArgs>

export const Default: Story = {
  play: async ({ args, canvas, canvasElement, userEvent }) => {
    // The popup renders in a portal on the body, outside the story's canvas.
    const page = within(canvasElement.ownerDocument.body)
    const trigger = canvas.getByRole("button", { name: "More" })

    await userEvent.click(trigger)
    await userEvent.click(await page.findByRole("menuitem", { name: "Export" }))
    await expect(args.onAction).toHaveBeenLastCalledWith("export")
    await waitFor(() => expect(page.queryByRole("menu")).toBeNull())

    // By keyboard: open on Enter, move with the arrows, choose with Enter,
    // and focus goes back to the trigger.
    trigger.focus()
    await userEvent.keyboard("{Enter}")
    const edit = await page.findByRole("menuitem", { name: "Edit" })
    await waitFor(() => expect(edit).toHaveFocus())
    await userEvent.keyboard("{ArrowDown}")
    await expect(
      page.getByRole("menuitem", { name: "Duplicate" })
    ).toHaveFocus()
    await userEvent.keyboard("{Enter}")
    await expect(args.onAction).toHaveBeenLastCalledWith("duplicate")
    await waitFor(() => expect(trigger).toHaveFocus())

    // Escape closes without choosing.
    await userEvent.keyboard("{Enter}")
    await page.findByRole("menu")
    await userEvent.keyboard("{Escape}")
    await waitFor(() => expect(page.queryByRole("menu")).toBeNull())
    await expect(args.onAction).toHaveBeenCalledTimes(2)
  },
}

export const RowActions: Story = {
  name: "Row actions",
  render: () => (
    <div className="flex w-72 items-center justify-between rounded-md border border-border px-3 py-2 text-sm">
      Maya Okafor
      <Menu>
        <MenuTrigger
          render={
            <Button
              variant="ghost"
              size="icon-xs"
              aria-label="Actions for Maya Okafor"
            />
          }
        >
          <EllipsisIcon aria-hidden="true" />
        </MenuTrigger>
        <MenuContent align="end">
          <MenuItem>
            <PencilIcon />
            Edit
          </MenuItem>
          <MenuItem>
            <UserPlusIcon />
            Assign
          </MenuItem>
          <MenuSeparator />
          <MenuItem variant="destructive">
            <Trash2Icon />
            Remove
          </MenuItem>
        </MenuContent>
      </Menu>
    </div>
  ),
}

export const Checkboxes: Story = {
  render: function Render() {
    const [columns, setColumns] = React.useState({
      team: true,
      role: true,
      projects: false,
    })
    const toggle = (key: keyof typeof columns) => (checked: boolean) =>
      setColumns((current) => ({ ...current, [key]: checked }))
    return (
      <Menu>
        <MenuTrigger render={<Button variant="outline" />}>Columns</MenuTrigger>
        <MenuContent>
          <MenuGroup>
            <MenuLabel inset>Show columns</MenuLabel>
            <MenuCheckboxItem
              checked={columns.team}
              onCheckedChange={toggle("team")}
            >
              Team
            </MenuCheckboxItem>
            <MenuCheckboxItem
              checked={columns.role}
              onCheckedChange={toggle("role")}
            >
              Role
            </MenuCheckboxItem>
            <MenuCheckboxItem
              checked={columns.projects}
              onCheckedChange={toggle("projects")}
            >
              Projects
            </MenuCheckboxItem>
          </MenuGroup>
        </MenuContent>
      </Menu>
    )
  },
}

export const Radio: Story = {
  render: function Render() {
    const [sort, setSort] = React.useState("name")
    return (
      <Menu>
        <MenuTrigger render={<Button variant="outline" />}>Sort</MenuTrigger>
        <MenuContent>
          <MenuGroup>
            <MenuLabel inset>Sort by</MenuLabel>
            <MenuRadioGroup value={sort} onValueChange={setSort}>
              <MenuRadioItem value="name">Name</MenuRadioItem>
              <MenuRadioItem value="team">Team</MenuRadioItem>
              <MenuRadioItem value="projects">Projects</MenuRadioItem>
            </MenuRadioGroup>
          </MenuGroup>
        </MenuContent>
      </Menu>
    )
  },
}

export const Submenu: Story = {
  render: () => (
    <Menu>
      <MenuTrigger render={<Button variant="outline" />}>Members</MenuTrigger>
      <MenuContent>
        <MenuItem>Change role</MenuItem>
        <MenuSub>
          <MenuSubTrigger>Change team</MenuSubTrigger>
          <MenuSubContent>
            <MenuItem>Design</MenuItem>
            <MenuItem>Engineering</MenuItem>
            <MenuItem>Marketing</MenuItem>
          </MenuSubContent>
        </MenuSub>
        <MenuItem disabled>Transfer ownership</MenuItem>
      </MenuContent>
    </Menu>
  ),
}
