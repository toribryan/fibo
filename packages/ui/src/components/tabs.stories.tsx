import type { Meta, StoryObj } from "@storybook/react-vite"
import {
  BellIcon,
  CreditCardIcon,
  InboxIcon,
  ShieldIcon,
  StarIcon,
  UserIcon,
} from "lucide-react"
import * as React from "react"
import { expect, fn, waitFor } from "storybook/test"

import { Badge } from "./badge.js"
import { Button } from "./button.js"
import { Count } from "./count.js"
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "./field.js"
import { Input } from "./input.js"
import { Switch } from "./switch.js"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  type TabsListProps,
} from "./tabs.js"

type Args = React.ComponentProps<typeof Tabs> &
  Pick<TabsListProps, "variant" | "size">

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

const meta: Meta<Args> = {
  title: "Base components/Navigation/Tabs",
  component: Tabs,
  subcomponents: { TabsList, TabsTrigger, TabsContent },
  tags: ["new"],
  argTypes: {
    variant: { control: "inline-radio", options: ["default", "line"] },
    size: { control: "inline-radio", options: ["sm", "default"] },
    orientation: {
      control: "inline-radio",
      options: ["horizontal", "vertical"],
    },
    value: { control: false },
    defaultValue: { control: false },
    onValueChange: { control: false },
  },
  args: {
    variant: "default",
    size: "default",
    orientation: "horizontal",
    defaultValue: "overview",
    onValueChange: fn(),
  },
  parameters: {
    controls: { exclude: ["value", "defaultValue", "onValueChange"] },
  },
  render: ({ variant, size, ...args }) => (
    <Tabs {...args} className="w-96 max-w-full">
      <TabsList variant={variant} size={size} aria-label="Project">
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
  ),
}

export default meta
type Story = StoryObj<Args>

export const Default: Story = {
  play: async ({ args, canvas, userEvent }) => {
    const overview = canvas.getByRole("tab", { name: "Overview" })
    const activity = canvas.getByRole("tab", { name: "Activity" })
    const settings = canvas.getByRole("tab", { name: "Settings" })
    await expect(overview).toHaveAttribute("aria-selected", "true")
    await expect(canvas.getByText(SECTIONS[0]!.body)).toBeVisible()

    await userEvent.click(activity)
    await expect(activity).toHaveAttribute("aria-selected", "true")
    await expect(overview).toHaveAttribute("aria-selected", "false")
    await expect(args.onValueChange).toHaveBeenLastCalledWith(
      "activity",
      expect.anything()
    )
    await expect(canvas.getByText(SECTIONS[1]!.body)).toBeVisible()
    await waitFor(() =>
      expect(canvas.queryByText(SECTIONS[0]!.body)).toBeNull()
    )
    await expect(canvas.getByRole("tabpanel")).toHaveAccessibleName("Activity")

    // Arrows move focus only; Enter or Space picks the focused tab.
    await userEvent.keyboard("{ArrowRight}")
    await expect(settings).toHaveFocus()
    await expect(settings).toHaveAttribute("aria-selected", "false")
    await userEvent.keyboard("{Enter}")
    await expect(settings).toHaveAttribute("aria-selected", "true")
    await expect(canvas.getByText(SECTIONS[2]!.body)).toBeVisible()

    await userEvent.keyboard("{Home}")
    await expect(overview).toHaveFocus()
    await userEvent.keyboard("{End}")
    await expect(settings).toHaveFocus()
    await userEvent.keyboard("{ArrowRight}")
    await expect(overview).toHaveFocus()
    await userEvent.keyboard(" ")
    await expect(overview).toHaveAttribute("aria-selected", "true")
  },
}

export const Line: Story = {
  args: { variant: "line" },
}

export const Small: Story = {
  args: { size: "sm" },
}

export const Vertical: Story = {
  args: { orientation: "vertical" },
  render: ({ size, ...args }) => (
    <div className="flex flex-col gap-10">
      {(["default", "line"] as const).map((kind) => (
        <Tabs key={kind} {...args} className="w-96 max-w-full">
          <TabsList
            variant={kind}
            size={size}
            aria-label={kind === "default" ? "Project" : "Project, line"}
          >
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
      ))}
    </div>
  ),
  play: async ({ canvas, userEvent }) => {
    const [, activity] = canvas.getAllByRole("tab", { name: "Activity" })
    await userEvent.click(activity!)
    await userEvent.keyboard("{ArrowDown}")
    const [, settings] = canvas.getAllByRole("tab", { name: "Settings" })
    await expect(settings).toHaveFocus()
  },
}

export const WithIconsAndCounts: Story = {
  name: "With icons and counts",
  render: (args) => (
    <div className="flex flex-col gap-8">
      <Tabs defaultValue="inbox" orientation={args.orientation}>
        <TabsList variant="line" size={args.size} aria-label="Mail">
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
      <Tabs defaultValue="inbox" orientation={args.orientation}>
        <TabsList size={args.size} aria-label="Mail, segmented">
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
  ),
  play: async ({ canvas }) => {
    await expect(
      canvas.getAllByRole("tab", { name: /Inbox/ })[0]
    ).toHaveAccessibleName("Inbox 128 unread")
  },
}

