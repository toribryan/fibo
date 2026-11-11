"use client"

import * as React from "react"
import {
  CalendarIcon,
  FilePlusIcon,
  FileTextIcon,
  InboxIcon,
  LaptopIcon,
  LogOutIcon,
  MoonIcon,
  PaletteIcon,
  SettingsIcon,
  SunIcon,
  UserIcon,
  UserPlusIcon,
} from "lucide-react"

import { Avatar, AvatarFallback } from "@workspace/ui/components/avatar"
import { Button } from "@workspace/ui/components/button"
import {
  CommandMenu,
  type CommandMenuGroup,
} from "@workspace/ui/components/command-menu"

function FilePreview({
  title,
  edited,
  body,
}: {
  title: string
  edited: string
  body: string
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex aspect-[4/3] items-center justify-center rounded-md border border-border bg-muted">
        <FileTextIcon
          aria-hidden="true"
          className="size-8 text-muted-foreground"
        />
      </div>
      <div className="flex flex-col gap-0.5">
        <span className="font-medium">{title}</span>
        <span className="text-xs text-muted-foreground">Edited {edited}</span>
      </div>
      <p className="text-muted-foreground">{body}</p>
    </div>
  )
}

function PersonPreview({
  name,
  initials,
  role,
}: {
  name: string
  initials: string
  role: string
}) {
  return (
    <div className="flex flex-col items-start gap-3">
      <Avatar className="size-12">
        <AvatarFallback>{initials}</AvatarFallback>
      </Avatar>
      <div className="flex flex-col gap-0.5">
        <span className="font-medium">{name}</span>
        <span className="text-xs text-muted-foreground">{role}</span>
      </div>
    </div>
  )
}

const person = (
  value: string,
  name: string,
  initials: string,
  role: string
) => ({
  value,
  label: name,
  icon: <UserIcon />,
  preview: <PersonPreview name={name} initials={initials} role={role} />,
})

const GROUPS: CommandMenuGroup[] = [
  {
    label: "Suggestions",
    items: [
      {
        value: "new-file",
        label: "New file",
        icon: <FilePlusIcon />,
        shortcut: ["⌘", "N"],
        keywords: ["create", "document"],
      },
      { value: "inbox", label: "Go to inbox", icon: <InboxIcon /> },
      { value: "calendar", label: "Open calendar", icon: <CalendarIcon /> },
    ],
  },
  {
    label: "Actions",
    items: [
      {
        value: "theme",
        label: "Change theme",
        icon: <PaletteIcon />,
        keywords: ["appearance", "mode"],
        placeholder: "Pick a theme…",
        items: [
          { value: "theme-light", label: "Light", icon: <SunIcon /> },
          { value: "theme-dark", label: "Dark", icon: <MoonIcon /> },
          { value: "theme-system", label: "System", icon: <LaptopIcon /> },
        ],
      },
      {
        value: "assign",
        label: "Assign to",
        icon: <UserPlusIcon />,
        placeholder: "Search people…",
        items: [
          person("ada", "Ada Lovelace", "AL", "Engineering"),
          person("grace", "Grace Hopper", "GH", "Platform"),
          person("katherine", "Katherine Johnson", "KJ", "Research"),
        ],
      },
    ],
  },
  {
    label: "Settings",
    items: [
      {
        value: "profile",
        label: "Profile",
        icon: <UserIcon />,
        shortcut: ["⌘", "P"],
      },
      {
        value: "preferences",
        label: "Preferences",
        icon: <SettingsIcon />,
        shortcut: ["⌘", ","],
      },
      { value: "sign-out", label: "Sign out", icon: <LogOutIcon /> },
    ],
  },
]

const FILES: CommandMenuGroup[] = [
  {
    label: "Files",
    items: [
      {
        value: "roadmap",
        label: "Roadmap 2027",
        icon: <FileTextIcon />,
        preview: (
          <FilePreview
            title="Roadmap 2027"
            edited="2 hours ago"
            body="Themes for next year: a faster editor, shared libraries and offline mode."
          />
        ),
      },
      {
        value: "research",
        label: "Research notes",
        icon: <FileTextIcon />,
        preview: (
          <FilePreview
            title="Research notes"
            edited="yesterday"
            body="Twelve interviews on how teams hand designs to engineering."
          />
        ),
      },
      {
        value: "launch",
        label: "Launch checklist",
        icon: <FileTextIcon />,
        preview: (
          <FilePreview
            title="Launch checklist"
            edited="last week"
            body="Docs, changelog, social posts and the support macro."
          />
        ),
      },
    ],
  },
  {
    label: "People",
    items: [
      person("ada", "Ada Lovelace", "AL", "Engineering"),
      person("grace", "Grace Hopper", "GH", "Platform"),
    ],
  },
  {
    label: "Actions",
    items: [{ value: "new-file", label: "New file", icon: <FilePlusIcon /> }],
  },
]

// Every demo sets hotkey={null}: the docs site's own search owns Cmd+K, and
// several menus on one page would all open on the same key.
export function CommandMenuDefaultDemo() {
  return (
    <CommandMenu
      groups={GROUPS}
      hotkey={null}
      placeholder="Type a command or search…"
    />
  )
}

export function CommandMenuPreviewDemo() {
  return (
    <CommandMenu
      groups={FILES}
      hotkey={null}
      placeholder="Search files, people and actions…"
    />
  )
}

export function CommandMenuInsetDemo() {
  return (
    <CommandMenu
      groups={GROUPS}
      hotkey={null}
      variant="inset"
      placeholder="Type a command or search…"
    />
  )
}

export function CommandMenuControlledDemo() {
  const [open, setOpen] = React.useState(false)
  const [last, setLast] = React.useState<string | null>(null)
  return (
    <div className="flex flex-col items-start gap-3 text-sm">
      <Button variant="outline" onClick={() => setOpen(true)}>
        Open commands
      </Button>
      <p>
        Last command: <span className="font-medium">{last ?? "none"}</span>
      </p>
      <CommandMenu
        groups={GROUPS}
        hotkey={null}
        trigger={null}
        open={open}
        onOpenChange={setOpen}
        onSelect={(item) => setLast(item.label)}
      />
    </div>
  )
}
