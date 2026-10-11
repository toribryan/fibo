// Inlined files often import from the same package, such as two sets of
// lucide-react icons. Named imports from one package become one statement,
// deduplicated by local name; anything else (a namespace or a bare default)
// stays as written, once.
export function mergeImports(statements) {
  const out = []
  const bySpec = new Map()
  for (const { text, spec } of statements) {
    const parts = text.match(
      /^import\s+(type\s+)?(?:(\w+)\s*,\s*)?\{([^}]*)\}\s*from\s/
    )
    if (!parts) {
      if (!out.includes(text)) out.push(text)
      continue
    }
    const [, typeOnly, defaultName, list] = parts
    let entry = bySpec.get(spec)
    if (!entry) {
      entry = { spec, texts: new Set(), defaultName, names: new Map() }
      bySpec.set(spec, entry)
      out.push(entry)
    }
    entry.texts.add(text)
    if (defaultName && entry.defaultName && defaultName !== entry.defaultName) {
      throw new Error(
        `${spec} is imported by default as both ${entry.defaultName} and ${defaultName}. Use one name in the source.`
      )
    }
    entry.defaultName ??= defaultName
    for (const item of list
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)) {
      const [, type, imported, local = imported] = item.match(
        /^(type\s+)?(\w+)(?:\s+as\s+(\w+))?$/
      )
      const previous = entry.names.get(local)
      if (previous && previous.imported !== imported) {
        throw new Error(
          `${local} names both ${previous.imported} and ${imported} from ${spec}. Rename one in the source.`
        )
      }
      // A value import covers the type as well, so type-only wins only if both are.
      const isType = Boolean(typeOnly || type) && (previous?.isType ?? true)
      entry.names.set(local, { imported, isType })
    }
  }
  return out.map((entry) => {
    if (typeof entry === "string") return entry
    if (entry.texts.size === 1) return [...entry.texts][0]
    const names = [...entry.names].map(
      ([local, { imported, isType }]) =>
        `${isType ? "type " : ""}${imported}${local === imported ? "" : ` as ${local}`}`
    )
    const head = entry.defaultName ? `${entry.defaultName}, ` : ""
    return `import ${head}{\n  ${names.join(",\n  ")},\n} from "${entry.spec}"`
  })
}
