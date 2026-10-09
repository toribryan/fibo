import * as React from "react"
import type { Meta, StoryContext, StoryObj } from "@storybook/react-vite"
import {
  BugIcon,
  ChartColumnIcon,
  CirclePlayIcon,
  CopyIcon,
  DownloadIcon,
  EllipsisIcon,
  GlobeIcon,
  PencilIcon,
  SettingsIcon,
  SparklesIcon,
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

/*
 * On the docs page each menu is already open beside its trigger, so a reader
 * sees it without clicking. It stays open and doesn't trap focus there; the
 * story itself, its tests and Chromatic open it by hand as usual.
 */
function shownInDocs(context: Pick<StoryContext, "viewMode">) {
  return context.viewMode === "docs"
    ? { open: true, modal: false, onOpenChange: () => {} }
    : {}
}

// Below its trigger even near the window's edge, so it never covers the text.
function pinnedInDocs(context: Pick<StoryContext, "viewMode">) {
  return context.viewMode === "docs"
    ? { collisionAvoidance: { side: "none" as const } }
    : {}
}

const meta: Meta<MenuStoryArgs> = {
  title: "Base components/Overlays/Menu",
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
    collisionAvoidance: { control: false },
    onAction: { control: false },
    children: { control: false },
    render: { control: false },
  },
  parameters: { controls: { exclude: ["onAction", "children", "render"] } },
  // Room under the trigger for the menu that's open on the docs page.
  decorators: [
    (Story, context) =>
      context.viewMode === "docs" ? (
        <div className="flex min-h-60 items-start">
          <Story />
        </div>
      ) : (
        <Story />
      ),
  ],
  args: { side: "bottom", align: "start", sideOffset: 4, onAction: fn() },
  render: ({ onAction, ...args }, context) => (
    <Menu {...shownInDocs(context)}>
      <MenuTrigger render={<Button variant="outline" />}>More</MenuTrigger>
      <MenuContent {...args} {...pinnedInDocs(context)}>
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
  render: (_args, context) => (
    <div className="flex w-72 items-center justify-between rounded-md border border-border px-3 py-2 text-sm">
      Maya Okafor
      <Menu {...shownInDocs(context)}>
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
        <MenuContent align="end" {...pinnedInDocs(context)}>
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
  render: function Render(_args, context) {
    const [columns, setColumns] = React.useState({
      team: true,
      role: true,
      projects: false,
    })
    const toggle = (key: keyof typeof columns) => (checked: boolean) =>
      setColumns((current) => ({ ...current, [key]: checked }))
    return (
      <Menu {...shownInDocs(context)}>
        <MenuTrigger render={<Button variant="outline" />}>Columns</MenuTrigger>
        <MenuContent {...pinnedInDocs(context)}>
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
  render: function Render(_args, context) {
    const [sort, setSort] = React.useState("name")
    return (
      <Menu {...shownInDocs(context)}>
        <MenuTrigger render={<Button variant="outline" />}>Sort</MenuTrigger>
        <MenuContent {...pinnedInDocs(context)}>
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
  render: (_args, context) => (
    <Menu {...shownInDocs(context)}>
      <MenuTrigger render={<Button variant="outline" />}>Members</MenuTrigger>
      <MenuContent {...pinnedInDocs(context)}>
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

/*
 * An icon keeps a color you give it, so a nav-like menu can tell its
 * destinations apart. Icons without one stay muted. The chart tokens are
 * grays in fibo's own theme and saturated in Mechanical.
 */
export const ColoredIcons: Story = {
  name: "Colored icons",
  render: (_args, context) => (
    <Menu {...shownInDocs(context)}>
      <MenuTrigger render={<Button variant="outline" />}>Products</MenuTrigger>
      <MenuContent {...pinnedInDocs(context)}>
        <MenuItem>
          <ChartColumnIcon className="text-chart-1" />
          Product analytics
        </MenuItem>
        <MenuItem>
          <GlobeIcon className="text-chart-2" />
          Web analytics
        </MenuItem>
        <MenuItem>
          <SparklesIcon className="text-chart-3" />
          Assistant
        </MenuItem>
        <MenuItem>
          <CirclePlayIcon className="text-chart-4" />
          Session replay
        </MenuItem>
        <MenuItem>
          <BugIcon className="text-chart-5" />
          Error tracking
        </MenuItem>
        <MenuSeparator />
        <MenuItem>
          <SettingsIcon />
          Settings
        </MenuItem>
      </MenuContent>
    </Menu>
  ),
  play: async ({ canvas, canvasElement, userEvent }) => {
    const page = within(canvasElement.ownerDocument.body)
    await userEvent.click(canvas.getByRole("button", { name: "Products" }))
    await page.findByRole("menu")
    const color = (name: string) =>
      getComputedStyle(
        page.getByRole("menuitem", { name }).querySelector("svg")!
      ).color
    await expect(color("Product analytics")).not.toBe(color("Settings"))
    await expect(color("Product analytics")).not.toBe(color("Web analytics"))
  },
}
