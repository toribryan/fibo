import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentProps,
  type KeyboardEvent,
  type MouseEvent,
} from "react"
import { Markdown } from "@storybook/addon-docs/blocks"
import {
  ArrowUpRightIcon,
  CheckIcon,
  ChevronRightIcon,
  CopyIcon,
  FileCodeIcon,
  FileTextIcon,
  FolderIcon,
  FolderOpenIcon,
} from "lucide-react"

import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { cn } from "@workspace/ui/lib/utils"

import { LINKS } from "./links.js"
import { mdxComponents } from "./typography.js"

/*
 * The skills live in their own repo and change on their own schedule, so the
 * page reads them from GitHub in the browser instead of copying them in. The
 * site stays static: one tree request per session, one raw request per file.
 */
const REPO = "toribryan/toribryan"
const BRANCH = "main"
const ROOT = "design-skills"
const TREE_URL = `https://api.github.com/repos/${REPO}/git/trees/${BRANCH}?recursive=1`
const RAW_URL = `https://raw.githubusercontent.com/${REPO}/${BRANCH}`
const CACHE_KEY = `fibo-skills-tree:${REPO}@${BRANCH}`

const ENTRY_FILES = ["README.md", "SKILL.md"]

type FileNode = { kind: "file"; name: string; path: string }
type FolderNode = {
  kind: "folder"
  name: string
  path: string
  children: TreeNode[]
}
type TreeNode = FileNode | FolderNode

type GitTree = { tree: { path: string; type: string }[] }

let pathsRequest: Promise<string[]> | undefined
const fileRequests = new Map<string, Promise<string>>()

// The unauthenticated GitHub API allows 60 requests an hour, so the listing
// is kept for the session rather than refetched on every visit to the page.
function loadPaths() {
  pathsRequest ??= (async () => {
    try {
      const cached = sessionStorage.getItem(CACHE_KEY)
      if (cached) return JSON.parse(cached) as string[]
    } catch {
      // Storage can be blocked; the network is the fallback.
    }
    const response = await fetch(TREE_URL)
    if (!response.ok) throw new Error(`GitHub answered ${response.status}`)
    const { tree } = (await response.json()) as GitTree
    const paths = tree
      .filter(
        (item) => item.type === "blob" && item.path.startsWith(`${ROOT}/`)
      )
      .map((item) => item.path.slice(ROOT.length + 1))
    try {
      sessionStorage.setItem(CACHE_KEY, JSON.stringify(paths))
    } catch {
      // Not caching only costs a request next time.
    }
    return paths
  })()
  pathsRequest.catch(() => {
    pathsRequest = undefined
  })
  return pathsRequest
}

function loadFile(path: string) {
  let request = fileRequests.get(path)
  if (!request) {
    request = fetch(`${RAW_URL}/${ROOT}/${path}`).then((response) => {
      if (!response.ok) throw new Error(`GitHub answered ${response.status}`)
      return response.text()
    })
    request.catch(() => fileRequests.delete(path))
    fileRequests.set(path, request)
  }
  return request
}

function buildTree(paths: string[]): FolderNode {
  const root: FolderNode = {
    kind: "folder",
    name: ROOT,
    path: "",
    children: [],
  }
  for (const path of paths) {
    const parts = path.split("/")
    let folder = root
    parts.forEach((name, index) => {
      const nodePath = parts.slice(0, index + 1).join("/")
      if (index === parts.length - 1) {
        folder.children.push({ kind: "file", name, path: nodePath })
        return
      }
      let next = folder.children.find(
        (child): child is FolderNode =>
          child.kind === "folder" && child.name === name
      )
      if (!next) {
        next = { kind: "folder", name, path: nodePath, children: [] }
        folder.children.push(next)
      }
      folder = next
    })
  }
  sortTree(root)
  return root
}

