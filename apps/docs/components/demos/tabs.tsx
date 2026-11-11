"use client"

import { BellIcon, InboxIcon, StarIcon } from "lucide-react"

import { Badge } from "@workspace/ui/components/badge"
import { Count } from "@workspace/ui/components/count"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  type TabsVariant,
} from "@workspace/ui/components/tabs"

const SECTIONS = [
  {
    value: "overview",
    label: "Overview",
    body: "Three releases this month, all on schedule.",
  },
  {
    value: "activity",
    label: "Activity",
    body: "Ana merged the token change two hours ago.",
  },
  {
    value: "settings",
    label: "Settings",
    body: "Notifications go to the whole team.",
  },
]

function ProjectTabs({
  variant,
  orientation,
  label = "Project",
}: {
  variant?: TabsVariant
  orientation?: "horizontal" | "vertical"
  label?: string
}) {
  return (
    <Tabs
      defaultValue="overview"
      orientation={orientation}
      className="w-96 max-w-full"
    >
      <TabsList variant={variant} aria-label={label}>
        {SECTIONS.map((section) => (
          <TabsTrigger key={section.value} value={section.value}>
            {section.label}
          </TabsTrigger>
        ))}
      </TabsList>
      {SECTIONS.map((section) => (
        <TabsContent key={section.value} value={section.value}>
          <p className="text-muted-foreground">{section.body}</p>
        </TabsContent>
      ))}
    </Tabs>
  )
}

export function TabsDemo() {
  return <ProjectTabs />
}

export function TabsLineDemo() {
  return <ProjectTabs variant="line" />
}

export function TabsVerticalDemo() {
  return (
    <div className="flex flex-col gap-10">
      <ProjectTabs orientation="vertical" />
      <ProjectTabs
        orientation="vertical"
        variant="line"
        label="Project, line"
      />
    </div>
  )
}

export function TabsIconsAndCountsDemo() {
  return (
    <div className="flex flex-col gap-8">
      <Tabs defaultValue="inbox">
        <TabsList variant="line" aria-label="Mail">
          <TabsTrigger value="inbox">
            <InboxIcon aria-hidden="true" />
            Inbox
            <Badge variant="outline">
              <Count value={128} max={99} label={(n) => `${n} unread`} />
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="starred">
            <StarIcon aria-hidden="true" />
            Starred
            <Count
              value={4}
              className="text-muted-foreground"
              label={(n) => `${n} starred`}
            />
          </TabsTrigger>
          <TabsTrigger value="alerts">
            <BellIcon aria-hidden="true" />
            Alerts
          </TabsTrigger>
        </TabsList>
      </Tabs>
      <Tabs defaultValue="inbox">
        <TabsList aria-label="Mail, segmented">
          <TabsTrigger value="inbox">
            <InboxIcon aria-hidden="true" />
            Inbox
          </TabsTrigger>
          <TabsTrigger value="starred">
            <StarIcon aria-hidden="true" />
            Starred
          </TabsTrigger>
          <TabsTrigger value="alerts">
            <BellIcon aria-hidden="true" />
            Alerts
          </TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  )
}
