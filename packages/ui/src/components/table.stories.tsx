import type * as React from "react"
import type { Meta, StoryObj } from "@storybook/react-vite"

import { Badge } from "./badge.js"
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "./table.js"

const AGENTS = [
  {
    name: "Maya Okafor",
    team: "Tier 1 Support",
    status: "On shift",
    adherence: 97,
  },
  { name: "Priya Raman", team: "Billing", status: "On break", adherence: 91 },
  {
    name: "Jordan Alvarez",
    team: "Tier 2 Escalations",
    status: "On shift",
    adherence: 88,
  },
  { name: "Sam Whitfield", team: "Chat", status: "Time off", adherence: 94 },
  { name: "Rosa Delgado", team: "Phone", status: "Offline", adherence: 90 },
] as const

const STATUS_VARIANT = {
  "On shift": "success",
  "On break": "warning",
  "Time off": "info",
  Offline: "secondary",
} as const

const meta: Meta<typeof Table> = {
  title: "Base components/Table",
  component: Table,
  subcomponents: {
    TableHeader,
    TableBody,
    TableFooter,
    TableRow,
    TableHead,
    TableCell,
    TableCaption,
  },
  tags: ["new"],
  argTypes: { children: { control: false } },
  parameters: { controls: { exclude: ["children"] } },
  render: (args) => (
    <Table {...args}>
      <TableCaption>Agents on the support floor today.</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>Agent</TableHead>
          <TableHead>Team</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Adherence</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {AGENTS.map((agent) => (
          <TableRow key={agent.name}>
            <TableCell className="font-medium">{agent.name}</TableCell>
            <TableCell>{agent.team}</TableCell>
            <TableCell>
              <Badge variant={STATUS_VARIANT[agent.status]}>
                {agent.status}
              </Badge>
            </TableCell>
            <TableCell className="text-right text-muted-foreground tabular-nums">
              {agent.adherence}%
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  ),
}

export default meta
type Story = StoryObj<typeof Table>

type PlaygroundArgs = React.ComponentProps<typeof Table> & {
  previewWidth: "100%" | "480px" | "320px"
  rows: number
  selectedRow: "none" | "1" | "2" | "3"
  showCaption: boolean
  showFooter: boolean
}

/*
 * The playground. Table's parts only take HTML attributes, so its controls
 * change what the story renders instead.
 */
export const Default: StoryObj<PlaygroundArgs> = {
  args: {
    previewWidth: "100%",
    rows: 5,
    selectedRow: "none",
    showCaption: true,
    showFooter: false,
  },
  argTypes: {
    previewWidth: {
      name: "width",
      description: "The width it sits in. Narrower than the table, it scrolls.",
      control: "inline-radio",
      options: ["100%", "480px", "320px"],
    },
    rows: {
      description: "How many body rows.",
      control: { type: "range", min: 1, max: 5, step: 1 },
    },
    selectedRow: {
      name: "selected row",
      description: "Sets data-selected on one row.",
      control: "inline-radio",
      options: ["none", "1", "2", "3"],
    },
    showCaption: {
      name: "caption",
      description: "Names the table with a TableCaption.",
      control: "boolean",
    },
    showFooter: {
      name: "footer",
      description: "Adds a TableFooter with the average.",
      control: "boolean",
    },
  },
  render: ({
    previewWidth,
    rows,
    selectedRow,
    showCaption,
    showFooter,
    ...args
  }) => {
    const agents = AGENTS.slice(0, rows)
    const average = Math.round(
      agents.reduce((sum, agent) => sum + agent.adherence, 0) / agents.length
    )
    return (
      <div style={{ width: previewWidth, maxWidth: "100%" }}>
        <Table {...args} aria-label={showCaption ? undefined : "Agents"}>
          {showCaption ? (
            <TableCaption>Agents on the support floor today.</TableCaption>
          ) : null}
          <TableHeader>
            <TableRow>
              <TableHead>Agent</TableHead>
              <TableHead>Team</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Adherence</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {agents.map((agent, index) => (
              <TableRow
                key={agent.name}
                data-selected={
                  selectedRow === String(index + 1) ? true : undefined
                }
              >
                <TableCell className="font-medium">{agent.name}</TableCell>
                <TableCell>{agent.team}</TableCell>
                <TableCell>
                  <Badge variant={STATUS_VARIANT[agent.status]}>
                    {agent.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {agent.adherence}%
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
          {showFooter ? (
            <TableFooter>
              <TableRow>
                <TableCell colSpan={3}>Average</TableCell>
                <TableCell className="text-right tabular-nums">
                  {average}%
                </TableCell>
              </TableRow>
            </TableFooter>
          ) : null}
        </Table>
      </div>
    )
  },
}

export const WithFooter: Story = {
  name: "With footer",
  render: (args) => (
    <Table {...args}>
      <TableHeader>
        <TableRow>
          <TableHead>Team</TableHead>
          <TableHead className="text-right">Agents</TableHead>
          <TableHead className="text-right">Tickets today</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {(
          [
            ["Tier 1 Support", 42, 1280],
            ["Tier 2 Escalations", 18, 312],
            ["Billing", 11, 240],
          ] as const
        ).map(([team, agents, tickets]) => (
          <TableRow key={team}>
            <TableCell className="font-medium">{team}</TableCell>
            <TableCell className="text-right tabular-nums">{agents}</TableCell>
            <TableCell className="text-right tabular-nums">
              {tickets.toLocaleString("en-US")}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
      <TableFooter>
        <TableRow>
          <TableCell>Total</TableCell>
          <TableCell className="text-right tabular-nums">71</TableCell>
          <TableCell className="text-right tabular-nums">1,832</TableCell>
        </TableRow>
      </TableFooter>
    </Table>
  ),
}

export const Selected: Story = {
  render: (args) => (
    <Table {...args}>
      <TableHeader>
        <TableRow>
          <TableHead>Agent</TableHead>
          <TableHead>Team</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {AGENTS.slice(0, 3).map((agent, index) => (
          <TableRow key={agent.name} data-selected={index === 1 || undefined}>
            <TableCell className="font-medium">{agent.name}</TableCell>
            <TableCell>{agent.team}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  ),
}

export const Wide: Story = {
  render: (args) => (
    <div className="max-w-md">
      <Table {...args}>
        <TableHeader>
          <TableRow>
            {["Agent", "Team", "Channels", "Shift", "Occupancy", "CSAT"].map(
              (label) => (
                <TableHead key={label}>{label}</TableHead>
              )
            )}
          </TableRow>
        </TableHeader>
        <TableBody>
          {AGENTS.map((agent) => (
            <TableRow key={agent.name}>
              <TableCell className="font-medium">{agent.name}</TableCell>
              <TableCell>{agent.team}</TableCell>
              <TableCell>Chat, Email</TableCell>
              <TableCell>8:00 to 16:30</TableCell>
              <TableCell>82%</TableCell>
              <TableCell>4.8</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  ),
}
