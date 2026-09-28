import type { Meta, StoryObj } from "@storybook/react-vite"
import type { ComponentProps } from "react"
import { expect, fn, waitFor, within } from "storybook/test"

import { Label } from "./label.js"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "./select.js"

const FRUITS = [
  { value: "apple", label: "Apple" },
  { value: "banana", label: "Banana" },
  { value: "blueberry", label: "Blueberry" },
  { value: "grapes", label: "Grapes" },
  { value: "pineapple", label: "Pineapple" },
]

type Args = ComponentProps<typeof Select> & {
  size: "sm" | "default"
  invalid: boolean
}

const meta: Meta<Args> = {
  title: "Components/Select",
  component: Select,
  subcomponents: {
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem,
    SelectGroup,
    SelectLabel,
    SelectSeparator,
  },
  tags: ["new"],
  argTypes: {
    size: {
      control: "inline-radio",
      options: ["default", "sm"],
      description: "The trigger's height: 36 pixels, or 32 for dense forms.",
      table: { category: "SelectTrigger" },
    },
    invalid: {
      control: "boolean",
      description: "Sets `aria-invalid` on the trigger.",
      table: { category: "SelectTrigger" },
    },
    disabled: { control: "boolean" },
    items: { control: false },
    onValueChange: { control: false },
  },
  args: {
    size: "default",
    disabled: false,
    invalid: false,
    onValueChange: fn(),
  },
  parameters: { controls: { exclude: ["onValueChange", "items"] } },
  render: ({ size, invalid, ...args }) => (
    <Select {...args} items={FRUITS}>
      <SelectTrigger
        size={size}
        aria-label="Fruit"
        aria-invalid={invalid || undefined}
        className="w-48"
      >
        <SelectValue placeholder="Pick a fruit" />
      </SelectTrigger>
      <SelectContent>
        {FRUITS.map((fruit) => (
          <SelectItem key={fruit.value} value={fruit.value}>
            {fruit.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  ),
}

export default meta
type Story = StoryObj<Args>

export const Default: Story = {
  play: async ({ args, canvas, canvasElement, userEvent }) => {
    // The list renders in a portal on the body, outside the story's canvas.
    const page = within(canvasElement.ownerDocument.body)
    const trigger = canvas.getByRole("combobox", { name: "Fruit" })
    await expect(trigger).toHaveTextContent("Pick a fruit")

    await userEvent.click(trigger)
    await userEvent.click(await page.findByRole("option", { name: "Banana" }))
    await expect(trigger).toHaveTextContent("Banana")
    await expect(args.onValueChange).toHaveBeenLastCalledWith(
      "banana",
      expect.anything()
    )
    await waitFor(() => expect(page.queryByRole("listbox")).toBeNull())

    // By keyboard: open, move down one, choose, and focus returns.
    trigger.focus()
    await userEvent.keyboard("{Enter}")
    await page.findByRole("listbox")
    await userEvent.keyboard("{ArrowDown}{Enter}")
    await expect(trigger).toHaveTextContent("Blueberry")
    await waitFor(() => expect(trigger).toHaveFocus())
  },
}

export const Small: Story = {
  args: { size: "sm" },
}

export const Disabled: Story = {
  args: { disabled: true },
}

export const Invalid: Story = {
  args: { invalid: true },
}

export const WithLabel: Story = {
  name: "With label",
  render: () => (
    <div className="flex w-56 flex-col gap-2">
      <Label htmlFor="timezone">Timezone</Label>
      <Select
        defaultValue="europe-london"
        items={[
          { value: "europe-london", label: "London" },
          { value: "america-new-york", label: "New York" },
          { value: "asia-tokyo", label: "Tokyo" },
        ]}
      >
        <SelectTrigger id="timezone" className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="europe-london">London</SelectItem>
          <SelectItem value="america-new-york">New York</SelectItem>
          <SelectItem value="asia-tokyo">Tokyo</SelectItem>
        </SelectContent>
      </Select>
    </div>
  ),
}

export const Groups: Story = {
  render: () => (
    <Select
      items={[
        { value: "carrot", label: "Carrot" },
        { value: "leek", label: "Leek" },
        { value: "pear", label: "Pear" },
        { value: "plum", label: "Plum" },
      ]}
    >
      <SelectTrigger aria-label="Produce" className="w-48">
        <SelectValue placeholder="Pick produce" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>Fruit</SelectLabel>
          <SelectItem value="pear">Pear</SelectItem>
          <SelectItem value="plum">Plum</SelectItem>
        </SelectGroup>
        <SelectSeparator />
        <SelectGroup>
          <SelectLabel>Vegetables</SelectLabel>
          <SelectItem value="carrot">Carrot</SelectItem>
          <SelectItem value="leek">Leek</SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  ),
}
