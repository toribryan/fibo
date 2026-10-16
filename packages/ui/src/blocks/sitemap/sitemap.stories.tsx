import type { Meta, StoryObj } from "@storybook/react-vite"
import { expect, fn } from "storybook/test"

import { content } from "./data.js"
import {
  SitemapGroup,
  SitemapHeader,
  SitemapLayout,
  SitemapLink,
  SitemapSection,
  SitemapSections,
  SitemapTitle,
} from "./parts.js"
import { Sitemap } from "./sitemap.js"

const meta: Meta<typeof Sitemap> = {
  title: "Blocks/Sitemap",
  component: Sitemap,
  tags: ["new"],
  parameters: {
    layout: "fullscreen",
    controls: { exclude: ["content", "onSearch", "searchAction"] },
  },
  argTypes: {
    collapsible: { control: "boolean" },
    sticky: { control: "boolean" },
  },
  args: {
    collapsible: true,
    sticky: false,
    onSearch: fn(),
  },
}

export default meta
type Story = StoryObj<typeof Sitemap>

export const Default: Story = {
  play: async ({ args, canvas, userEvent, step }) => {
    await step("search by pointer", async () => {
      await userEvent.type(
        canvas.getByRole("searchbox", { name: "Search locations" }),
        " Phoenix "
      )
      await userEvent.click(canvas.getByRole("button", { name: "Search" }))
      await expect(args.onSearch).toHaveBeenLastCalledWith("Phoenix")
    })

    await step("search by keyboard", async () => {
      const field = canvas.getByRole("searchbox", { name: "Search locations" })
      await userEvent.clear(field)
      await userEvent.type(field, "85251{Enter}")
      await expect(args.onSearch).toHaveBeenLastCalledWith("85251")
    })

    await step("fold a state by pointer and keyboard", async () => {
      const toggle = canvas.getByRole("button", {
        name: "Show places in Colorado",
      })
      await expect(toggle).toHaveAttribute("aria-expanded", "false")
      await userEvent.click(toggle)
      await expect(toggle).toHaveAttribute("aria-expanded", "true")
      await expect(canvas.getByRole("link", { name: "Denver" })).toBeVisible()
      toggle.focus()
      await userEvent.keyboard("{Enter}")
      await expect(toggle).toHaveAttribute("aria-expanded", "false")
    })
  },
}

export const Expanded: Story = {
  name: "Every location open",
  args: { collapsible: false },
}

export const StickySearch: Story = {
  name: "Sticky search",
  args: { sticky: true, collapsible: false },
  render: (args) => (
    <div className="h-[36rem] overflow-y-auto">
      <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-border bg-background px-4 md:px-12">
        <span className="text-sm font-semibold">Site name</span>
        <span className="text-sm text-muted-foreground">Browse homes</span>
      </header>
      <Sitemap
        {...args}
        style={{ "--sitemap-sticky-top": "3.5rem" } as React.CSSProperties}
      />
    </div>
  ),
}

export const Phone: Story = {
  name: "On a phone",
  decorators: [
    (Story) => (
      <div className="mx-auto max-w-sm border-x border-border">
        <Story />
      </div>
    ),
  ],
}

/** The parts recomposed: the directory alone, for a footer-linked page. */
export const DirectoryOnly: Story = {
  name: "Directory only",
  render: () => (
    <SitemapLayout>
      <SitemapHeader>
        <SitemapTitle>Sitemap</SitemapTitle>
      </SitemapHeader>
      <SitemapSections>
        {content.sections.map((section) => (
          <SitemapSection key={section.title} title={section.title}>
            {section.entries.map((entry) =>
              entry.links ? (
                <SitemapGroup
                  key={entry.href}
                  title={entry.label}
                  href={entry.href}
                >
                  {entry.links.map((link) => (
                    <SitemapLink key={link.href} href={link.href}>
                      {link.label}
                    </SitemapLink>
                  ))}
                </SitemapGroup>
              ) : (
                <SitemapLink key={entry.href} href={entry.href}>
                  {entry.label}
                </SitemapLink>
              )
            )}
          </SitemapSection>
        ))}
      </SitemapSections>
    </SitemapLayout>
  ),
}
