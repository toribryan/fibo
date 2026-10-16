import * as React from "react"

import { content as defaultContent, type SitemapContent } from "./data.js"
import {
  SitemapDescription,
  SitemapGroup,
  SitemapHeader,
  SitemapLayout,
  SitemapLink,
  SitemapSearch,
  SitemapSection,
  SitemapSections,
  SitemapSuggestion,
  SitemapSuggestions,
  SitemapTitle,
} from "./parts.js"

type SitemapProps = Omit<
  React.ComponentProps<"div">,
  "children" | "content"
> & {
  /** The page's words and links. Defaults to the placeholder in `data.ts`. */
  content?: SitemapContent
  /** Folds each group, such as a state's cities, behind a toggle. The first stays open. */
  collapsible?: boolean
  /** Pins the search as the page scrolls. Set `top` through `--sitemap-sticky-top`. */
  sticky?: boolean
  /** Handles the query in the app. Without it, the search loads `searchAction` with `?q=`. */
  onSearch?: (query: string) => void
  /** The results route the search submits to when there's no `onSearch`. */
  searchAction?: string
}

/**
 * A human-readable sitemap: a location search, popular picks, and every
 * destination grouped by job, in columns that fold to cards on a phone.
 */
function Sitemap({
  content = defaultContent,
  collapsible = true,
  sticky = false,
  onSearch,
  searchAction = "/search",
  ...props
}: SitemapProps) {
  return (
    <SitemapLayout {...props}>
      <SitemapHeader>
        <SitemapTitle>{content.title}</SitemapTitle>
        <SitemapDescription>{content.description}</SitemapDescription>
      </SitemapHeader>
      <SitemapSearch
        placeholder={content.placeholder}
        sticky={sticky}
        onSearch={onSearch}
        action={onSearch ? undefined : searchAction}
      />
      {content.suggestions.length ? (
        <SitemapSuggestions>
          {content.suggestions.map((suggestion) => (
            <SitemapSuggestion key={suggestion.href} href={suggestion.href}>
              {suggestion.label}
            </SitemapSuggestion>
          ))}
        </SitemapSuggestions>
      ) : null}
      <SitemapSections>
        {content.sections.map((section) => {
          const firstGroup = section.entries.findIndex((entry) => entry.links)
          return (
            <SitemapSection key={section.title} title={section.title}>
              {section.entries.map((entry, index) =>
                entry.links ? (
                  <SitemapGroup
                    key={entry.href}
                    title={entry.label}
                    href={entry.href}
                    collapsible={collapsible}
                    defaultOpen={!collapsible || index === firstGroup}
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
          )
        })}
      </SitemapSections>
    </SitemapLayout>
  )
}

export { Sitemap }
export type { SitemapProps }
