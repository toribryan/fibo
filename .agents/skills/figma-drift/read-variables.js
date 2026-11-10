// use_figma script. Returns the Color collection as aliases per mode, the
// Border collection's values, and the Color variables' descriptions, in
// figma/snapshot.json's shape. pnpm tokens:build writes globals.css from it.
const collections = await figma.variables.getLocalVariableCollectionsAsync()
const variables = await figma.variables.getLocalVariablesAsync()
const byId = Object.fromEntries(variables.map((v) => [v.id, v]))
const value = (v) =>
  v && typeof v === "object" && v.type === "VARIABLE_ALIAS"
    ? byId[v.id]?.name
    : v
const read = (name) => {
  const collection = collections.find((c) => c.name === name)
  if (!collection) return null
  const single = collection.modes.length === 1
  return Object.fromEntries(
    collection.variableIds.map((id) => {
      const v = byId[id]
      return [
        v.name,
        single
          ? value(v.valuesByMode[collection.modes[0].modeId])
          : Object.fromEntries(
              collection.modes.map((m) => [m.name, value(v.valuesByMode[m.modeId])])
            ),
      ]
    })
  )
}
// Figma returns descriptions HTML-escaped.
const unescape = (text) =>
  text
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
const color = collections.find((c) => c.name === "Color")
const descriptions = Object.fromEntries(
  color.variableIds
    .map((id) => byId[id])
    .filter((v) => v.description)
    .map((v) => [v.name, unescape(v.description)])
)
return {
  Color: read("Color"),
  Border: read("Border"),
  ColorDescriptions: descriptions,
}
