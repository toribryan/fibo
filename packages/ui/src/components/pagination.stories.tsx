import * as React from "react"
import type { Meta, StoryObj } from "@storybook/react-vite"
import { expect, fn } from "storybook/test"

import { Pagination } from "./pagination.js"

const meta: Meta<typeof Pagination> = {
  title: "Base components/Navigation/Pagination",
  component: Pagination,
  argTypes: {
    pageCount: { control: { type: "number", min: 1 } },
    pageSize: { control: { type: "number", min: 1 } },
    totalCount: { control: { type: "number", min: 0 } },
    noun: { control: "text" },
    page: { control: false },
    defaultPage: { control: false },
    onPageChange: { control: false },
  },
  parameters: {
    controls: { exclude: ["page", "defaultPage", "onPageChange"] },
  },
  args: {
    pageCount: 400,
    pageSize: 25,
    totalCount: 10000,
    noun: "members",
    onPageChange: fn(),
  },
}

export default meta
type Story = StoryObj<typeof Pagination>

export const Default: Story = {
  play: async ({ args, canvas, userEvent }) => {
    const previous = canvas.getByRole("button", { name: "Previous page" })
    const next = canvas.getByRole("button", { name: "Next page" })
    await expect(previous).toHaveAttribute("aria-disabled", "true")
    await expect(canvas.getByText("1 to 25 of 10,000 members")).toBeVisible()

    await userEvent.click(next)
    await expect(args.onPageChange).toHaveBeenLastCalledWith(2)
    await expect(canvas.getByText("26 to 50 of 10,000 members")).toBeVisible()
    await expect(canvas.getByText("Page 2 of 400")).toBeInTheDocument()

    // By keyboard: Shift+Tab to Previous, Enter goes back to page 1, and
    // focus stays on the now-disabled button.
    await userEvent.tab({ shift: true })
    await expect(previous).toHaveFocus()
    await userEvent.keyboard("{Enter}")
    await expect(args.onPageChange).toHaveBeenLastCalledWith(1)
    await expect(previous).toHaveFocus()
    await expect(previous).toHaveAttribute("aria-disabled", "true")
  },
}

export const Controlled: Story = {
  render: function Render(args) {
    const [page, setPage] = React.useState(6)
    return (
      <Pagination
        {...args}
        page={page}
        onPageChange={setPage}
        pageCount={6}
        pageSize={25}
        totalCount={128}
        noun="articles"
      />
    )
  },
}

export const PagesOnly: Story = {
  name: "Pages only",
  args: { pageCount: 10, pageSize: undefined, totalCount: undefined },
}
