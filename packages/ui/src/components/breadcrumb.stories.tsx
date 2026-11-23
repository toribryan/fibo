import * as React from "react"
import type { Meta, StoryObj } from "@storybook/react-vite"
import { DatabaseIcon } from "lucide-react"
import { expect, screen, waitFor } from "storybook/test"

import {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbMenuTrigger,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "./breadcrumb.js"
import { Menu, MenuContent, MenuRadioGroup, MenuRadioItem } from "./menu.js"

const meta: Meta<typeof Breadcrumb> = {
  title: "Base components/Navigation/Breadcrumb",
  component: Breadcrumb,
  tags: ["new"],
}

export default meta
type Story = StoryObj<typeof Breadcrumb>

const databases = ["Orion", "Sigma", "Dorado"]

function DatabaseSwitcher() {
  const [database, setDatabase] = React.useState(databases[0])
  return (
    <Menu>
      <BreadcrumbMenuTrigger icon={<DatabaseIcon />}>
        {database}
      </BreadcrumbMenuTrigger>
      <MenuContent>
        <MenuRadioGroup
          value={database}
          onValueChange={(value) => setDatabase(value as string)}
        >
          {databases.map((name) => (
            <MenuRadioItem key={name} value={name} closeOnClick>
              {name}
            </MenuRadioItem>
          ))}
        </MenuRadioGroup>
      </MenuContent>
    </Menu>
  )
}

export const Default: Story = {
  render: (args) => (
    <Breadcrumb {...args}>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink href="#">Acme</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbLink href="#">Databases</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <DatabaseSwitcher />
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  ),
  play: async ({ canvas, userEvent }) => {
    const trigger = canvas.getByRole("button", { name: "Orion" })

    await userEvent.click(trigger)
    await userEvent.click(
      await screen.findByRole("menuitemradio", { name: "Sigma" })
    )
    await expect(canvas.getByRole("button", { name: "Sigma" })).toBeVisible()
    await waitFor(() => expect(screen.queryByRole("menu")).toBeNull())

    // By keyboard: open on Enter, arrow down to Dorado, pick it with Enter,
    // and focus goes back to the trigger.
    trigger.focus()
    await userEvent.keyboard("{Enter}")
    const orion = await screen.findByRole("menuitemradio", { name: "Orion" })
    await waitFor(() => expect(orion).toHaveFocus())
    await userEvent.keyboard("{ArrowDown}{ArrowDown}")
    await expect(
      screen.getByRole("menuitemradio", { name: "Dorado" })
    ).toHaveFocus()
    await userEvent.keyboard("{Enter}")
    await expect(canvas.getByRole("button", { name: "Dorado" })).toBeVisible()
    await waitFor(() => expect(trigger).toHaveFocus())
  },
}

export const Links: Story = {
  render: (args) => (
    <Breadcrumb {...args}>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink href="#">Home</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbLink href="#">Components</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage>Breadcrumb</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  ),
}

export const Collapsed: Story = {
  render: (args) => (
    <Breadcrumb {...args}>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink href="#">Home</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbEllipsis />
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbLink href="#">Navigation</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage>Breadcrumb</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  ),
}

export const SlashSeparator: Story = {
  name: "Slash separator",
  render: (args) => (
    <Breadcrumb {...args}>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink href="#">acme</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator>/</BreadcrumbSeparator>
        <BreadcrumbItem>
          <DatabaseSwitcher />
        </BreadcrumbItem>
        <BreadcrumbSeparator>/</BreadcrumbSeparator>
        <BreadcrumbItem>
          <BreadcrumbPage>Tables</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  ),
}
