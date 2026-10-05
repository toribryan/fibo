import type { Meta, StoryObj } from "@storybook/react-vite"
import { AtSignIcon, SearchIcon, XIcon } from "lucide-react"
import * as React from "react"
import { expect } from "storybook/test"

import { Button } from "./button.js"
import { Field, FieldDescription, FieldLabel } from "./field.js"
import { InputGroup, InputGroupAddon, InputGroupInput } from "./input-group.js"
import { Kbd } from "./kbd.js"

const meta: Meta<typeof InputGroup> = {
  title: "Base components/Forms/Input group",
  component: InputGroup,
  tags: ["new"],
  argTypes: {
    variant: { control: "inline-radio", options: ["default", "ghost"] },
    size: { control: "inline-radio", options: ["sm", "default"] },
  },
  args: { variant: "default", size: "default" },
  render: (args) => (
    <InputGroup {...args} className="w-72">
      <InputGroupAddon>
        <SearchIcon aria-hidden="true" />
      </InputGroupAddon>
      <InputGroupInput type="search" placeholder="Search" aria-label="Search" />
    </InputGroup>
  ),
}

export default meta
type Story = StoryObj<typeof InputGroup>

export const Default: Story = {
  play: async ({ canvas, canvasElement, userEvent }) => {
    const input = canvas.getByRole("searchbox", { name: "Search" })
    await userEvent.click(
      canvasElement.querySelector("[data-slot=input-group-addon]")!
    )
    await expect(input).toHaveFocus()
    await userEvent.keyboard("ada")
    await expect(input).toHaveValue("ada")
  },
}

export const Small: Story = {
  args: { size: "sm" },
}

export const Ghost: Story = {
  name: "Ghost, in a menu",
  render: () => (
    <div className="w-72 overflow-hidden rounded-xl border border-border bg-popover shadow-lg">
      <InputGroup variant="ghost" className="h-11 border-b border-border">
        <InputGroupAddon>
          <SearchIcon aria-hidden="true" />
        </InputGroupAddon>
        <InputGroupInput placeholder="Type a command" aria-label="Command" />
        <InputGroupAddon align="inline-end">
          <Kbd>Esc</Kbd>
        </InputGroupAddon>
      </InputGroup>
      <p className="px-3 py-6 text-center text-sm text-muted-foreground">
        Recent commands show here.
      </p>
    </div>
  ),
}

function ClearableSearch() {
  const [value, setValue] = React.useState("Lovelace")
  return (
    <InputGroup className="w-72">
      <InputGroupAddon>
        <SearchIcon aria-hidden="true" />
      </InputGroupAddon>
      <InputGroupInput
        aria-label="Search people"
        value={value}
        onChange={(event) => setValue(event.target.value)}
      />
      {value ? (
        <InputGroupAddon align="inline-end">
          <Button
            variant="ghost"
            size="icon-xs"
            aria-label="Clear search"
            onClick={() => setValue("")}
          >
            <XIcon aria-hidden="true" />
          </Button>
        </InputGroupAddon>
      ) : null}
    </InputGroup>
  )
}

export const WithAButton: Story = {
  name: "With a button",
  render: () => <ClearableSearch />,
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Clear search" }))
    await expect(
      canvas.getByRole("textbox", { name: "Search people" })
    ).toHaveValue("")
  },
}

export const InAField: Story = {
  name: "In a field",
  render: () => (
    <Field className="w-72" invalid>
      <FieldLabel>Handle</FieldLabel>
      <InputGroup>
        <InputGroupAddon>
          <AtSignIcon aria-hidden="true" />
        </InputGroupAddon>
        <InputGroupInput defaultValue="ada" />
      </InputGroup>
      <FieldDescription>Letters, numbers and dashes.</FieldDescription>
    </Field>
  ),
  play: async ({ canvas }) => {
    const input = canvas.getByLabelText("Handle")
    await expect(input).toHaveAccessibleDescription(/Letters, numbers/)
    await expect(input).toHaveAttribute("aria-invalid", "true")
  },
}
