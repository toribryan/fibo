"use client"

import * as React from "react"
import {
  CheckCheckIcon,
  FolderIcon,
  FolderOpenIcon,
  HouseIcon,
  InboxIcon,
  PlusIcon,
} from "lucide-react"

import { Avatar, AvatarFallback } from "@workspace/ui/components/avatar"
import {
  CommandMenu,
  type CommandMenuGroup,
} from "@workspace/ui/components/command-menu"
import { FloatingNav } from "@workspace/ui/components/floating-nav"
import { cn } from "@workspace/ui/lib/utils"

import {
  messages as initialMessages,
  projects as initialProjects,
  user,
  workspace,
  type Page,
  type Project,
} from "./data.js"
import { HomePage, InboxPage, ProjectsPage } from "./pages.js"

const NAV = [
  { value: "home", label: "Home", icon: <HouseIcon /> },
  { value: "projects", label: "Projects", icon: <FolderIcon /> },
  { value: "inbox", label: "Inbox", icon: <InboxIcon /> },
] satisfies { value: Page; label: string; icon: React.ReactNode }[]

type AppShellProps = Omit<React.ComponentProps<"div">, "children"> & {
  /** Where Command menu portals to. Defaults to the body. */
  container?: HTMLElement | null
}

/**
 * A workspace app's frame: a header with Command menu, the current page, and
 * Floating nav to move between pages. Every command changes real state here,
 * so wiring it to your data means replacing the setters below.
 */
function AppShell({ container, className, ...props }: AppShellProps) {
  const [page, setPage] = React.useState<Page>("home")
  const [projects, setProjects] = React.useState(initialProjects)
  const [messages, setMessages] = React.useState(initialMessages)
  const [highlighted, setHighlighted] = React.useState<string>()

  const openProject = (id: string) => {
    setHighlighted(id)
    setPage("projects")
  }

  const createProject = () => {
    const project: Project = {
      id: `untitled-${projects.length + 1}`,
      name: "Untitled project",
      status: "active",
      owner: { name: user.name, initials: user.initials },
      updated: "Just now",
    }
    setProjects((current) => [project, ...current])
    openProject(project.id)
  }

  const groups: CommandMenuGroup[] = [
    {
      label: "Go to",
      items: NAV.map((item) => ({
        value: `go-${item.value}`,
        label: item.label,
        icon: item.icon,
        onSelect: () => setPage(item.value),
      })),
    },
    {
      label: "Projects",
      items: [
        {
          value: "new-project",
          label: "New project",
          icon: <PlusIcon />,
          keywords: ["create", "add"],
          onSelect: createProject,
        },
        {
          value: "open-project",
          label: "Open project",
          icon: <FolderOpenIcon />,
          placeholder: "Search projects…",
          items: projects.map((project) => ({
            value: `open-${project.id}`,
            label: project.name,
            keywords: [project.owner.name],
            onSelect: () => openProject(project.id),
          })),
        },
      ],
    },
    {
      label: "Inbox",
      items: [
        {
          value: "mark-all-read",
          label: "Mark all as read",
          icon: <CheckCheckIcon />,
          disabled: messages.length === 0,
          onSelect: () => {
            setMessages([])
            setPage("inbox")
          },
        },
      ],
    },
  ]

  return (
    <div
      data-slot="app-shell"
      className={cn(
        "@container/app-shell flex min-h-svh flex-col bg-background text-foreground",
        className
      )}
      {...props}
    >
      <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-3 border-b border-border bg-background px-4 @2xl/app-shell:px-8">
        <span className="flex min-w-0 items-center gap-2 text-sm font-semibold">
          <span
            aria-hidden="true"
            className="flex size-7 shrink-0 items-center justify-center rounded-md bg-primary text-xs text-primary-foreground"
          >
            {workspace.initials}
          </span>
          {/* Below md the search needs the room; the name stays for screen readers. */}
          <span className="sr-only truncate @md/app-shell:not-sr-only">
            {workspace.name}
          </span>
        </span>
        <div className="ml-auto flex items-center gap-3">
          <CommandMenu
            groups={groups}
            container={container}
            placeholder="Search or run a command…"
          />
          <Avatar size="sm">
            <AvatarFallback>{user.initials}</AvatarFallback>
          </Avatar>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-4 pt-8 pb-28 @2xl/app-shell:px-8">
        {page === "home" ? (
          <HomePage
            firstName={user.firstName}
            projects={projects}
            onOpenProject={openProject}
          />
        ) : page === "projects" ? (
          <ProjectsPage
            projects={projects}
            highlighted={highlighted}
            onCreate={createProject}
          />
        ) : (
          <InboxPage
            messages={messages}
            onMarkAllRead={() => setMessages([])}
          />
        )}
      </main>

      {/* Sticky rather than fixed, so the nav stays inside the shell wherever
          it's mounted, and the main padding keeps the last row clear of it. */}
      <div className="pointer-events-none sticky bottom-4 flex justify-center px-4">
        <FloatingNav
          items={NAV}
          value={page}
          onValueChange={(value) => setPage(value as Page)}
          position="static"
          aria-label="Pages"
        />
      </div>
    </div>
  )
}

export { AppShell }
export type { AppShellProps }
