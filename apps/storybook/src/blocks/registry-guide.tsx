import { Fragment, useEffect, useState, type ReactNode } from "react"
import {
  ArrowDownIcon,
  ArrowRightIcon,
  ArrowUpRightIcon,
  BlocksIcon,
  FileCodeIcon,
  FolderIcon,
  TerminalIcon,
} from "lucide-react"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import { Skeleton } from "@workspace/ui/components/skeleton"

import { FigmaIcon } from "./brand-icons.js"
import { CopyButton } from "./install.js"

const STAGES = [
  { icon: FigmaIcon, title: "Figma library" },
  { icon: FileCodeIcon, title: "fibo's code" },
  { icon: BlocksIcon, title: "Registry files" },
  { icon: TerminalIcon, title: "shadcn CLI" },
  { icon: FolderIcon, title: "Your project" },
]

/** Where a component travels, from the Figma library to a consumer's project. */
function RegistryFlow() {
  return (
    <ol className="my-8 flex list-none flex-col items-start gap-2 p-0 sm:flex-row sm:flex-wrap sm:items-center">
      {STAGES.map(({ icon: Icon, title }, index) => (
        <Fragment key={title}>
          {index > 0 && (
            <li aria-hidden className="text-muted-foreground">
              <ArrowDownIcon className="ml-4 size-4 sm:hidden" />
              <ArrowRightIcon className="hidden size-4 sm:block" />
            </li>
          )}
          <li className="flex items-center gap-2 rounded-full border border-border bg-card py-1.5 pr-3.5 pl-1.5 text-sm font-medium text-foreground">
            <span className="flex size-6 items-center justify-center rounded-full bg-muted">
              <Icon className="size-3.5" />
            </span>
            {title}
          </li>
        </Fragment>
      ))}
    </ol>
  )
}

type RegistryIndex = { items: { name: string; title: string }[] }

type RegistryItem = {
  name: string
  title: string
  description: string
  dependencies?: string[]
  registryDependencies?: string[]
  files: { path: string; type: string }[]
  cssVars?: {
    light?: Record<string, string>
    dark?: Record<string, string>
  }
  css?: Record<string, unknown>
}

// What each package does, in a designer's words.
const PACKAGES: Record<string, string> = {
  "@base-ui/react": "handles keyboard, focus and screen readers",
  "class-variance-authority": "switches between variants and sizes",
  "lucide-react": "draws the icons",
  motion: "runs the animation",
}

// Served beside the docs in production; in local Storybook, only after
// `pnpm registry:build`.
const registryUrl = (name: string) => `./r/${name}.json`

const fileTarget = (file: string) => `components/ui/${file.split("/").pop()}`

const partName = (dependency: string) =>
  dependency
    .split("/")
    .pop()!
    .replace(/\.json$/, "")

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:gap-4">
      <dt className="w-28 shrink-0 pt-0.5 text-xs font-medium text-muted-foreground">
        {label}
      </dt>
      <dd className="m-0 min-w-0 flex-1 text-sm leading-6 text-foreground">
        {children}
      </dd>
    </div>
  )
}

function Nothing({ children }: { children: ReactNode }) {
  return <span className="text-muted-foreground">{children}</span>
}

// A token's value over the page color of its own mode, so translucent tokens
// read the way they do in use.
function Swatch({
  value,
  mode,
}: {
  value: string | undefined
  mode: "light" | "dark"
}) {
  return (
    <span
      title={`${mode}: ${value ?? "not set"}`}
      className="block size-7 rounded-md border border-border p-0.5"
      style={{
        background:
          mode === "dark" ? "var(--color-neutral-950)" : "var(--color-white)",
      }}
    >
      <span
        className="block size-full rounded-sm"
        style={{ background: value }}
      />
    </span>
  )
}

