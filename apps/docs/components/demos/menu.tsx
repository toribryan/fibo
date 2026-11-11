"use client"

import * as React from "react"
import {
  CopyIcon,
  DownloadIcon,
  EllipsisIcon,
  PencilIcon,
  Trash2Icon,
  UserPlusIcon,
} from "lucide-react"

import { Button } from "@workspace/ui/components/button"
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
} from "@workspace/ui/components/menu"

export function MenuDefaultDemo() {
  return (
    <Menu>
      <MenuTrigger render={<Button variant="outline" />}>More</MenuTrigger>
      <MenuContent>
        <MenuItem>
          <PencilIcon />
          Edit
          <MenuShortcut>E</MenuShortcut>
        </MenuItem>
        <MenuItem>
          <CopyIcon />
          Duplicate
          <MenuShortcut>D</MenuShortcut>
        </MenuItem>
        <MenuItem>
          <DownloadIcon />
          Export
        </MenuItem>
        <MenuSeparator />
        <MenuItem variant="destructive">
          <Trash2Icon />
          Delete
        </MenuItem>
      </MenuContent>
    </Menu>
  )
}

export function MenuRowActionsDemo() {
  return (
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
  )
}

export function MenuCheckboxesDemo() {
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
}

export function MenuRadioDemo() {
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
}

export function MenuSubmenuDemo() {
  return (
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
  )
}

/*
 * A static picture of an open menu for the do's and don'ts, so the rule is
 * visible without opening a real popup on the page. "---" is a separator and
 * a leading "!" marks a destructive item.
 */
export function StaticMenu({ items }: { items: string[] }) {
  return (
    <div className="flex w-40 flex-col rounded-lg border border-border bg-popover p-1 text-sm text-popover-foreground shadow-md">
      {items.map((item, index) =>
        item === "---" ? (
          <span key={index} className="-mx-1 my-1 h-px bg-border" />
        ) : (
          <span
            key={index}
            className={
              item.startsWith("!")
                ? "px-2 py-1.5 text-destructive"
                : "px-2 py-1.5"
            }
          >
            {item.replace("!", "")}
          </span>
        )
      )}
    </div>
  )
}