export const DisabledTab: Story = {
  name: "Disabled tab",
  render: ({ variant, size, ...args }) => (
    <Tabs {...args} className="w-96 max-w-full">
      <TabsList variant={variant} size={size} aria-label="Project">
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="activity">Activity</TabsTrigger>
        <TabsTrigger value="billing" disabled>
          Billing
        </TabsTrigger>
        <TabsTrigger value="settings">Settings</TabsTrigger>
      </TabsList>
    </Tabs>
  ),
  play: async ({ canvas, userEvent }) => {
    const billing = canvas.getByRole("tab", { name: "Billing" })
    await expect(billing).toHaveAttribute("aria-disabled", "true")
    await userEvent.click(canvas.getByRole("tab", { name: "Activity" }))
    // Base UI keeps a disabled tab reachable by arrow, so it can be found
    // and read out, but Enter on it changes nothing.
    await userEvent.keyboard("{ArrowRight}")
    await expect(billing).toHaveFocus()
    await userEvent.keyboard("{Enter}")
    await expect(billing).toHaveAttribute("aria-selected", "false")
    await userEvent.keyboard("{ArrowRight}")
    await expect(canvas.getByRole("tab", { name: "Settings" })).toHaveFocus()
  },
}

function ControlledTabs(args: Args) {
  const [value, setValue] = React.useState("activity")
  return (
    <div className="flex w-96 max-w-full flex-col gap-4">
      <Tabs
        value={value}
        onValueChange={(next, details) => {
          setValue(next)
          args.onValueChange?.(next, details)
        }}
      >
        <TabsList variant={args.variant} size={args.size} aria-label="Project">
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
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span>
          Showing <span className="text-foreground">{value}</span>
        </span>
        <Button
          size="sm"
          variant="outline"
          className="ml-auto"
          onClick={() => setValue("overview")}
        >
          Back to overview
        </Button>
      </div>
    </div>
  )
}

export const Controlled: Story = {
  render: (args) => <ControlledTabs {...args} />,
  play: async ({ canvas, userEvent }) => {
    const overview = canvas.getByRole("tab", { name: "Overview" })
    await expect(canvas.getByRole("tab", { name: "Activity" })).toHaveAttribute(
      "aria-selected",
      "true"
    )
    await userEvent.click(
      canvas.getByRole("button", { name: "Back to overview" })
    )
    await expect(overview).toHaveAttribute("aria-selected", "true")
  },
}

const MANY = [
  "Overview",
  "Issues",
  "Pull requests",
  "Discussions",
  "Actions",
  "Projects",
  "Wiki",
  "Security",
  "Insights",
  "Settings",
]

export const Overflowing: Story = {
  render: ({ size }) => (
    <div className="flex w-72 max-w-full flex-col gap-8 rounded-xl border border-dashed border-border p-3">
      {(["default", "line"] as const).map((kind) => (
        <Tabs key={kind} defaultValue="settings">
          <TabsList
            variant={kind}
            size={size}
            aria-label={kind === "line" ? "Repository, line" : "Repository"}
          >
            {MANY.map((label) => (
              <TabsTrigger key={label} value={label.toLowerCase()}>
                {label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      ))}
    </div>
  ),
  play: async ({ canvasElement }) => {
    const list = canvasElement.querySelector<HTMLElement>(
      "[data-slot=tabs-list]"
    )!
    await expect(list.scrollWidth).toBeGreaterThan(list.clientWidth)
    // The active tab is the last, so the list starts scrolled to show it.
    await waitFor(() => expect(list.scrollLeft).toBeGreaterThan(0))
  },
}

function AccountSettingsCard() {
  return (
    <Tabs
      defaultValue="profile"
      className="w-[36rem] max-w-full rounded-xl border border-border bg-card p-4 text-card-foreground"
    >
      <TabsList variant="line" aria-label="Account settings">
        <TabsTrigger value="profile">
          <UserIcon aria-hidden="true" />
          Profile
        </TabsTrigger>
        <TabsTrigger value="notifications">
          <BellIcon aria-hidden="true" />
          Notifications
        </TabsTrigger>
        <TabsTrigger value="security">
          <ShieldIcon aria-hidden="true" />
          Security
        </TabsTrigger>
        <TabsTrigger value="billing">
          <CreditCardIcon aria-hidden="true" />
          Billing
        </TabsTrigger>
      </TabsList>
      <TabsContent value="profile" className="pt-2">
        <FieldGroup>
          <Field>
            <FieldLabel>Name</FieldLabel>
            <Input defaultValue="Ana Ruiz" />
          </Field>
          <Field>
            <FieldLabel>Email</FieldLabel>
            <Input type="email" defaultValue="ana@example.com" />
            <FieldDescription>Where replies and receipts go.</FieldDescription>
          </Field>
          <div className="flex justify-end">
            <Button size="sm">Save profile</Button>
          </div>
        </FieldGroup>
      </TabsContent>
      <TabsContent value="notifications" className="pt-2">
        <FieldGroup>
          <Field orientation="horizontal">
            <FieldContent>
              <FieldLabel>Replies</FieldLabel>
              <FieldDescription>When someone answers you.</FieldDescription>
            </FieldContent>
            <Switch defaultChecked />
          </Field>
          <Field orientation="horizontal">
            <FieldContent>
              <FieldLabel>Weekly digest</FieldLabel>
              <FieldDescription>A summary every Monday.</FieldDescription>
            </FieldContent>
            <Switch />
          </Field>
        </FieldGroup>
      </TabsContent>
      <TabsContent value="security" className="pt-2">
        <p className="text-muted-foreground">
          Two-step sign-in is on. You last signed in from Lisbon today.
        </p>
      </TabsContent>
      <TabsContent value="billing" className="pt-2">
        <p className="text-muted-foreground">
          Team plan, renews on 1 November.
        </p>
      </TabsContent>
    </Tabs>
  )
}

export const AccountSettings: Story = {
  name: "Account settings",
  render: () => <AccountSettingsCard />,
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("tab", { name: "Notifications" }))
    await expect(canvas.getByRole("switch", { name: "Replies" })).toBeChecked()
  },
}