function ItemDetails({
  item,
  titles,
}: {
  item: RegistryItem
  titles: Record<string, string>
}) {
  const command = `pnpm dlx shadcn@latest add @fibo/${item.name}`
  const packages = item.dependencies ?? []
  const parts = (item.registryDependencies ?? []).filter(
    (dependency) => dependency !== "utils"
  )
  const tokens = Object.keys(item.cssVars?.light ?? {})
  const animations = Object.keys(item.css ?? {}).map((rule) =>
    rule.replace("@keyframes ", "")
  )
  const isTheme = item.name === "theme"

  return (
    <dl className="m-0 divide-y divide-border">
      <Row label="Command">
        <span className="flex items-center gap-2">
          <code className="min-w-0 flex-1 overflow-x-auto font-mono text-[0.8125rem] whitespace-pre">
            {command}
          </code>
          <CopyButton value={command} />
        </span>
      </Row>
      <Row label="Files">
        {item.files.length ? (
          <ul className="m-0 flex list-none flex-col gap-1 p-0">
            {item.files.map((file) => (
              <li key={file.path} className="font-mono text-[0.8125rem]">
                {fileTarget(file.path)}
              </li>
            ))}
          </ul>
        ) : (
          <Nothing>None. It only changes your globals.css.</Nothing>
        )}
      </Row>
      {!isTheme && (
        <Row label="Packages">
          {packages.length ? (
            <ul className="m-0 flex list-none flex-col gap-1 p-0">
              {packages.map((name) => (
                <li key={name} className="flex flex-wrap gap-x-3">
                  <code className="font-mono text-[0.8125rem]">{name}</code>
                  {PACKAGES[name] && (
                    <span className="text-muted-foreground">
                      {PACKAGES[name]}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <Nothing>None. It is plain React and Tailwind.</Nothing>
          )}
        </Row>
      )}
      {!isTheme && (
        <Row label="Other fibo parts">
          {parts.length ? (
            parts
              .map((part) => titles[partName(part)] ?? partName(part))
              .join(", ")
          ) : (
            <Nothing>None</Nothing>
          )}
        </Row>
      )}
      <Row label={isTheme ? "Tokens it sets" : "Tokens it adds"}>
        {tokens.length ? (
          <ul className="m-0 grid list-none grid-cols-1 gap-2 p-0 sm:grid-cols-2">
            {tokens.map((name) => (
              <li key={name} className="flex min-w-0 items-center gap-2">
                <Swatch value={item.cssVars?.light?.[name]} mode="light" />
                <Swatch value={item.cssVars?.dark?.[name]} mode="dark" />
                <code className="truncate font-mono text-[0.8125rem]">
                  --{name}
                </code>
              </li>
            ))}
          </ul>
        ) : (
          <Nothing>None. It only uses tokens every shadcn project has.</Nothing>
        )}
      </Row>
      {animations.length > 0 && (
        <Row label="Animations">
          <code className="font-mono text-[0.8125rem]">
            {animations.join(", ")}
          </code>
        </Row>
      )}
    </dl>
  )
}

/**
 * Reads the same registry files the shadcn CLI downloads, so what it shows is
 * exactly what an install does.
 */
function RegistryInspector({ initial = "button" }: { initial?: string }) {
  const [index, setIndex] = useState<RegistryIndex["items"]>()
  const [name, setName] = useState(initial)
  const [loaded, setLoaded] = useState<RegistryItem>()
  const item = loaded?.name === name ? loaded : undefined
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    fetch(registryUrl("registry"))
      .then((response) => {
        if (!response.ok) throw new Error(String(response.status))
        return response.json() as Promise<RegistryIndex>
      })
      .then((registry) => setIndex(registry.items))
      .catch(() => setFailed(true))
  }, [])

  useEffect(() => {
    let current = true
    fetch(registryUrl(name))
      .then((response) => {
        if (!response.ok) throw new Error(String(response.status))
        return response.json() as Promise<RegistryItem>
      })
      .then((next) => current && setLoaded(next))
      .catch(() => current && setFailed(true))
    return () => {
      current = false
    }
  }, [name])

  if (failed) {
    return (
      <p className="my-6 rounded-xl border border-border bg-card px-4 py-3.5 text-sm leading-6 text-muted-foreground">
        The registry files didn&apos;t load. Reload the page to try again.
        Running Storybook locally? Run{" "}
        <code className="font-mono">pnpm registry:build</code> first.
      </p>
    )
  }

  const items = index ?? []
  return (
    <section
      aria-label="What a component brings"
      className="my-6 overflow-hidden rounded-xl border border-border bg-card"
    >
      <header className="flex flex-wrap items-center gap-3 border-b border-border px-4 py-3">
        <Select
          value={name}
          onValueChange={(value) => value && setName(value)}
          items={items.map(({ name: value, title }) => ({
            value,
            label: title,
          }))}
        >
          <SelectTrigger aria-label="Component" className="w-52">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {items.map((entry) => (
              <SelectItem key={entry.name} value={entry.name}>
                {entry.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="order-last w-full text-sm text-muted-foreground sm:order-none sm:w-auto sm:min-w-0 sm:flex-1">
          {item?.description}
        </span>
        <a
          href={registryUrl(name)}
          target="_blank"
          rel="noreferrer"
          className="ml-auto inline-flex items-center gap-1 rounded-sm text-sm text-muted-foreground underline-offset-4 outline-none hover:text-foreground hover:underline focus-visible:ring-[3px] focus-visible:ring-ring-subtle sm:ml-0"
        >
          Raw file
          <ArrowUpRightIcon className="size-3.5" />
        </a>
      </header>
      {item ? (
        <ItemDetails
          item={item}
          titles={Object.fromEntries(
            items.map((entry) => [entry.name, entry.title])
          )}
        />
      ) : (
        <div className="flex flex-col gap-3 p-4">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-5 w-1/2" />
          <Skeleton className="h-5 w-2/3" />
        </div>
      )}
    </section>
  )
}

const COMPARISON = [
  {
    moment: "Adding a component gives you",
    figma: "An instance, linked to the main component",
    registry: "A copy of the code, in your own project",
  },
  {
    moment: "When the library changes",
    figma: "An update appears for you to accept",
    registry: "Nothing changes until you add the part again",
  },
  {
    moment: "Editing",
    figma: "Overrides only; the main component stays locked",
    registry: "Anything; the file is yours",
  },
  {
    moment: "It brings along",
    figma: "Uses the library's styles and variables, which stay in the library",
    registry: "The packages, fibo parts and color tokens it uses",
  },
]

/** How the registry compares to a Figma team library, moment by moment. */
function LibraryComparison() {
  return (
    <div className="my-6 overflow-x-auto">
      <table className="w-full min-w-lg border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-border text-foreground">
            <th className="w-1/4 py-2.5 pr-4 font-medium">
              <span className="sr-only">Moment</span>
            </th>
            <th className="py-2.5 pr-4 font-medium">Figma team library</th>
            <th className="py-2.5 font-medium">fibo registry</th>
          </tr>
        </thead>
        <tbody>
          {COMPARISON.map((row) => (
            <tr
              key={row.moment}
              className="border-b border-border align-top last:border-b-0"
            >
              <th
                scope="row"
                className="py-3 pr-4 leading-6 font-medium text-foreground"
              >
                {row.moment}
              </th>
              <td className="py-3 pr-4 leading-6 text-muted-foreground">
                {row.figma}
              </td>
              <td className="py-3 leading-6 text-foreground">{row.registry}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/** A prompt to paste into a coding agent, with a copy button. */
function AgentPrompt({ children }: { children: string }) {
  return (
    <div className="my-3 flex items-start gap-3 rounded-xl border border-border bg-card px-4 py-3">
      <p className="m-0 min-w-0 flex-1 text-sm leading-6 text-foreground">
        {children}
      </p>
      <CopyButton value={children} />
    </div>
  )
}

export { AgentPrompt, LibraryComparison, RegistryFlow, RegistryInspector }