// The entry file (README.md, a skill's SKILL.md) leads its folder, then
// subfolders, then everything else, so the tree reads in the order the
// collection is meant to be read.
function sortTree(folder: FolderNode) {
  const rank = (node: TreeNode) =>
    ENTRY_FILES.includes(node.name) ? 0 : node.kind === "folder" ? 1 : 2
  folder.children.sort(
    (a, b) => rank(a) - rank(b) || a.name.localeCompare(b.name)
  )
  for (const child of folder.children)
    if (child.kind === "folder") sortTree(child)
}

type Frontmatter = Record<string, string>

// Skills and agents open with a small YAML block: plain `key: value` lines,
// or a folded `key: >-` value on the indented lines below it.
function splitFrontmatter(source: string): {
  meta: Frontmatter
  body: string
} {
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/.exec(source)
  if (!match) return { meta: {}, body: source }
  const meta: Frontmatter = {}
  let key: string | undefined
  for (const line of match[1]!.split(/\r?\n/)) {
    const field = /^([\w-]+):\s*(.*)$/.exec(line)
    if (field) {
      key = field[1]!
      const value = field[2]!
      meta[key] = /^[>|]-?$/.test(value)
        ? ""
        : value.replace(/^["']|["']$/g, "")
    } else if (key && line.trim()) {
      meta[key] = `${meta[key]} ${line.trim()}`.trim()
    }
  }
  return { meta, body: source.slice(match[0].length) }
}

function resolvePath(from: string, href: string) {
  const parts = from.split("/").slice(0, -1)
  for (const segment of href.split("/")) {
    if (segment === "..") parts.pop()
    else if (segment && segment !== ".") parts.push(segment)
  }
  return parts.join("/")
}

function visibleNodes(root: FolderNode, expanded: Set<string>) {
  const rows: { node: TreeNode; depth: number; parent?: string }[] = []
  const walk = (folder: FolderNode, depth: number) => {
    for (const node of folder.children) {
      rows.push({ node, depth, parent: folder.path || undefined })
      if (node.kind === "folder" && expanded.has(node.path))
        walk(node, depth + 1)
    }
  }
  walk(root, 0)
  return rows
}

function FileTree({
  root,
  expanded,
  selected,
  onToggle,
  onSelect,
}: {
  root: FolderNode
  expanded: Set<string>
  selected: string
  onToggle: (path: string, open?: boolean) => void
  onSelect: (path: string) => void
}) {
  const rows = visibleNodes(root, expanded)
  const [focused, setFocused] = useState(selected)
  const refs = useRef(new Map<string, HTMLLIElement>())
  const current = rows.some((row) => row.node.path === focused)
    ? focused
    : selected

  const focus = (path: string) => {
    setFocused(path)
    refs.current.get(path)?.focus()
  }

  // The tree follows the WAI-ARIA tree pattern: one tab stop, arrows to move,
  // right and left to open and close folders, enter to open a file.
  const onKeyDown = (event: KeyboardEvent<HTMLUListElement>) => {
    const index = rows.findIndex((row) => row.node.path === current)
    const row = rows[index]
    if (!row) return
    const { node } = row
    const open = node.kind === "folder" && expanded.has(node.path)
    let handled = true
    switch (event.key) {
      case "ArrowDown":
        if (rows[index + 1]) focus(rows[index + 1]!.node.path)
        break
      case "ArrowUp":
        if (rows[index - 1]) focus(rows[index - 1]!.node.path)
        break
      case "Home":
        focus(rows[0]!.node.path)
        break
      case "End":
        focus(rows[rows.length - 1]!.node.path)
        break
      case "ArrowRight":
        if (node.kind === "folder" && !open) onToggle(node.path, true)
        else if (node.kind === "folder" && rows[index + 1])
          focus(rows[index + 1]!.node.path)
        break
      case "ArrowLeft":
        if (open) onToggle(node.path, false)
        else if (row.parent) focus(row.parent)
        break
      case "Enter":
      case " ":
        if (node.kind === "folder") onToggle(node.path)
        else onSelect(node.path)
        break
      default:
        handled = false
    }
    if (handled) event.preventDefault()
  }

  return (
    <ul
      role="tree"
      aria-label="Design skills files"
      onKeyDown={onKeyDown}
      className="flex flex-col py-1"
    >
      {rows.map(({ node, depth }) => {
        const isFolder = node.kind === "folder"
        const open = isFolder && expanded.has(node.path)
        const active = !isFolder && node.path === selected
        const Icon = isFolder
          ? open
            ? FolderOpenIcon
            : FolderIcon
          : node.name.endsWith(".md")
            ? FileTextIcon
            : FileCodeIcon
        return (
          <li
            key={node.path}
            ref={(element) => {
              if (element) refs.current.set(node.path, element)
              else refs.current.delete(node.path)
            }}
            role="treeitem"
            aria-level={depth + 1}
            aria-expanded={isFolder ? open : undefined}
            aria-selected={isFolder ? undefined : active}
            tabIndex={node.path === current ? 0 : -1}
            onFocus={() => setFocused(node.path)}
            onClick={() =>
              isFolder ? onToggle(node.path) : onSelect(node.path)
            }
            style={{ paddingLeft: `${depth * 0.875 + 0.5}rem` }}
            className={cn(
              "flex h-7 cursor-pointer items-center gap-1.5 rounded-md pr-2 font-mono text-[0.8125rem] select-none focus-visible:ring-[3px] focus-visible:ring-ring-subtle focus-visible:outline-none",
              active
                ? "bg-muted text-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <ChevronRightIcon
              aria-hidden
              className={cn(
                "size-3.5 shrink-0 transition-transform",
                isFolder ? "" : "invisible",
                open && "rotate-90"
              )}
            />
            <Icon aria-hidden className="size-4 shrink-0" strokeWidth={1.75} />
            <span className="truncate" title={node.name}>
              {node.name}
            </span>
          </li>
        )
      })}
    </ul>
  )
}

// A file reads inside a pane, so its headings sit a step below the page's,
// and `skip-toc` keeps them out of the page's "On this page" rail.
function H1({ className, ...props }: ComponentProps<"h1">) {
  return (
    <mdxComponents.h1
      className={cn("skip-toc text-3xl sm:text-4xl", className)}
      {...props}
    />
  )
}

function H2({ className, ...props }: ComponentProps<"h2">) {
  return (
    <mdxComponents.h2
      className={cn("skip-toc mt-12 text-xl sm:text-2xl", className)}
      {...props}
    />
  )
}

function H3({ className, ...props }: ComponentProps<"h3">) {
  return (
    <mdxComponents.h3
      className={cn("skip-toc mt-8 text-base", className)}
      {...props}
    />
  )
}

function Table({ className, ...props }: ComponentProps<"table">) {
  return (
    <div className="my-6 overflow-x-auto rounded-xl border border-border">
      <table
        className={cn("w-full border-collapse text-left text-sm", className)}
        {...props}
      />
    </div>
  )
}

function Th({ className, ...props }: ComponentProps<"th">) {
  return (
    <th
      className={cn(
        "border-b border-border bg-muted px-3 py-2 font-semibold text-foreground",
        className
      )}
      {...props}
    />
  )
}

function Td({ className, ...props }: ComponentProps<"td">) {
  return (
    <td
      className={cn(
        "border-b border-border px-3 py-2 align-top text-muted-foreground [tr:last-child>&]:border-b-0",
        className
      )}
      {...props}
    />
  )
}

function Blockquote({ className, ...props }: ComponentProps<"blockquote">) {
  return (
    <blockquote
      className={cn("my-6 border-l-2 border-border pl-4", className)}
      {...props}
    />
  )
}

// Copies the file exactly as it sits in the repo, frontmatter included, so
// it pastes straight into a project's `.claude/skills/` or `.claude/agents/`.
function CopyFileButton({ path }: { path: string }) {
  const [copied, setCopied] = useState<string>()
  const done = copied === path

  useEffect(() => {
    if (!copied) return
    const timer = setTimeout(() => setCopied(undefined), 1500)
    return () => clearTimeout(timer)
  }, [copied])

  return (
    <Button
      variant="ghost"
      size="xs"
      onClick={() => {
        void loadFile(path)
          .then((source) => navigator.clipboard.writeText(source))
          .then(() => setCopied(path))
      }}
    >
      {done ? <CheckIcon aria-hidden /> : <CopyIcon aria-hidden />}
      <span aria-live="polite">{done ? "Copied" : "Copy markdown"}</span>
    </Button>
  )
}

function HeaderLink({ href, children }: ComponentProps<"a">) {
  return (
    <Button
      variant="ghost"
      size="xs"
      nativeButton={false}
      render={<a href={href} target="_blank" rel="noreferrer" />}
    >
      {children}
      <ArrowUpRightIcon aria-hidden />
    </Button>
  )
}

function FileView({
  path,
  paths,
  onSelect,
}: {
  path: string
  paths: Set<string>
  onSelect: (path: string) => void
}) {
  const [state, setState] = useState<
    | { path: string; status: "ready"; source: string }
    | { path: string; status: "error"; message: string }
  >()

  useEffect(() => {
    let live = true
    loadFile(path).then(
      (source) => live && setState({ path, status: "ready", source }),
      (error: Error) =>
        live && setState({ path, status: "error", message: error.message })
    )
    return () => {
      live = false
    }
  }, [path])

  const githubUrl = `https://github.com/${REPO}/blob/${BRANCH}/${ROOT}/${path}`

  // Links between files open in the viewer; anything outside the folder
  // opens on GitHub, and outside links open in a new tab.
  const overrides = useMemo(() => {
    function Link({ href = "", ...props }: ComponentProps<"a">) {
      if (/^[a-z]+:/i.test(href) || href.startsWith("#"))
        return (
          <mdxComponents.a
            href={href}
            target="_blank"
            rel="noreferrer"
            {...props}
          />
        )
      const target = resolvePath(path, href.split("#")[0]!)
      const inside = paths.has(target)
      const onClick = (event: MouseEvent<HTMLAnchorElement>) => {
        if (!inside || event.metaKey || event.ctrlKey) return
        event.preventDefault()
        onSelect(target)
      }
      return (
        <mdxComponents.a
          href={`https://github.com/${REPO}/blob/${BRANCH}/${ROOT}/${target}`}
          target="_blank"
          rel="noreferrer"
          onClick={onClick}
          {...props}
        />
      )
    }
    return {
      ...mdxComponents,
      h1: H1,
      h2: H2,
      h3: H3,
      a: Link,
      table: Table,
      th: Th,
      td: Td,
      blockquote: Blockquote,
    }
  }, [path, paths, onSelect])

  const header = (
    <div className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-border bg-background py-2 pr-3 pl-5">
      <span className="truncate font-mono text-[0.8125rem] text-muted-foreground">
        {ROOT}/{path}
      </span>
      <div className="flex shrink-0 items-center gap-1">
        <CopyFileButton path={path} />
        <HeaderLink href={`${RAW_URL}/${ROOT}/${path}`}>Raw</HeaderLink>
        <HeaderLink href={githubUrl}>GitHub</HeaderLink>
      </div>
    </div>
  )

  if (!state || state.path !== path) {
    return (
      <div aria-busy className="flex flex-col">
        {header}
        <div className="flex flex-col gap-3 p-6">
          <Skeleton className="h-8 w-1/2" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      </div>
    )
  }

  if (state.status === "error") {
    return (
      <div className="flex flex-col">
        {header}
        <p className="p-6 text-sm text-muted-foreground">
          This file did not load ({state.message}). Read it on{" "}
          <mdxComponents.a href={githubUrl} target="_blank" rel="noreferrer">
            GitHub
          </mdxComponents.a>
          .
        </p>
      </div>
    )
  }

  const markdown = path.endsWith(".md")
  const { meta, body } = markdown
    ? splitFrontmatter(state.source)
    : { meta: {}, body: state.source }
  const tools = meta.tools?.split(",").map((tool) => tool.trim())

  return (
    <div className="flex min-w-0 flex-col">
      {header}
      <div className="min-w-0 px-6 pt-6 pb-10">
        {meta.description ? (
          <div className="mb-8 flex flex-col gap-3 rounded-xl border border-border bg-muted p-4">
            <div className="flex flex-wrap items-center gap-2">
              {meta.name ? (
                <code className="font-mono text-sm font-semibold text-foreground">
                  {meta.name}
                </code>
              ) : null}
              {tools?.map((tool) => (
                <Badge key={tool} variant="outline">
                  {tool}
                </Badge>
              ))}
            </div>
            <p className="text-sm leading-6 text-muted-foreground">
              {meta.description}
            </p>
          </div>
        ) : null}
        {markdown ? (
          <Markdown options={{ overrides }}>{body}</Markdown>
        ) : (
          <mdxComponents.code className="language-js">
            {body}
          </mdxComponents.code>
        )}
      </div>
    </div>
  )
}

function SkillsBrowser() {
  const [paths, setPaths] = useState<string[]>()
  const [error, setError] = useState<string>()
  const [expanded, setExpanded] = useState(() => new Set(["skills", "agents"]))
  const [selected, setSelected] = useState("README.md")
  const viewRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let live = true
    loadPaths().then(
      (next) => live && setPaths(next),
      (reason: Error) => live && setError(reason.message)
    )
    return () => {
      live = false
    }
  }, [])

  const root = useMemo(() => (paths ? buildTree(paths) : undefined), [paths])
  const pathSet = useMemo(() => new Set(paths), [paths])

  const toggle = (path: string, open?: boolean) =>
    setExpanded((current) => {
      const next = new Set(current)
      if (open ?? !next.has(path)) next.add(path)
      else next.delete(path)
      return next
    })

  // Opening a file from a link also opens the folders above it, so the tree
  // always shows where the reader is.
  const select = useCallback((path: string) => {
    setSelected(path)
    setExpanded((current) => {
      const next = new Set(current)
      const parts = path.split("/")
      for (let index = 1; index < parts.length; index++)
        next.add(parts.slice(0, index).join("/"))
      return next
    })
    if (viewRef.current) {
      viewRef.current.scrollTop = 0
      viewRef.current.scrollIntoView({ block: "nearest" })
    }
  }, [])

  if (error) {
    return (
      <p className="my-6 rounded-xl border border-border p-6 text-sm text-muted-foreground">
        The skills did not load from GitHub ({error}). Browse them in the{" "}
        <mdxComponents.a
          href={LINKS.designSkills}
          target="_blank"
          rel="noreferrer"
        >
          design-skills repo
        </mdxComponents.a>{" "}
        instead.
      </p>
    )
  }

  const skills = paths?.filter((path) =>
    /^skills\/[^/]+\/SKILL\.md$/.test(path)
  )
  const agents = paths?.filter((path) => /^agents\/[^/]+\.md$/.test(path))

  return (
    <div className="my-8 flex flex-col gap-3">
      <p className="text-sm text-muted-foreground">
        {paths ? (
          <>
            {skills!.length} skills, {agents!.length} reviewer agents,{" "}
            {paths.length} files
          </>
        ) : (
          "Loading the file tree from GitHub"
        )}
      </p>
      <div className="grid overflow-hidden rounded-2xl border border-border md:h-[44rem] md:grid-cols-[17rem_minmax(0,1fr)]">
        <nav
          aria-label="Design skills"
          className="max-h-80 overflow-y-auto border-b border-border p-2 md:max-h-none md:border-r md:border-b-0"
        >
          {root ? (
            <FileTree
              root={root}
              expanded={expanded}
              selected={selected}
              onToggle={toggle}
              onSelect={select}
            />
          ) : (
            <div aria-busy className="flex flex-col gap-2 p-2">
              {Array.from({ length: 8 }, (_, index) => (
                <Skeleton key={index} className="h-5 w-full" />
              ))}
            </div>
          )}
        </nav>
        <div ref={viewRef} className="min-w-0 scroll-mt-8 overflow-y-auto">
          {paths ? (
            <FileView path={selected} paths={pathSet} onSelect={select} />
          ) : null}
        </div>
      </div>
    </div>
  )
}

export { SkillsBrowser }
