import { resolvePath, splitFrontmatter } from "./skills-source.js"

/*
 * The collection's own contract, AUTHORING.md and the definition of done in
 * AGENTS.md, as checks a browser can run. Each rule quotes the standard it
 * enforces, so a failing check reads as the rule it breaks. A warning marks a
 * rule the contract words as a default ("if one fits", "when a neighbor is
 * closer") rather than a requirement.
 */

type Level = "fail" | "warn"
type Kind = "skill" | "agent" | "file"

type Rule = {
  id: string
  kind: Kind
  level: Level
  label: string
  /** Where the collection states the rule. */
  source: "AUTHORING.md" | "AGENTS.md"
}

type Finding = { rule: string; message: string }
type FileReport = { path: string; kind: Kind; findings: Finding[] }

const SECTIONS = [
  "When to use",
  "Inputs",
  "Process",
  "Standards",
  "Output",
  "Verify",
  "Anti-patterns",
  "Related skills",
  "References",
]
const MAX_DESCRIPTION = 600
const MAX_LINES = 300
const WRITE_TOOLS = ["Write", "Edit", "MultiEdit", "NotebookEdit"]
const ROUTER = "product-design-process"
// Proper nouns keep their capital in a sentence-case title.
const PROPER_NOUNS = new Set(["Fibo", "Figma", "Storybook", "Tailwind"])

const RULES: Rule[] = [
  {
    id: "skill-frontmatter",
    kind: "skill",
    level: "fail",
    label: "Frontmatter has a name and a description",
    source: "AUTHORING.md",
  },
  {
    id: "skill-name",
    kind: "skill",
    level: "fail",
    label: "The name matches the folder",
    source: "AGENTS.md",
  },
  {
    id: "skill-description-length",
    kind: "skill",
    level: "fail",
    label: `The description is ${MAX_DESCRIPTION} characters or fewer`,
    source: "AUTHORING.md",
  },
  {
    id: "skill-triggers",
    kind: "skill",
    level: "fail",
    label: "The description quotes at least two trigger phrases",
    source: "AUTHORING.md",
  },
  {
    id: "skill-not-for",
    kind: "skill",
    level: "warn",
    label: "The description says what it is not for",
    source: "AUTHORING.md",
  },
  {
    id: "skill-length",
    kind: "skill",
    level: "fail",
    label: `SKILL.md is ${MAX_LINES} lines or fewer`,
    source: "AUTHORING.md",
  },
  {
    id: "skill-title",
    kind: "skill",
    level: "warn",
    label: "The title is in sentence case",
    source: "AUTHORING.md",
  },
  {
    id: "skill-sections",
    kind: "skill",
    level: "fail",
    label: "The nine body sections are present, in order",
    source: "AUTHORING.md",
  },
  {
    id: "skill-extra-sections",
    kind: "skill",
    level: "warn",
    label: "No sections outside the contract",
    source: "AUTHORING.md",
  },
  {
    id: "skill-reviewer",
    kind: "skill",
    level: "warn",
    label: "Verify names a reviewer subagent",
    source: "AUTHORING.md",
  },
  {
    id: "skill-related",
    kind: "skill",
    level: "fail",
    label: "Related skills names only skills and reviewers that exist",
    source: "AGENTS.md",
  },
  {
    id: "skill-readme",
    kind: "skill",
    level: "fail",
    label: "The skill is in the README table",
    source: "AGENTS.md",
  },
  {
    id: "skill-phase-map",
    kind: "skill",
    level: "fail",
    label: "The skill is on the phase map",
    source: "AGENTS.md",
  },
  {
    id: "agent-frontmatter",
    kind: "agent",
    level: "fail",
    label: "Frontmatter has a name, a description and tools",
    source: "AUTHORING.md",
  },
  {
    id: "agent-name",
    kind: "agent",
    level: "fail",
    label: "The name matches the file",
    source: "AUTHORING.md",
  },
  {
    id: "agent-read-only",
    kind: "agent",
    level: "fail",
    label: "No write tools",
    source: "AGENTS.md",
  },
  {
    id: "agent-description",
    kind: "agent",
    level: "fail",
    label: "The description says it is read-only",
    source: "AUTHORING.md",
  },
  {
    id: "agent-checklist",
    kind: "agent",
    level: "fail",
    label: "A numbered checklist of things that can fail",
    source: "AUTHORING.md",
  },
  {
    id: "agent-verdict",
    kind: "agent",
    level: "fail",
    label: "Ends in a one-line verdict: ready, or N blocking issues",
    source: "AUTHORING.md",
  },
  {
    id: "links",
    kind: "file",
    level: "fail",
    label: "Every relative link resolves",
    source: "AGENTS.md",
  },
]

