import type { Meta, StoryObj } from "@storybook/react-vite"
import { expect } from "storybook/test"

import { Checkbox } from "./checkbox.js"
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "./field.js"
import { Input } from "./input.js"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./select.js"
import { Switch } from "./switch.js"
import { Textarea } from "./textarea.js"

const meta: Meta<typeof Field> = {
  title: "Base components/Forms/Field",
  component: Field,
  argTypes: {
    orientation: {
      control: "inline-radio",
      options: ["vertical", "horizontal"],
    },
    size: { control: "inline-radio", options: ["sm", "default"] },
    invalid: { control: "boolean" },
    disabled: { control: "boolean" },
  },
  args: {
    orientation: "vertical",
    size: "default",
    invalid: false,
    disabled: false,
  },
  render: (args) => (
    <Field {...args} className="w-80">
      <FieldLabel>Work email</FieldLabel>
      <Input type="email" placeholder="you@company.com" />
      <FieldDescription>We send receipts here.</FieldDescription>
      <FieldError>Enter an email address.</FieldError>
    </Field>
  ),
}

export default meta
type Story = StoryObj<typeof Field>

export const Default: Story = {
  play: async ({ canvas }) => {
    const input = canvas.getByLabelText("Work email")
    await expect(input).toHaveAccessibleDescription(/We send receipts here/)
    await expect(canvas.queryByText("Enter an email address.")).toBeNull()
  },
}

export const Invalid: Story = {
  args: { invalid: true },
  play: async ({ canvas }) => {
    const input = canvas.getByLabelText("Work email")
    await expect(input).toHaveAttribute("aria-invalid", "true")
    await expect(canvas.getByText("Enter an email address.")).toBeVisible()
  },
}

export const Disabled: Story = {
  args: { disabled: true },
  play: async ({ canvas }) => {
    await expect(canvas.getByLabelText("Work email")).toBeDisabled()
  },
}

export const WithTextarea: Story = {
  name: "With a textarea",
  render: () => (
    <Field className="w-80">
      <FieldLabel>Message</FieldLabel>
      <Textarea placeholder="What should we know?" />
      <FieldDescription>Markdown works.</FieldDescription>
    </Field>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getByLabelText("Message")).toHaveAccessibleDescription(
      /Markdown works/
    )
  },
}

export const Horizontal: Story = {
  render: () => (
    <div className="flex w-80 flex-col gap-6">
      <Field orientation="horizontal">
        <Checkbox className="mt-0.5" />
        <FieldContent>
          <FieldLabel>Email me about replies</FieldLabel>
          <FieldDescription>At most once an hour.</FieldDescription>
        </FieldContent>
      </Field>
      <Field orientation="horizontal">
        <FieldContent>
          <FieldLabel>Read receipts</FieldLabel>
          <FieldDescription>
            {"Show when you've read a message."}
          </FieldDescription>
        </FieldContent>
        <Switch defaultChecked />
      </Field>
    </div>
  ),
  play: async ({ canvas, userEvent }) => {
    const box = canvas.getByRole("checkbox", { name: "Email me about replies" })
    await userEvent.click(canvas.getByText("Email me about replies"))
    await expect(box).toBeChecked()
    await expect(
      canvas.getByRole("switch", { name: "Read receipts" })
    ).toBeChecked()
  },
}

export const DenseGroup: Story = {
  name: "A dense group",
  render: () => (
    <FieldGroup size="sm" className="w-80">
      <Field>
        <FieldLabel>Name</FieldLabel>
        <Input defaultValue="Ada Lovelace" />
      </Field>
      <Field>
        <FieldLabel>Role</FieldLabel>
        <Select
          defaultValue="editor"
          items={[
            { value: "viewer", label: "Viewer" },
            { value: "editor", label: "Editor" },
            { value: "admin", label: "Admin" },
          ]}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="viewer">Viewer</SelectItem>
            <SelectItem value="editor">Editor</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
          </SelectContent>
        </Select>
      </Field>
      <Field orientation="horizontal">
        <FieldContent>
          <FieldLabel>Notify by email</FieldLabel>
        </FieldContent>
        <Switch defaultChecked />
      </Field>
    </FieldGroup>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getByLabelText("Name")).toHaveAttribute(
      "data-size",
      "sm"
    )
    await expect(
      canvas.getByRole("switch", { name: "Notify by email" })
    ).toHaveAttribute("data-size", "sm")
  },
}
