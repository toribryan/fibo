// Placeholder content for the Sitemap block: a directory of care homes, the
// shape it was first sketched for. Swap it for your own site's pages.

/** A link, or a group of links when it has `links`, such as a state and its cities. */
type SitemapEntry = {
  label: string
  href: string
  links?: SitemapEntry[]
}

type SitemapContent = {
  title: string
  description: string
  placeholder: string
  /** Popular destinations shown under the search. */
  suggestions: { label: string; href: string }[]
  /** Columns of the directory, each a job someone came to do. */
  sections: { title: string; entries: SitemapEntry[] }[]
}

const LOCATIONS = [
  { state: "Arizona", cities: ["Phoenix", "Scottsdale", "Mesa", "Tucson"] },
  { state: "Colorado", cities: ["Denver", "Boulder", "Fort Collins"] },
  { state: "Oregon", cities: ["Portland", "Eugene", "Bend"] },
]

const slug = (text: string) =>
  `#${text.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`

const content: SitemapContent = {
  title: "Explore care homes",
  description: "Find a community near you, or browse the directory below.",
  placeholder: "Search city, state or ZIP code",
  suggestions: [
    { label: "Phoenix, AZ", href: "#phoenix-arizona" },
    { label: "Scottsdale, AZ", href: "#scottsdale-arizona" },
    { label: "Denver, CO", href: "#denver-colorado" },
  ],
  sections: [
    {
      title: "Find a home",
      entries: [
        { label: "Browse all homes", href: "#homes" },
        { label: "Available now", href: "#available" },
        { label: "Browse by state", href: "#states" },
        { label: "Browse by city", href: "#cities" },
      ],
    },
    {
      title: "Browse locations",
      entries: [
        ...LOCATIONS.map(({ state, cities }) => ({
          label: state,
          href: slug(state),
          links: cities.map((city) => ({
            label: city,
            href: slug(`${city} ${state}`),
          })),
        })),
        { label: "All locations", href: "#locations" },
      ],
    },
    {
      title: "Care resources",
      entries: [
        { label: "Care options", href: "#care-options" },
        { label: "Choosing care", href: "#choosing-care" },
        { label: "Cost and affordability", href: "#cost" },
        { label: "Caregiver resources", href: "#caregivers" },
      ],
    },
    {
      title: "About",
      entries: [
        { label: "About us", href: "#about" },
        { label: "Contact", href: "#contact" },
        { label: "List a home", href: "#list" },
        { label: "Privacy", href: "#privacy" },
      ],
    },
  ],
}

export { content }
export type { SitemapContent, SitemapEntry }