const RULE_BY_ID = new Map(RULES.map((rule) => [rule.id, rule]))

// Headings and links inside fenced code are examples, not structure.
function proseLines(body: string) {
  let fenced = false
  return body.split(/\r?\n/).map((line) => {
    if (/^\s*(```|~~~)/.test(line)) {
      fenced = !fenced
      return ""
    }
    return fenced ? "" : line
  })
}

function headings(body: string, level: number) {
  const marker = `${"#".repeat(level)} `
  return proseLines(body)
    .filter((line) => line.startsWith(marker))
    .map((line) => line.slice(marker.length).trim())
}

function section(body: string, name: string) {
  const lines = proseLines(body)
  const start = lines.findIndex((line) => line.trim() === `## ${name}`)
  if (start === -1) return ""
  const end = lines.findIndex(
    (line, index) => index > start && line.startsWith("## ")
  )
  return lines.slice(start + 1, end === -1 ? undefined : end).join("\n")
}

function backticked(text: string) {
  return [...text.matchAll(/`([^`\n]+)`/g)].map((match) => match[1]!)
}

function checkLinks(path: string, source: string, paths: string[]) {
  const findings: Finding[] = []
  const exists = (target: string) =>
    target === "" ||
    paths.includes(target) ||
    paths.some((candidate) => candidate.startsWith(`${target}/`))
  for (const line of proseLines(source)) {
    // Inline code can hold link-shaped text, such as a regex or a template.
    const prose = line.replace(/`[^`\n]*`/g, "")
    for (const match of prose.matchAll(/\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g)) {
      const href = match[1]!
      if (/^[a-z]+:/i.test(href) || href.startsWith("#")) continue
      const target = resolvePath(path, href.split("#")[0]!.replace(/\/$/, ""))
      if (!exists(target))
        findings.push({
          rule: "links",
          message: `${href} does not resolve`,
        })
    }
  }
  return findings
}

type Collection = {
  /** Every path in the collection, relative to its root. */
  paths: string[]
  /** Loaded sources by path: every Markdown file. */
  files: Map<string, string>
}

function checkSkill(
  path: string,
  source: string,
  context: {
    skills: Set<string>
    agents: Set<string>
    readme: string
    router: string
  }
): Finding[] {
  const findings: Finding[] = []
  const add = (rule: string, message: string) =>
    findings.push({ rule, message })
  const folder = path.split("/")[1]!
  const { meta, body } = splitFrontmatter(source)
  const description = meta.description ?? ""

  if (!meta.name || !description)
    add(
      "skill-frontmatter",
      `Missing ${[!meta.name && "name", !description && "description"].filter(Boolean).join(" and ")}`
    )
  if (meta.name && meta.name !== folder)
    add("skill-name", `name is ${meta.name}, folder is ${folder}`)
  if (description.length > MAX_DESCRIPTION)
    add(
      "skill-description-length",
      `${description.length} characters, ${description.length - MAX_DESCRIPTION} over`
    )
  const triggers = description.match(/"[^"]+"/g)?.length ?? 0
  if (description && triggers < 2)
    add("skill-triggers", triggers ? "One quoted phrase" : "No quoted phrases")
  if (description && !/\bnot for\b/i.test(description))
    add("skill-not-for", "No “Not for” pointer to a neighbor skill")

  const lines = source.replace(/\n$/, "").split(/\r?\n/).length
  if (lines > MAX_LINES)
    add("skill-length", `${lines} lines, ${lines - MAX_LINES} over`)

  const title = headings(body, 1)[0]
  const capitalized = (title ?? "")
    .split(/\s+/)
    .slice(1)
    .filter((word) => /^[A-Z][a-z]/.test(word) && !PROPER_NOUNS.has(word))
  if (capitalized.length)
    add("skill-title", `“${title}” capitalizes ${capitalized.join(", ")}`)

  const found = headings(body, 2)
  const missing = SECTIONS.filter((name) => !found.includes(name))
  const order = found.filter((name) => SECTIONS.includes(name))
  if (missing.length) add("skill-sections", `Missing ${missing.join(", ")}`)
  else if (order.some((name, index) => name !== SECTIONS[index]))
    add("skill-sections", `Out of order: ${order.join(", ")}`)
  const extra = found.filter((name) => !SECTIONS.includes(name))
  if (extra.length) add("skill-extra-sections", `Also has ${extra.join(", ")}`)

  if (
    found.includes("Verify") &&
    !backticked(section(body, "Verify")).some((name) =>
      context.agents.has(name)
    )
  )
    add("skill-reviewer", "Verify hands nothing to a reviewer")

  const unknown = backticked(section(body, "Related skills")).filter(
    (name) =>
      /^[a-z]+(-[a-z]+)+$|^[a-z]+$/.test(name) &&
      !context.skills.has(name) &&
      !context.agents.has(name)
  )
  if (unknown.length)
    add("skill-related", `No skill or reviewer named ${unknown.join(", ")}`)

  if (!context.readme.includes(`skills/${folder}/SKILL.md`))
    add("skill-readme", "Not linked from the README's skill tables")
  if (
    folder !== ROUTER &&
    !context.router
      .split(/\r?\n/)
      .some((line) => line.startsWith("|") && line.includes(`\`${folder}\``))
  )
    add("skill-phase-map", `Not in a phase or track of ${ROUTER}`)

  return findings
}

function checkAgent(path: string, source: string): Finding[] {
  const findings: Finding[] = []
  const add = (rule: string, message: string) =>
    findings.push({ rule, message })
  const file = path.split("/")[1]!.replace(/\.md$/, "")
  const { meta, body } = splitFrontmatter(source)

  const missing = ["name", "description", "tools"].filter((key) => !meta[key])
  if (missing.length) add("agent-frontmatter", `Missing ${missing.join(", ")}`)
  if (meta.name && meta.name !== file)
    add("agent-name", `name is ${meta.name}, file is ${file}.md`)

  const tools = (meta.tools ?? "").split(",").map((tool) => tool.trim())
  const writes = tools.filter((tool) => WRITE_TOOLS.includes(tool))
  if (writes.length) add("agent-read-only", `Grants ${writes.join(", ")}`)
  if (meta.description && !/read-only/i.test(meta.description))
    add("agent-description", "The description never says read-only")

  const items = proseLines(body).filter((line) => /^\d+\.\s/.test(line))
  if (items.length < 3)
    add(
      "agent-checklist",
      `${items.length} numbered item${items.length === 1 ? "" : "s"}`
    )

  const ending = body
    .trim()
    .split(/\r?\n/)
    .filter((line) => line.trim())
    .slice(-3)
    .join(" ")
  if (!/`ready`/.test(ending) || !/blocking issues/.test(ending))
    add("agent-verdict", "The last lines do not state the verdict")

  return findings
}

function checkCollection({ paths, files }: Collection): FileReport[] {
  const skills = new Set(
    paths.flatMap(
      (path) => /^skills\/([^/]+)\/SKILL\.md$/.exec(path)?.[1] ?? []
    )
  )
  const agents = new Set(
    paths.flatMap((path) => /^agents\/([^/]+)\.md$/.exec(path)?.[1] ?? [])
  )
  const context = {
    skills,
    agents,
    readme: files.get("README.md") ?? "",
    router: files.get(`skills/${ROUTER}/SKILL.md`) ?? "",
  }
  const reports: FileReport[] = []
  for (const [path, source] of files) {
    const kind: Kind = /^skills\/[^/]+\/SKILL\.md$/.test(path)
      ? "skill"
      : /^agents\/[^/]+\.md$/.test(path)
        ? "agent"
        : "file"
    const findings = [
      ...(kind === "skill" ? checkSkill(path, source, context) : []),
      ...(kind === "agent" ? checkAgent(path, source) : []),
      ...checkLinks(path, source, paths),
    ]
    reports.push({ path, kind, findings })
  }
  const rank = { skill: 0, agent: 1, file: 2 }
  return reports.sort(
    (a, b) => rank[a.kind] - rank[b.kind] || a.path.localeCompare(b.path)
  )
}

export { RULES, RULE_BY_ID, checkCollection }
export type { Collection, FileReport, Finding, Kind, Level, Rule }
