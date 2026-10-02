// use_figma script, one call per page. Replace PAGE_ID. Returns each
// top-level component on the page with its properties, `#id` suffixes
// dropped: variant properties as their options, the rest as their type.
const page = await figma.getNodeByIdAsync("PAGE_ID")
await figma.setCurrentPageAsync(page)
const owners = page
  .findAllWithCriteria({ types: ["COMPONENT_SET", "COMPONENT"] })
  .filter((n) => n.type === "COMPONENT_SET" || n.parent?.type !== "COMPONENT_SET")
return Object.fromEntries(
  owners.map((n) => [
    n.name,
    Object.fromEntries(
      Object.entries(n.componentPropertyDefinitions).map(([key, d]) => [
        key.replace(/#.*$/, ""),
        d.type === "VARIANT" ? d.variantOptions : d.type,
      ])
    ),
  ])
)
