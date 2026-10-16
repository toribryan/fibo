import * as React from "react"
import {
  ArrowRightIcon,
  CheckCheckIcon,
  InboxIcon,
  PlusIcon,
} from "lucide-react"

import { Avatar, AvatarFallback } from "@workspace/ui/components/avatar"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import {
  EmptyState,
  EmptyStateDescription,
  EmptyStateMedia,
  EmptyStateTitle,
} from "@workspace/ui/components/empty-state"
import { Kbd, KbdGroup } from "@workspace/ui/components/kbd"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"

import type { Message, Project, ProjectStatus } from "./data.js"

const STATUS: Record<
  ProjectStatus,
  { label: string; variant: "success" | "info" | "secondary" }
> = {
  active: { label: "Active", variant: "success" },
  review: { label: "In review", variant: "info" },
  paused: { label: "Paused", variant: "secondary" },
}

const noSubscription = () => () => {}

// Matches the key Command menu listens for: Cmd on Apple devices, Ctrl
// elsewhere. The server snapshot keeps the first render hydration-safe.
function useIsMac() {
  return React.useSyncExternalStore(
    noSubscription,
    () => /mac|iphone|ipad/i.test(navigator.platform || navigator.userAgent),
    () => false
  )
}

function PageHeader({
  title,
  description,
  action,
}: {
  title: string
  description: string
  action?: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-4 @lg/app-shell:flex-row @lg/app-shell:items-end">
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <h1 className="m-0 text-2xl font-semibold tracking-tight text-foreground">
          {title}
        </h1>
        <p className="m-0 text-sm text-muted-foreground">{description}</p>
      </div>
      {action}
    </div>
  )
}

function HomePage({
  firstName,
  projects,
  onOpenProject,
}: {
  firstName: string
  projects: Project[]
  onOpenProject: (id: string) => void
}) {
  const mac = useIsMac()
  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title={`Welcome back, ${firstName}`}
        description="Pick up where you left off."
      />
      <section
        aria-labelledby="app-shell-recent"
        className="flex flex-col gap-3"
      >
        <h2
          id="app-shell-recent"
          className="m-0 text-sm font-medium text-muted-foreground"
        >
          Jump back in
        </h2>
        <div className="grid gap-3 @lg/app-shell:grid-cols-3">
          {projects.slice(0, 3).map((project) => (
            <button
              key={project.id}
              type="button"
              onClick={() => onOpenProject(project.id)}
              className="group flex flex-col gap-3 rounded-xl border border-border bg-card p-4 text-left transition-colors hover:border-ring focus-visible:ring-[3px] focus-visible:ring-ring-subtle focus-visible:outline-none"
            >
              <span className="flex items-center gap-2">
                <span className="min-w-0 flex-1 truncate text-sm font-medium text-card-foreground">
                  {project.name}
                </span>
                <ArrowRightIcon
                  aria-hidden="true"
                  className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5"
                />
              </span>
              <span className="text-xs text-muted-foreground">
                Updated {project.updated.toLowerCase()}
              </span>
            </button>
          ))}
        </div>
      </section>
      <p className="m-0 flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
        Press
        <KbdGroup>
          <Kbd>{mac ? "⌘" : "Ctrl"}</Kbd>
          <Kbd>K</Kbd>
        </KbdGroup>
        to search, open a project or create one.
      </p>
    </div>
  )
}

function ProjectsPage({
  projects,
  highlighted,
  onCreate,
}: {
  projects: Project[]
  /** The project opened last, marked so the eye lands on it. */
  highlighted?: string
  onCreate: () => void
}) {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Projects"
        description={`${projects.length} projects in this workspace.`}
        action={
          <Button onClick={onCreate}>
            <PlusIcon data-icon="inline-start" />
            New project
          </Button>
        }
      />
      <div className="overflow-hidden rounded-xl border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="hidden @xl/app-shell:table-cell">
                Owner
              </TableHead>
              <TableHead className="hidden text-right @xl/app-shell:table-cell">
                Updated
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {projects.map((project) => (
              <TableRow
                key={project.id}
                data-state={project.id === highlighted ? "selected" : undefined}
              >
                <TableCell className="font-medium">{project.name}</TableCell>
                <TableCell>
                  <Badge variant={STATUS[project.status].variant}>
                    {STATUS[project.status].label}
                  </Badge>
                </TableCell>
                <TableCell className="hidden @xl/app-shell:table-cell">
                  <span className="flex items-center gap-2">
                    <Avatar size="sm">
                      <AvatarFallback>{project.owner.initials}</AvatarFallback>
                    </Avatar>
                    {project.owner.name}
                  </span>
                </TableCell>
                <TableCell className="hidden text-right text-muted-foreground @xl/app-shell:table-cell">
                  {project.updated}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

function InboxPage({
  messages,
  onMarkAllRead,
}: {
  messages: Message[]
  onMarkAllRead: () => void
}) {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Inbox"
        description={
          messages.length
            ? `${messages.length} unread`
            : "Nothing new since you last looked."
        }
        action={
          messages.length ? (
            <Button variant="outline" onClick={onMarkAllRead}>
              <CheckCheckIcon data-icon="inline-start" />
              Mark all as read
            </Button>
          ) : null
        }
      />
      {messages.length ? (
        <ul className="m-0 flex list-none flex-col divide-y divide-border rounded-xl border border-border p-0">
          {messages.map((message) => (
            <li key={message.id} className="flex items-center gap-3 px-4 py-3">
              <Avatar>
                <AvatarFallback>{message.from.initials}</AvatarFallback>
              </Avatar>
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-sm font-medium text-foreground">
                  {message.subject}
                </span>
                <span className="truncate text-xs text-muted-foreground">
                  {message.from.name}
                </span>
              </span>
              <span className="shrink-0 text-xs text-muted-foreground">
                {message.received}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState className="rounded-xl border border-dashed border-border py-12">
          <EmptyStateMedia>
            <InboxIcon />
          </EmptyStateMedia>
          <EmptyStateTitle>{"You're all caught up"}</EmptyStateTitle>
          <EmptyStateDescription>
            New messages from your projects land here.
          </EmptyStateDescription>
        </EmptyState>
      )}
    </div>
  )
}

export { HomePage, InboxPage, ProjectsPage }
