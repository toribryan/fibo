// use_figma script, one call per page. Replace PAGE_ID. Read-only. Counts
// frames that were detached from a component instance, grouped by the
// component they came from, with up to three node ids each to look at.
// Run it on the library file or on any file that uses the library.
const page = await figma.getNodeByIdAsync("PAGE_ID")
await figma.setCurrentPageAsync(page)
const byComponent = {}
for (const frame of page.findAllWithCriteria({ types: ["FRAME"] })) {
  const info = frame.detachedInfo
  if (!info) continue
  let name = "unknown"
  if (info.type === "local") {
    const main = await figma.getNodeByIdAsync(info.componentId)
    if (main) {
      name =
        main.parent?.type === "COMPONENT_SET" ? main.parent.name : main.name
    }
  } else {
    name = `library:${info.componentKey}`
  }
  const entry = (byComponent[name] ??= { count: 0, nodes: [] })
  entry.count++
  if (entry.nodes.length < 3) entry.nodes.push(frame.id)
}
return { page: page.name.trim(), byComponent }
