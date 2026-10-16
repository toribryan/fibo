// Placeholder content for the App shell block. Swap these for your own data;
// the types are what the pages read.

type Page = "home" | "projects" | "inbox"

type ProjectStatus = "active" | "review" | "paused"

type Project = {
  id: string
  name: string
  status: ProjectStatus
  owner: { name: string; initials: string }
  updated: string
}

type Message = {
  id: string
  from: { name: string; initials: string }
  subject: string
  received: string
}

const workspace = { name: "Northwind", initials: "N" }

const user = { name: "Ada Lovelace", firstName: "Ada", initials: "AL" }

const projects: Project[] = [
  {
    id: "atlas",
    name: "Atlas redesign",
    status: "active",
    owner: { name: "Grace Hopper", initials: "GH" },
    updated: "2 hours ago",
  },
  {
    id: "beacon",
    name: "Beacon onboarding",
    status: "review",
    owner: { name: "Ada Lovelace", initials: "AL" },
    updated: "Yesterday",
  },
  {
    id: "cinder",
    name: "Cinder billing",
    status: "paused",
    owner: { name: "Alan Turing", initials: "AT" },
    updated: "Last week",
  },
]

const messages: Message[] = [
  {
    id: "m1",
    from: { name: "Grace Hopper", initials: "GH" },
    subject: "Atlas: final nav spec is ready for review",
    received: "9:41",
  },
  {
    id: "m2",
    from: { name: "Alan Turing", initials: "AT" },
    subject: "Cinder is paused until the pricing call",
    received: "Yesterday",
  },
  {
    id: "m3",
    from: { name: "Katherine Johnson", initials: "KJ" },
    subject: "Beacon copy notes",
    received: "Monday",
  },
]

export { messages, projects, user, workspace }
export type { Message, Page, Project, ProjectStatus }
