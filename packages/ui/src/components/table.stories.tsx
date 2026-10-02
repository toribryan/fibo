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

const MEMBERS = [
  { name: "Maya Okafor", team: "Design", status: "Active", projects: 12 },
  { name: "Priya Raman", team: "Engineering", status: "Away", projects: 8 },
  { name: "Jordan Alvarez", team: "Marketing", status: "Active", projects: 5 },
  { name: "Sam Whitfield", team: "Support", status: "Invited", projects: 0 },
  {
    name: "Rosa Delgado",
    team: "Engineering",
    status: "Deactivated",
    projects: 3,
  },
] as const

const STATUS_VARIANT = {
  Active: "success",
  Away: "warning",
  Invited: "info",
  Deactivated: "secondary",
} as const

const meta: Meta<typeof Table> = {
  title: "Base components/Display/Table",
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
  argTypes: { children: { control: false } },
  parameters: { controls: { exclude: ["children"] } },
  render: (args) => (
    <Table {...args}>
      <TableCaption>Members of the Acme workspace.</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>Member</TableHead>
          <TableHead>Team</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Projects</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {MEMBERS.map((member) => (
          <TableRow key={member.name}>
            <TableCell className="font-medium">{member.name}</TableCell>
            <TableCell>{member.team}</TableCell>
            <TableCell>
              <Badge variant={STATUS_VARIANT[member.status]}>
                {member.status}
              </Badge>
            </TableCell>
            <TableCell className="text-right text-muted-foreground tabular-nums">
              {member.projects}
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
      description: "Adds a TableFooter with the total.",
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
    const members = MEMBERS.slice(0, rows)
    const total = members.reduce((sum, member) => sum + member.projects, 0)
    return (
      <div style={{ width: previewWidth, maxWidth: "100%" }}>
        <Table {...args} aria-label={showCaption ? undefined : "Members"}>
          {showCaption ? (
            <TableCaption>Members of the Acme workspace.</TableCaption>
          ) : null}
          <TableHeader>
            <TableRow>
              <TableHead>Member</TableHead>
              <TableHead>Team</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Projects</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {members.map((member, index) => (
              <TableRow
                key={member.name}
                data-selected={
                  selectedRow === String(index + 1) ? true : undefined
                }
              >
                <TableCell className="font-medium">{member.name}</TableCell>
                <TableCell>{member.team}</TableCell>
                <TableCell>
                  <Badge variant={STATUS_VARIANT[member.status]}>
                    {member.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {member.projects}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
          {showFooter ? (
            <TableFooter>
              <TableRow>
                <TableCell colSpan={3}>Total</TableCell>
                <TableCell className="text-right tabular-nums">
                  {total}
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
          <TableHead className="text-right">Members</TableHead>
          <TableHead className="text-right">Storage (GB)</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {(
          [
            ["Design", 14, 1280],
            ["Engineering", 42, 312],
            ["Marketing", 15, 240],
          ] as const
        ).map(([team, members, storage]) => (
          <TableRow key={team}>
            <TableCell className="font-medium">{team}</TableCell>
            <TableCell className="text-right tabular-nums">{members}</TableCell>
            <TableCell className="text-right tabular-nums">
              {storage.toLocaleString("en-US")}
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
          <TableHead>Member</TableHead>
          <TableHead>Team</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {MEMBERS.slice(0, 3).map((member, index) => (
          <TableRow key={member.name} data-selected={index === 1 || undefined}>
            <TableCell className="font-medium">{member.name}</TableCell>
            <TableCell>{member.team}</TableCell>
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
            {[
              "Member",
              "Team",
              "Role",
              "Last active",
              "Projects",
              "Storage",
            ].map((label) => (
              <TableHead key={label}>{label}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {MEMBERS.map((member) => (
            <TableRow key={member.name}>
              <TableCell className="font-medium">{member.name}</TableCell>
              <TableCell>{member.team}</TableCell>
              <TableCell>Editor</TableCell>
              <TableCell>Today</TableCell>
              <TableCell>12</TableCell>
              <TableCell>4.2 GB</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  ),
}
